import { CellAnnotations } from './CellAnnotations';
import { EnterprisePromotionPanel } from './EnterprisePromotionPanel';
import { NotebookHeaderOverlay } from './NotebookHeaderOverlay';
import { demoAnnotations, demoEnterpriseConfig, demoRunbookManifest } from './demoRunbook';

export function RunbookOverlayDemo() {
  return (
    <div className="space-y-6">
      <NotebookHeaderOverlay manifest={demoRunbookManifest} runState="active" />
      <EnterprisePromotionPanel config={demoEnterpriseConfig} />
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Inline Cell Annotations</h3>
        <p className="mt-1 text-sm text-slate-600">
          Contextual notes that sit beside notebook cells or runbook steps.
        </p>
      </div>
      <CellAnnotations annotations={demoAnnotations} />
    </div>
  );
}
