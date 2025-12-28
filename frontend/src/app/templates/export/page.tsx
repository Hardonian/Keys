/**
 * Export/Import Templates Page
 * 
 * Export and import template customizations
 */

'use client';

import { useState } from 'react';
import { useTemplateExport } from '@/hooks/useTemplateExport';
import { toast } from '@/components/Toast';

export default function ExportTemplatesPage() {
  const { downloadExport, importCustomizations, loading } = useTemplateExport();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = async (format: 'json' | 'yaml' | 'csv') => {
    try {
      await downloadExport(format);
      toast.success(`Export downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export customizations');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setImporting(true);
      const text = await importFile.text();
      const data = JSON.parse(text);

      const result = await importCustomizations(data, {
        overwriteExisting: true,
        skipErrors: true,
      });

      toast.success(
        `Imported ${result.imported.length} customizations. ${result.skipped.length} skipped.`
      );

      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} errors occurred during import`);
      }

      setImportFile(null);
    } catch (error) {
      toast.error('Failed to import customizations. Check file format.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="export-templates-page">
      <div className="page-header">
        <h1>Export/Import Templates</h1>
      </div>

      <div className="export-section">
        <h2>Export Customizations</h2>
        <p>Download your template customizations as a backup</p>
        <div className="export-actions">
          <button onClick={() => handleExport('json')} className="btn-primary" disabled={loading}>
            Export as JSON
          </button>
          <button onClick={() => handleExport('yaml')} className="btn-secondary" disabled={loading}>
            Export as YAML
          </button>
          <button onClick={() => handleExport('csv')} className="btn-secondary" disabled={loading}>
            Export as CSV
          </button>
        </div>
      </div>

      <div className="import-section">
        <h2>Import Customizations</h2>
        <p>Restore customizations from a backup file</p>
        <div className="import-form">
          <input
            type="file"
            accept=".json,.yaml"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="file-input"
          />
          <button
            onClick={handleImport}
            className="btn-primary"
            disabled={!importFile || importing}
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
        <p className="form-help">
          Import will overwrite existing customizations. Make sure to export first as a backup.
        </p>
      </div>
    </div>
  );
}
