# Key Taxonomy

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Universal classification system  
**Purpose**: Discoverability moat through clean, inevitable taxonomy

---

## Overview

All marketplace assets in KEYS are classified using a three-dimensional taxonomy:

1. **By Tool** — Which tool does this key unlock? (orthogonal, stable)
2. **By Outcome** — What practical outcome does this unlock? (buyer intent)
3. **By Maturity** — What level of expertise does this require? (user lifecycle)

This taxonomy is **enforced** at:
- Metadata level
- UI filtering
- Bundling logic
- Analytics reporting

---

## 1. Keys by Tool

Keys are organized by the external tool they unlock capability in. This dimension is **orthogonal** (keys don't overlap) and **stable** (tools don't change frequently).

### Cursor Keys
**Tool**: Cursor (AI-powered code editor)  
**What They Unlock**: Advanced workflows, prompt patterns, code generation strategies  
**Key Types**: Prompt packs, Composer instructions, template keys  
**Examples**:
- Cursor Keys: Authentication Scaffolding
- Cursor Keys: Database Migration Patterns
- Cursor Keys: API Route Generation

**Metadata**: `tool = "cursor"`, `key_type = "prompt"` or `key_type = "composer"` or `key_type = "template"`

### Jupyter Keys
**Tool**: Jupyter Notebooks  
**What They Unlock**: Data science workflows, analysis patterns, validation harnesses  
**Key Types**: Notebooks (`.ipynb` files)  
**Examples**:
- Jupyter Keys: Data Analysis Basics
- Jupyter Keys: Model Validation Patterns
- Jupyter Keys: EDA Workflows

**Metadata**: `tool = "jupyter"`, `key_type = "notebook"`

### GitHub Keys
**Tool**: GitHub  
**What They Unlock**: Workflow automation, CI/CD patterns, repository structures  
**Key Types**: Workflows, templates, playbooks  
**Examples**:
- GitHub Keys: CI/CD Starter Workflows
- GitHub Keys: Repository Templates
- GitHub Keys: Issue Management Patterns

**Metadata**: `tool = "github"`, `key_type = "workflow"` or `key_type = "template"` or `key_type = "playbook"`

### Stripe Keys
**Tool**: Stripe  
**What They Unlock**: Payment flows, subscription management, billing patterns  
**Key Types**: Workflows, playbooks, guides  
**Examples**:
- Stripe Keys: Subscription Management
- Stripe Keys: Payment Flow Patterns
- Stripe Keys: Webhook Handling

**Metadata**: `tool = "stripe"`, `key_type = "workflow"` or `key_type = "playbook"` or `key_type = "guide"`

### Supabase Keys
**Tool**: Supabase  
**What They Unlock**: Database patterns, auth flows, real-time patterns  
**Key Types**: Workflows, templates, playbooks  
**Examples**:
- Supabase Keys: RLS Policy Patterns
- Supabase Keys: Auth Flow Templates
- Supabase Keys: Real-time Subscription Patterns

**Metadata**: `tool = "supabase"`, `key_type = "workflow"` or `key_type = "template"` or `key_type = "playbook"`

### AI Studio Keys
**Tool**: AI Studio / OpenAI / Anthropic / etc.  
**What They Unlock**: Model fine-tuning, prompt engineering, API patterns  
**Key Types**: Workflows, playbooks, guides  
**Examples**:
- AI Studio Keys: Fine-tuning Workflows
- AI Studio Keys: Prompt Engineering Patterns
- AI Studio Keys: API Integration Patterns

**Metadata**: `tool = "ai_studio"`, `key_type = "workflow"` or `key_type = "playbook"` or `key_type = "guide"`

### Cloud / Infra Keys
**Tool**: AWS / GCP / Azure / Vercel / etc.  
**What They Unlock**: Infrastructure patterns, deployment workflows, cloud operations  
**Key Types**: Workflows, templates, playbooks  
**Examples**:
- AWS Keys: Lambda Deployment Patterns
- Vercel Keys: Next.js Deployment Workflows
- GCP Keys: Cloud Run Patterns

**Metadata**: `tool = "cloud"` or specific tool name, `key_type = "workflow"` or `key_type = "template"` or `key_type = "playbook"`

### Extensible
New tools can be added as needed. The taxonomy is extensible. When adding a new tool:
1. Define what capability it unlocks
2. Define what key types are allowed
3. Add to metadata schema
4. Update UI filtering

---

## 2. Keys by Outcome

Keys are organized by the practical outcome they unlock. This dimension reflects **buyer intent**—what problem does the buyer want to solve?

### Automation Keys
**Outcome**: Automate repetitive tasks or workflows  
**Buyer Intent**: "I want to automate X"  
**Examples**:
- GitHub Keys: Automated Deployment
- Stripe Keys: Automated Subscription Management
- Cursor Keys: Automated Code Generation

**Metadata**: `outcome = "automation"`

