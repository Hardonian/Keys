package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/santhosh-tekuri/jsonschema/v5"
)

type Config struct {
	ArtifactsDir string
	OutputDir    string
	SchemaDir    string
	RepoRoot     string
	Strict       bool
}

type ArtifactMetadata struct {
	ID             string   `json:"id"`
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	Tags           []string `json:"tags"`
	Categories     []string `json:"categories"`
	ToolsSupported []string `json:"tools_supported"`
	CreatedAt      *string  `json:"created_at,omitempty"`
	UpdatedAt      *string  `json:"updated_at,omitempty"`
	SchemaVersion  string   `json:"schema_version"`
	ContentPath    string   `json:"content_path"`
	License        *string  `json:"license,omitempty"`
	SafetyNotes    *string  `json:"safety_notes,omitempty"`
}

type ValidationMessage struct {
	Message    string `json:"message"`
	ArtifactID string `json:"artifact_id,omitempty"`
	File       string `json:"file,omitempty"`
}

type ManifestFile struct {
	Path   string `json:"path"`
	SHA256 string `json:"sha256"`
}

type Manifest struct {
	Files []ManifestFile `json:"files"`
}

type OutputPaths struct {
	IndexJSON         string `json:"index_json"`
	ValidationReport  string `json:"validation_report"`
	ArtifactsManifest string `json:"artifacts_manifest"`
}

type IndexArtifact struct {
	ID             string   `json:"id"`
	Slug           string   `json:"slug"`
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	Tags           []string `json:"tags"`
	Categories     []string `json:"categories"`
	ToolsSupported []string `json:"tools_supported"`
	CreatedAt      *string  `json:"created_at,omitempty"`
	UpdatedAt      *string  `json:"updated_at,omitempty"`
	SchemaVersion  string   `json:"schema_version"`
	ContentPath    string   `json:"content_path"`
	License        *string  `json:"license,omitempty"`
	SafetyNotes    *string  `json:"safety_notes,omitempty"`
	SearchableText string   `json:"searchable_text"`
}

type IndexOutput struct {
	SchemaVersion string              `json:"schema_version"`
	ToolVersion   string              `json:"tool_version"`
	ArtifactCount int                 `json:"artifact_count"`
	Warnings      []ValidationMessage `json:"warnings"`
	Errors        []ValidationMessage `json:"errors"`
	OutputPaths   OutputPaths         `json:"output_paths"`
	Manifest      Manifest            `json:"manifest"`
	Artifacts     []IndexArtifact     `json:"artifacts"`
}

type ValidationReport struct {
	SchemaVersion string              `json:"schema_version"`
	ToolVersion   string              `json:"tool_version"`
	GeneratedAt   string              `json:"generated_at"`
	Warnings      []ValidationMessage `json:"warnings"`
	Errors        []ValidationMessage `json:"errors"`
}

