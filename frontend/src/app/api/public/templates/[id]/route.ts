import { NextResponse } from 'next/server';
import { loadTemplateCatalog } from '@/lib/templateCatalog';

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const catalog = await loadTemplateCatalog();

  if (!catalog) {
    return NextResponse.json({ error: 'Template catalog unavailable.' }, { status: 200 });
  }

  const params = await context.params;
  const templateId = params.id;

  for (const [milestoneId, milestone] of Object.entries(catalog.milestones)) {
    const match = milestone.templates.find((template) => template.id === templateId);
    if (match) {
      return NextResponse.json(
        {
          template: {
            ...match,
            templateId: match.id,
            milestone: milestoneId,
            milestoneName: milestone.name,
          },
        },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ template: null }, { status: 200 });
}