### Monetization Keys
**Outcome**: Unlock revenue-generating capabilities  
**Buyer Intent**: "I want to make money from X"  
**Examples**:
- Stripe Keys: Subscription Setup
- Stripe Keys: Payment Processing
- GitHub Keys: SaaS Starter Templates

**Metadata**: `outcome = "monetization"`

### Validation Keys
**Outcome**: Unlock testing, validation, and quality assurance patterns  
**Buyer Intent**: "I want to validate X"  
**Examples**:
- Jupyter Keys: Model Validation Harnesses
- Cursor Keys: Test Generation Patterns
- GitHub Keys: CI/CD Testing Workflows

**Metadata**: `outcome = "validation"`

### Compliance Keys
**Outcome**: Unlock regulatory compliance, security, and governance patterns  
**Buyer Intent**: "I want to comply with X"  
**Examples**:
- Supabase Keys: GDPR Compliance Patterns
- Stripe Keys: PCI Compliance Workflows
- GitHub Keys: Security Scanning Workflows

**Metadata**: `outcome = "compliance"`

### Consulting Keys
**Outcome**: Unlock client delivery patterns, project templates, and consulting workflows  
**Buyer Intent**: "I want to deliver X to clients"  
**Examples**:
- Cursor Keys: Client Project Scaffolds
- GitHub Keys: Client Repository Templates
- Jupyter Keys: Client Analysis Templates

**Metadata**: `outcome = "consulting"`

### SaaS Builder Keys
**Outcome**: Unlock patterns for building SaaS products  
**Buyer Intent**: "I want to build a SaaS product"  
**Examples**:
- Stripe + Supabase Keys: SaaS Starter Stack
- GitHub Keys: SaaS Repository Templates
- Cursor Keys: SaaS Code Generation Patterns

**Metadata**: `outcome = "saas_builder"`

### Data Ops Keys
**Outcome**: Unlock data operations, ETL, and data pipeline patterns  
**Buyer Intent**: "I want to process/manage data"  
**Examples**:
- Jupyter Keys: ETL Workflows
- Jupyter Keys: Data Pipeline Patterns
- GitHub Keys: Data Processing Automation

**Metadata**: `outcome = "data_ops"`

### Decision Support Keys
**Outcome**: Unlock analysis and decision-making patterns  
**Buyer Intent**: "I want to make data-driven decisions"  
**Examples**:
- Jupyter Keys: Business Analysis Patterns
- Jupyter Keys: A/B Testing Workflows
- Cursor Keys: Analytics Code Generation

**Metadata**: `outcome = "decision_support"`

---

## 3. Keys by Maturity

Keys are organized by the level of expertise required. This dimension reflects the **user lifecycle**—where is the user in their journey?

### Starter Keys
**Maturity**: Beginner-friendly, minimal prerequisites  
**User Lifecycle**: First-time users, learning the tool  
**Characteristics**:
- Clear step-by-step instructions
- Minimal tool knowledge required
- Self-contained examples
- Beginner-friendly documentation
- Assumes no prior experience

**Examples**:
- Cursor Keys: First Prompt Pack (Starter)
- Jupyter Keys: Data Analysis Basics (Starter)
- Stripe Keys: First Payment Flow (Starter)

**Metadata**: `maturity = "starter"`

### Operator Keys
**Maturity**: Intermediate, assumes basic tool knowledge  
**User Lifecycle**: Regular users, optimizing workflows  
**Characteristics**:
- Assumes familiarity with tool
- Focuses on patterns and best practices
- Requires some customization
- Intermediate documentation
- Assumes basic proficiency

**Examples**:
- Cursor Keys: Advanced Scaffolding (Operator)
- Jupyter Keys: Model Validation Patterns (Operator)
- Stripe Keys: Subscription Management (Operator)

**Metadata**: `maturity = "operator"`

### Scale Keys
**Maturity**: Advanced, assumes expert-level tool knowledge  
**User Lifecycle**: Power users, scaling operations  
**Characteristics**:
- Assumes deep tool expertise
- Focuses on optimization and scale
- Requires significant customization
- Advanced documentation
- Assumes expert proficiency

**Examples**:
- Cursor Keys: Enterprise Code Generation (Scale)
- Jupyter Keys: Production ML Pipelines (Scale)
- Stripe Keys: Multi-Product Billing (Scale)

**Metadata**: `maturity = "scale"`

### Enterprise Keys
**Maturity**: Expert, assumes organizational-level knowledge  
**User Lifecycle**: Enterprise users, organizational deployment  
**Characteristics**:
- Assumes organizational context
- Focuses on governance and compliance
- Requires organizational customization
- Enterprise documentation
- Assumes organizational proficiency

**Examples**:
- Cursor Keys: Enterprise Security Patterns (Enterprise)
- GitHub Keys: Enterprise CI/CD Workflows (Enterprise)
- Stripe Keys: Enterprise Billing Systems (Enterprise)

**Metadata**: `maturity = "enterprise"`

---

## Taxonomy in Practice

