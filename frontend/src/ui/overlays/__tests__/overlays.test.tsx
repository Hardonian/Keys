import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CellAnnotations } from '../CellAnnotations';
import { EnterprisePromotionPanel } from '../EnterprisePromotionPanel';
import { NotebookHeaderOverlay } from '../NotebookHeaderOverlay';
import { demoAnnotations, demoEnterpriseConfig, demoRunbookManifest } from '../demoRunbook';

describe('Runbook overlays', () => {
  it('renders the notebook header overlay', () => {
    render(<NotebookHeaderOverlay manifest={demoRunbookManifest} runState="active" />);
    expect(screen.getByText('Notebook Runbook')).toBeInTheDocument();
    expect(screen.getByText(demoRunbookManifest.name)).toBeInTheDocument();
    expect(screen.getByText(demoRunbookManifest.description)).toBeInTheDocument();
  });

  it('renders inline annotations', () => {
    render(<CellAnnotations annotations={demoAnnotations} />);
    expect(
      screen.getByText('Endpoint returned intermittent 500 responses during peak traffic.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Replay only the last 2 hours while backlog stabilizes.')).toBeInTheDocument();
  });

  it('hides enterprise panel when config is disabled', () => {
    const { container } = render(<EnterprisePromotionPanel config={{ ...demoEnterpriseConfig, enabled: false }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders enterprise panel when config is enabled', () => {
    render(<EnterprisePromotionPanel config={demoEnterpriseConfig} />);
    expect(screen.getByText(`Promote to ${demoEnterpriseConfig.orgName} catalog`)).toBeInTheDocument();
  });
});