func Run(config Config) error {
	if config.ArtifactsDir == "" || config.OutputDir == "" || config.SchemaDir == "" {
		return errors.New("artifacts-dir, output-dir, and schema-dir must be set")
	}

	metadataSchema, err := loadSchema(filepath.Join(config.SchemaDir, "artifact_metadata.schema.json"))
	if err != nil {
		return fmt.Errorf("load metadata schema: %w", err)
	}

	repoRoot := config.RepoRoot
	if repoRoot == "" {
		wd, err := os.Getwd()
		if err != nil {
			return fmt.Errorf("resolve repo root: %w", err)
		}
		repoRoot = wd
	}
	repoRoot, err = filepath.Abs(repoRoot)
	if err != nil {
		return fmt.Errorf("resolve repo root: %w", err)
	}

	entries, err := collectMetadataFiles(config.ArtifactsDir)
	if err != nil {
		return fmt.Errorf("scan artifacts: %w", err)
	}

	var warnings []ValidationMessage
	var validationErrors []ValidationMessage
	var artifacts []IndexArtifact
	manifestFiles := []ManifestFile{}
	seenIDs := map[string]struct{}{}

	for _, entry := range entries {
		rawBytes, readErr := os.ReadFile(entry)
		if readErr != nil {
			validationErrors = append(validationErrors, ValidationMessage{Message: fmt.Sprintf("failed to read metadata: %v", readErr), File: entry})
			continue
		}

		var rawData interface{}
		if err := json.Unmarshal(rawBytes, &rawData); err != nil {
			validationErrors = append(validationErrors, ValidationMessage{Message: fmt.Sprintf("invalid JSON: %v", err), File: entry})
			continue
		}

		if err := metadataSchema.Validate(rawData); err != nil {
			validationErrors = append(validationErrors, ValidationMessage{Message: fmt.Sprintf("schema validation failed: %v", err), File: entry})
			continue
		}

		var meta ArtifactMetadata
		if err := json.Unmarshal(rawBytes, &meta); err != nil {
			validationErrors = append(validationErrors, ValidationMessage{Message: fmt.Sprintf("failed to parse metadata: %v", err), File: entry})
			continue
		}

		if meta.SchemaVersion != metadataSchemaVersion {
			validationErrors = append(validationErrors, ValidationMessage{Message: fmt.Sprintf("unsupported metadata schema_version %q", meta.SchemaVersion), File: entry, ArtifactID: meta.ID})
			continue
		}

		if !isValidID(meta.ID) {
			validationErrors = append(validationErrors, ValidationMessage{Message: "id must be lowercase kebab-case, numbers, or underscores", File: entry, ArtifactID: meta.ID})
			continue
		}

		if _, exists := seenIDs[meta.ID]; exists {
			validationErrors = append(validationErrors, ValidationMessage{Message: "duplicate id detected", File: entry, ArtifactID: meta.ID})
			continue
		}
		seenIDs[meta.ID] = struct{}{}

		normalizedTags, tagWarnings := normalizeList(meta.Tags, meta.ID, entry)
		normalizedCategories, categoryWarnings := normalizeList(meta.Categories, meta.ID, entry)
		normalizedTools, toolsWarnings := normalizeList(meta.ToolsSupported, meta.ID, entry)
		warnings = append(warnings, tagWarnings...)
		warnings = append(warnings, categoryWarnings...)
		warnings = append(warnings, toolsWarnings...)

		contentPath := filepath.Clean(meta.ContentPath)
		if filepath.IsAbs(contentPath) || strings.HasPrefix(contentPath, "..") {
			validationErrors = append(validationErrors, ValidationMessage{Message: "content_path must be a relative path within the repo", File: entry, ArtifactID: meta.ID})
			continue
		}

		contentAbs := filepath.Join(repoRoot, contentPath)
		if _, err := os.Stat(contentAbs); err != nil {
			validationErrors = append(validationErrors, ValidationMessage{Message: fmt.Sprintf("content_path not found: %v", err), File: entry, ArtifactID: meta.ID})
			continue
		}

		searchable := buildSearchableText(meta.Title, meta.Description, normalizedTags, normalizedCategories, normalizedTools)

		artifacts = append(artifacts, IndexArtifact{
			ID:             meta.ID,
			Slug:           meta.ID,
			Title:          meta.Title,
			Description:    meta.Description,
			Tags:           normalizedTags,
			Categories:     normalizedCategories,
			ToolsSupported: normalizedTools,
			CreatedAt:      meta.CreatedAt,
			UpdatedAt:      meta.UpdatedAt,
			SchemaVersion:  meta.SchemaVersion,
			ContentPath:    meta.ContentPath,
			License:        meta.License,
			SafetyNotes:    meta.SafetyNotes,
			SearchableText: searchable,
		})

		metaHash, err := hashFile(entry)
		if err != nil {
			validationErrors = append(validationErrors, ValidationMessage{Message: fmt.Sprintf("failed to hash metadata file: %v", err), File: entry, ArtifactID: meta.ID})
			continue
		}

		contentHash, err := hashFile(contentAbs)
		if err != nil {
			validationErrors = append(validationErrors, ValidationMessage{Message: fmt.Sprintf("failed to hash content file: %v", err), File: entry, ArtifactID: meta.ID})
			continue
		}

		manifestFiles = append(manifestFiles,
			ManifestFile{Path: relativePath(repoRoot, entry), SHA256: metaHash},
			ManifestFile{Path: relativePath(repoRoot, contentAbs), SHA256: contentHash},
		)
	}

	sort.Slice(artifacts, func(i, j int) bool {
		return artifacts[i].ID < artifacts[j].ID
	})

	sort.Slice(manifestFiles, func(i, j int) bool {
		return manifestFiles[i].Path < manifestFiles[j].Path
	})

	outputPaths := OutputPaths{
		IndexJSON:         "keys-index.json",
		ValidationReport:  "validation_report.json",
		ArtifactsManifest: "artifacts_manifest.json",
	}

	indexOutput := IndexOutput{
		SchemaVersion: indexSchemaVersion,
		ToolVersion:   toolVersion,
		ArtifactCount: len(artifacts),
		Warnings:      warnings,
		Errors:        validationErrors,
		OutputPaths:   outputPaths,
		Manifest:      Manifest{Files: manifestFiles},
		Artifacts:     artifacts,
	}

	report := ValidationReport{
		SchemaVersion: indexSchemaVersion,
		ToolVersion:   toolVersion,
		GeneratedAt:   reportTimestamp(),
		Warnings:      warnings,
		Errors:        validationErrors,
	}

	if err := os.MkdirAll(config.OutputDir, 0o755); err != nil {
		return fmt.Errorf("create output dir: %w", err)
	}

	if err := writeJSON(filepath.Join(config.OutputDir, outputPaths.IndexJSON), indexOutput); err != nil {
		return fmt.Errorf("write index: %w", err)
	}

	if err := writeJSON(filepath.Join(config.OutputDir, outputPaths.ValidationReport), report); err != nil {
		return fmt.Errorf("write validation report: %w", err)
	}

	if err := writeJSON(filepath.Join(config.OutputDir, outputPaths.ArtifactsManifest), Manifest{Files: manifestFiles}); err != nil {
		return fmt.Errorf("write manifest: %w", err)
	}

	if config.Strict && len(validationErrors) > 0 {
		return fmt.Errorf("validation failed with %d error(s)", len(validationErrors))
	}

	return nil
}

