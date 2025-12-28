/**
 * Template Filtering and Adaptation Utilities
 * 
 * Provides dynamic filtering and adaptation of templates based on:
 * - Tech stack
 * - Project requirements
 * - Security level
 * - Optimization needs
 * - Dependencies
 */

import catalog from './catalog.json' assert { type: 'json' };

/**
 * Filter templates based on criteria
 * @param {Object} criteria - Filter criteria
 * @param {string[]} criteria.milestone - Milestone IDs to include
 * @param {string[]} criteria.stack - Required tech stack
 * @param {string} criteria.priority - Minimum priority level
 * @param {string} criteria.security_level - Required security level
 * @param {string} criteria.optimization_level - Required optimization level
 * @param {string[]} criteria.tags - Required tags
 * @param {string[]} criteria.exclude_tags - Tags to exclude
 * @returns {Array} Filtered templates
 */
export function filterTemplates(criteria = {}) {
  const {
    milestone = [],
    stack = [],
    priority = 'low',
    security_level = 'optional',
    optimization_level = 'optional',
    tags = [],
    exclude_tags = [],
  } = criteria;

  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const securityOrder = { required: 3, recommended: 2, optional: 1 };
  const optimizationOrder = { required: 3, recommended: 2, optional: 1 };

  const minPriority = priorityOrder[priority] || 1;
  const minSecurity = securityOrder[security_level] || 1;
  const minOptimization = optimizationOrder[optimization_level] || 1;

  const results = [];

  for (const [milestoneId, milestoneData] of Object.entries(catalog.milestones)) {
    // Filter by milestone if specified
    if (milestone.length > 0 && !milestone.includes(milestoneId)) {
      continue;
    }

    for (const template of milestoneData.templates) {
      // Filter by priority
      if (priorityOrder[template.priority] < minPriority) {
        continue;
      }

      // Filter by security level
      if (securityOrder[template.security_level] < minSecurity) {
        continue;
      }

      // Filter by optimization level
      if (optimizationOrder[template.optimization_level] < minOptimization) {
        continue;
      }

      // Filter by stack
      if (stack.length > 0) {
        const hasStackMatch = stack.some(s => 
          template.stack.some(ts => ts.toLowerCase().includes(s.toLowerCase()))
        );
        if (!hasStackMatch) {
          continue;
        }
      }

      // Filter by tags (all must match)
      if (tags.length > 0) {
        const hasAllTags = tags.every(tag =>
          template.tags.some(tt => tt.toLowerCase() === tag.toLowerCase())
        );
        if (!hasAllTags) {
          continue;
        }
      }

      // Exclude by tags
      if (exclude_tags.length > 0) {
        const hasExcludedTag = exclude_tags.some(tag =>
          template.tags.some(tt => tt.toLowerCase() === tag.toLowerCase())
        );
        if (hasExcludedTag) {
          continue;
        }
      }

      results.push({
        ...template,
        milestone: milestoneId,
        milestoneName: milestoneData.name,
      });
    }
  }

  return results;
}

/**
 * Get templates in dependency order
 * @param {Array} templateIds - Template IDs to order
 * @returns {Array} Templates ordered by dependencies
 */
export function orderByDependencies(templateIds) {
  const allTemplates = getAllTemplates();
  const templateMap = new Map(allTemplates.map(t => [t.id, t]));
  const ordered = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(templateId) {
    if (visiting.has(templateId)) {
      throw new Error(`Circular dependency detected: ${templateId}`);
    }
    if (visited.has(templateId)) {
      return;
    }

    visiting.add(templateId);
    const template = templateMap.get(templateId);
    
    if (template && template.dependencies) {
      for (const depId of template.dependencies) {
        visit(depId);
      }
    }

    visiting.delete(templateId);
    visited.add(templateId);
    
    if (templateIds.includes(templateId)) {
      ordered.push(template);
    }
  }

  for (const templateId of templateIds) {
    visit(templateId);
  }

  return ordered;
}

/**
 * Get all templates flattened
 * @returns {Array} All templates
 */
export function getAllTemplates() {
  const results = [];
  for (const [milestoneId, milestoneData] of Object.entries(catalog.milestones)) {
    for (const template of milestoneData.templates) {
      results.push({
        ...template,
        milestone: milestoneId,
        milestoneName: milestoneData.name,
      });
    }
  }
  return results;
}

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object or null
 */
export function getTemplateById(templateId) {
  const allTemplates = getAllTemplates();
  return allTemplates.find(t => t.id === templateId) || null;
}

/**
 * Get templates for a milestone
 * @param {string} milestoneId - Milestone ID
 * @returns {Array} Templates for the milestone
 */
export function getTemplatesByMilestone(milestoneId) {
  const milestone = catalog.milestones[milestoneId];
  if (!milestone) {
    return [];
  }
  return milestone.templates.map(t => ({
    ...t,
    milestone: milestoneId,
    milestoneName: milestone.name,
  }));
}

/**
 * Get recommended template sequence for a project
 * @param {Object} projectConfig - Project configuration
 * @returns {Array} Recommended templates in order
 */
export function getRecommendedSequence(projectConfig = {}) {
  const {
    stack = [],
    securityFocus = true,
    performanceFocus = false,
  } = projectConfig;

  const criteria = {
    stack,
    priority: 'medium',
    security_level: securityFocus ? 'recommended' : 'optional',
    optimization_level: performanceFocus ? 'recommended' : 'optional',
  };

  const templates = filterTemplates(criteria);
  const templateIds = templates.map(t => t.id);
  
  return orderByDependencies(templateIds);
}