### Example 1: Cursor Key
```json
{
  "slug": "cursor-auth-scaffold",
  "title": "Cursor Keys: Authentication Scaffolding",
  "tool": "cursor",
  "key_type": "prompt",
  "outcome": "automation",
  "maturity": "operator",
  "description": "Unlock advanced authentication scaffolding workflows in Cursor"
}
```

**Discovery**: Users can find this by:
- Tool: "Show me all Cursor Keys"
- Outcome: "Show me all Automation Keys"
- Maturity: "Show me all Operator Keys"
- Combination: "Show me Operator Cursor Keys for Automation"

### Example 2: Jupyter Key
```json
{
  "slug": "jupyter-data-analysis-basics",
  "title": "Jupyter Keys: Data Analysis Basics",
  "tool": "jupyter",
  "key_type": "notebook",
  "outcome": "decision_support",
  "maturity": "starter",
  "description": "Unlock fundamental data analysis workflows in Jupyter"
}
```

**Discovery**: Users can find this by:
- Tool: "Show me all Jupyter Keys"
- Outcome: "Show me all Decision Support Keys"
- Maturity: "Show me all Starter Keys"
- Combination: "Show me Starter Jupyter Keys for Decision Support"

### Example 3: Stripe Key
```json
{
  "slug": "stripe-subscription-management",
  "title": "Stripe Keys: Subscription Management",
  "tool": "stripe",
  "key_type": "workflow",
  "outcome": "monetization",
  "maturity": "operator",
  "description": "Unlock subscription management patterns in Stripe"
}
```

**Discovery**: Users can find this by:
- Tool: "Show me all Stripe Keys"
- Outcome: "Show me all Monetization Keys"
- Maturity: "Show me all Operator Keys"
- Combination: "Show me Operator Stripe Keys for Monetization"

### Example 4: Cross-Tool Bundle
```json
{
  "slug": "saas-starter-stack",
  "title": "SaaS Starter Stack",
  "tools": ["stripe", "supabase", "github", "cursor"],
  "key_types": ["workflow", "template", "prompt"],
  "outcome": "saas_builder",
  "maturity": "starter",
  "description": "Unlock complete SaaS starter patterns across Stripe, Supabase, GitHub, and Cursor"
}
```

**Discovery**: Users can find this by:
- Outcome: "Show me all SaaS Builder Keys"
- Maturity: "Show me all Starter Keys"
- Cross-tool: "Show me all keys for building SaaS"

---

## Marketplace Metadata Schema

All marketplace assets must include:

```typescript
interface KeyMetadata {
  // Core identification
  slug: string;
  title: string;
  description: string;
  
  // Taxonomy (required)
  tool: string;           // "cursor" | "jupyter" | "github" | "stripe" | ...
  key_type: string;       // "prompt" | "notebook" | "workflow" | "template" | ...
  outcome: string;        // "automation" | "monetization" | "validation" | ...
  maturity: string;       // "starter" | "operator" | "scale" | "enterprise"
  
  // Additional metadata
  version: string;
  tags: string[];
  license_spdx: string;
  
  // Assets
  assets: {
    zip?: string;
    preview_html?: string;
    cover?: string;
    changelog_md?: string;
  };
  
  // Cross-tool bundles (optional)
  tools?: string[];        // For bundles that span multiple tools
}
```

---

## Discovery Patterns

Users can discover keys by:

1. **Tool**: "Show me all Cursor Keys"
2. **Outcome**: "Show me all Monetization Keys"
3. **Maturity**: "Show me all Starter Keys"
4. **Combination**: "Show me Starter Cursor Keys for Automation"
5. **Cross-tool**: "Show me all keys for building SaaS" (combines Stripe + Supabase + GitHub)
6. **Key Type**: "Show me all Notebook Keys"
7. **Multi-dimensional**: "Show me Operator Cursor Prompt Keys for Automation"

---

## Taxonomy Enforcement

This taxonomy is enforced at:

### Metadata Level
- All keys must have valid `tool`, `outcome`, and `maturity` values
- Invalid values are rejected at submission

### UI Filtering
- Marketplace UI filters by tool, outcome, and maturity
- Search respects taxonomy dimensions

### Bundling Logic
- Bundles can combine keys across tools but share outcomes
- Bundles respect maturity levels (Starter bundles, Operator bundles, etc.)

### Analytics Reporting
- Analytics track usage by tool, outcome, and maturity
- Reports show trends across taxonomy dimensions

---

## Why This Taxonomy Compounds Value

### Discoverability Moat
- Clean taxonomy makes discovery trivial
- Competitors without taxonomy struggle with discovery
- Users find what they need faster

### Upgrade Gravity
- Starter → Operator → Scale → Enterprise creates natural progression
- Users upgrade as they mature

### Cross-Tool Synergy
- Bundles combine keys across tools
- Users see value in multiple tools
- Increases total value per user

### Outcome Clarity
- Outcome dimension clarifies buyer intent
- Users know what problem they're solving
- Reduces purchase friction

---

## Version History

- **1.0.0** (2024-12-30): Initial universal taxonomy system
