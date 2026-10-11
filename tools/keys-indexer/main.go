package main

import (
	"flag"
	"fmt"
	"os"
)

const (
	metadataSchemaVersion = "1.0.0"
	indexSchemaVersion    = "1.0.0"
	toolVersion           = "0.1.0"
)

func main() {
	config := Config{}
	flag.StringVar(&config.ArtifactsDir, "artifacts-dir", "./docs/library", "Directory containing artifact metadata files.")
	flag.StringVar(&config.OutputDir, "output-dir", "./frontend/public", "Directory to write index outputs to.")
	flag.StringVar(&config.SchemaDir, "schema-dir", "./tools/keys-indexer/schemas", "Directory containing JSON schema files.")
	flag.StringVar(&config.RepoRoot, "repo-root", "", "Repository root used to resolve content_path values (defaults to the current working directory).")
	flag.BoolVar(&config.Strict, "strict", false, "Fail if any validation errors are found.")
	flag.Parse()

	if err := Run(config); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}
}
