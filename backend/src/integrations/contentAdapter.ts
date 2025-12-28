/**
 * Content Adapter - Generic adapter for generating communication artifacts
 * Replaces CapCut adapter with generic content generation for:
 * - Release notes
 * - Changelogs
 * - Announcements
 * - Onboarding docs
 * - Internal updates
 */

export interface ContentArtifact {
  title: string;
  type: 'release_notes' | 'changelog' | 'announcement' | 'onboarding' | 'internal_update' | 'rfc' | 'adr';
  sections: ContentSection[];
  metadata?: {
    version?: string;
    date?: string;
    author?: string;
    tags?: string[];
  };
}

export interface ContentSection {
  heading: string;
  content: string;
  bulletPoints?: string[];
}

export class ContentAdapter {
  /**
   * Generate release notes from changelog data
   */
  generateReleaseNotes(
    version: string,
    changes: {
      features?: string[];
      fixes?: string[];
      breaking?: string[];
      improvements?: string[];
    },
    options?: {
      tone?: 'formal' | 'casual' | 'technical';
      includeMigrationGuide?: boolean;
    }
  ): ContentArtifact {
    const sections: ContentSection[] = [];

    if (changes.features && changes.features.length > 0) {
      sections.push({
        heading: '✨ New Features',
        content: '',
        bulletPoints: changes.features,
      });
    }

    if (changes.improvements && changes.improvements.length > 0) {
      sections.push({
        heading: '🚀 Improvements',
        content: '',
        bulletPoints: changes.improvements,
      });
    }

    if (changes.fixes && changes.fixes.length > 0) {
      sections.push({
        heading: '🐛 Bug Fixes',
        content: '',
        bulletPoints: changes.fixes,
      });
    }

    if (changes.breaking && changes.breaking.length > 0) {
      sections.push({
        heading: '⚠️ Breaking Changes',
        content: '',
        bulletPoints: changes.breaking,
      });

      if (options?.includeMigrationGuide) {
        sections.push({
          heading: '📖 Migration Guide',
          content: 'See MIGRATION.md for detailed migration instructions.',
        });
      }
    }

    return {
      title: `Release ${version}`,
      type: 'release_notes',
      sections,
      metadata: {
        version,
        date: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate changelog entry
   */
  generateChangelogEntry(
    version: string,
    date: string,
    changes: Record<string, string[]>
  ): ContentArtifact {
    const sections: ContentSection[] = Object.entries(changes).map(([category, items]) => ({
      heading: category,
      content: '',
      bulletPoints: items,
    }));

    return {
      title: `Changelog - ${version}`,
      type: 'changelog',
      sections,
      metadata: {
        version,
        date,
      },
    };
  }

  /**
   * Generate RFC (Request for Comments) structure
   */
  generateRFC(
    title: string,
    summary: string,
    motivation: string,
    design: string,
    alternatives?: string[]
  ): ContentArtifact {
    const sections: ContentSection[] = [
      {
        heading: 'Summary',
        content: summary,
      },
      {
        heading: 'Motivation',
        content: motivation,
      },
      {
        heading: 'Design',
        content: design,
      },
    ];

    if (alternatives && alternatives.length > 0) {
      sections.push({
        heading: 'Alternatives Considered',
        content: '',
        bulletPoints: alternatives,
      });
    }

    return {
      title,
      type: 'rfc',
      sections,
      metadata: {
        date: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate ADR (Architecture Decision Record)
   */
  generateADR(
    title: string,
    status: 'proposed' | 'accepted' | 'deprecated' | 'superseded',
    context: string,
    decision: string,
    consequences: string[]
  ): ContentArtifact {
    const sections: ContentSection[] = [
      {
        heading: 'Status',
        content: status,
      },
      {
        heading: 'Context',
        content: context,
      },
      {
        heading: 'Decision',
        content: decision,
      },
      {
        heading: 'Consequences',
        content: '',
        bulletPoints: consequences,
      },
    ];

    return {
      title,
      type: 'adr',
      sections,
      metadata: {
        date: new Date().toISOString(),
        tags: [status],
      },
    };
  }

  /**
   * Format content artifact as markdown
   */
  formatAsMarkdown(artifact: ContentArtifact): string {
    const lines: string[] = [];

    lines.push(`# ${artifact.title}`);
    lines.push('');

    if (artifact.metadata?.version) {
      lines.push(`**Version:** ${artifact.metadata.version}`);
    }
    if (artifact.metadata?.date) {
      lines.push(`**Date:** ${new Date(artifact.metadata.date).toLocaleDateString()}`);
    }
    if (artifact.metadata?.author) {
      lines.push(`**Author:** ${artifact.metadata.author}`);
    }
    if (artifact.metadata?.tags && artifact.metadata.tags.length > 0) {
      lines.push(`**Tags:** ${artifact.metadata.tags.join(', ')}`);
    }
    lines.push('');

    artifact.sections.forEach((section) => {
      lines.push(`## ${section.heading}`);
      lines.push('');

      if (section.content) {
        lines.push(section.content);
        lines.push('');
      }

      if (section.bulletPoints && section.bulletPoints.length > 0) {
        section.bulletPoints.forEach((point) => {
          lines.push(`- ${point}`);
        });
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  /**
   * Format content artifact as plain text
   */
  formatAsPlainText(artifact: ContentArtifact): string {
    const lines: string[] = [];

    lines.push(artifact.title);
    lines.push('='.repeat(artifact.title.length));
    lines.push('');

    artifact.sections.forEach((section) => {
      lines.push(section.heading);
      lines.push('-'.repeat(section.heading.length));
      lines.push('');

      if (section.content) {
        lines.push(section.content);
        lines.push('');
      }

      if (section.bulletPoints && section.bulletPoints.length > 0) {
        section.bulletPoints.forEach((point) => {
          lines.push(`• ${point}`);
        });
        lines.push('');
      }
    });

    return lines.join('\n');
  }
}

export const contentAdapter = new ContentAdapter();