func loadSchema(path string) (*jsonschema.Schema, error) {
	abs, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}
	compiler := jsonschema.NewCompiler()
	schema, err := compiler.Compile("file://" + filepath.ToSlash(abs))
	if err != nil {
		return nil, err
	}
	return schema, nil
}

func collectMetadataFiles(root string) ([]string, error) {
	var entries []string
	if err := filepath.WalkDir(root, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() {
			return nil
		}
		if strings.HasSuffix(entry.Name(), ".metadata.json") {
			entries = append(entries, path)
		}
		return nil
	}); err != nil {
		return nil, err
	}
	sort.Strings(entries)
	return entries, nil
}

func normalizeList(values []string, artifactID, file string) ([]string, []ValidationMessage) {
	normalized := make([]string, 0, len(values))
	warnings := []ValidationMessage{}
	seen := map[string]struct{}{}
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		lower := strings.ToLower(trimmed)
		if lower != trimmed {
			warnings = append(warnings, ValidationMessage{Message: fmt.Sprintf("normalized value %q to %q", trimmed, lower), ArtifactID: artifactID, File: file})
		}
		if _, exists := seen[lower]; exists {
			warnings = append(warnings, ValidationMessage{Message: fmt.Sprintf("duplicate value %q removed", lower), ArtifactID: artifactID, File: file})
			continue
		}
		seen[lower] = struct{}{}
		normalized = append(normalized, lower)
	}
	sort.Strings(normalized)
	return normalized, warnings
}

func isValidID(id string) bool {
	if id == "" {
		return false
	}
	for i, r := range id {
		if r >= 'a' && r <= 'z' {
			continue
		}
		if r >= '0' && r <= '9' {
			continue
		}
		if r == '-' || r == '_' {
			continue
		}
		if i == 0 {
			return false
		}
		return false
	}
	return true
}

func buildSearchableText(parts ...interface{}) string {
	var builder strings.Builder
	for _, part := range parts {
		switch value := part.(type) {
		case string:
			if value == "" {
				continue
			}
			builder.WriteString(strings.ToLower(value))
			builder.WriteRune(' ')
		case []string:
			for _, item := range value {
				if item == "" {
					continue
				}
				builder.WriteString(strings.ToLower(item))
				builder.WriteRune(' ')
			}
		}
	}
	return strings.TrimSpace(builder.String())
}

func hashFile(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}

func writeJSON(path string, payload interface{}) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	encoder.SetEscapeHTML(false)
	if err := encoder.Encode(payload); err != nil {
		return err
	}
	return nil
}

func reportTimestamp() string {
	if epoch := os.Getenv("SOURCE_DATE_EPOCH"); epoch != "" {
		if seconds, err := strconv.ParseInt(epoch, 10, 64); err == nil {
			return time.Unix(seconds, 0).UTC().Format(time.RFC3339)
		}
	}
	return time.Now().UTC().Format(time.RFC3339)
}

func relativePath(root, target string) string {
	rel, err := filepath.Rel(root, target)
	if err != nil {
		return target
	}
	return filepath.ToSlash(rel)
}
