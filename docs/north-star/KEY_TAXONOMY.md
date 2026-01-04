# Key Taxonomy

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Purpose**: Universal classification system for all marketplace assets

---

## Overview

All marketplace assets in KEYS are classified using a three-dimensional taxonomy:
1. **By Tool** - Which tool does this key unlock?
2. **By Outcome** - What practical outcome does this unlock?
3. **By Maturity** - What level of expertise does this require?

---

## 1. Keys by Tool

Keys are organized by the external tool they unlock capability in.

### Cursor Keys
**Tool**: Cursor (AI-powered code editor)  
**What They Unlock**: Advanced workflows, prompt patterns, code generation strategies  
**Examples**:
- Cursor Keys: Authentication Scaffolding
- Cursor Keys: Database Migration Patterns
- Cursor Keys: API Route Generation

**Metadata**: `tool = "cursor"`, `key_type = "prompt"` or `key_type = "composer"`

### Jupyter Keys
**Tool**: Jupyter Notebooks  
**What They Unlock**: Data science workflows, analysis patterns, validation harnesses  
**Examples**:
- Jupyter Keys: Data Analysis Basics
- Jupyter Keys: Model Validation Patterns
- Jupyter Keys: EDA Workflows

**Metadata**: `tool = "jupyter"`, `key_type = "notebook"`

### GitHub Keys
**Tool**: GitHub  
**What They Unlock**: Workflow automation, CI/CD patterns, repository structures  
**Examples**:
- GitHub Keys: CI/CD Starter Workflows
- GitHub Keys: Repository Templates
- GitHub Keys: Issue Management Patterns

**Metadata**: `tool = "github"`, `key_type = "workflow"` or `key_type = "template"`

### Stripe Keys
**Tool**: Stripe  
**What They Unlock**: Payment flows, subscription management, billing patterns  
**Examples**:
- Stripe Keys: Subscription Management
- Stripe Keys: Payment Flow Patterns
- Stripe Keys: Webhook Handling

**Metadata**: `tool = "stripe"`, `key_type = "workflow"` or `key_type = "playbook"`

### Supabase Keys
**Tool**: Supabase  
**What They Unlock**: Database patterns, auth flows, real-time patterns  
**Examples**:
- Supabase Keys: RLS Policy Patterns
- Supabase Keys: Auth Flow Templates
- Supabase Keys: Real-time Subscription Patterns

**Metadata**: `tool = "supabase"`, `key_type = "workflow"` or `key_type = "template"`

### AI Studio Keys
**Tool**: AI Studio / OpenAI / Anthropic / etc.  
**What They Unlock**: Model fine-tuning, prompt engineering, API patterns  
**Examples**:
- AI Studio Keys: Fine-tuning Workflows
- AI Studio Keys: Prompt Engineering Patterns
- AI Studio Keys: API Integration Patterns

**Metadata**: `tool = "ai_studio"`, `key_type = "workflow"` or `key_type = "playbook"`

### Extensible
New tools can be added as needed. The taxonomy is extensible.

---

## 2. Keys by Outcome

Keys are organized by the practical outcome they unlock.

### Automation Keys
**Outcome**: Automate repetitive tasks or workflows  
**Examples**:
- GitHub Keys: Automated Deployment
- Stripe Keys: Automated Subscription Management
- Cursor Keys: Automated Code Generation

**Metadata**: `outcome = "automation"`

### Monetization Keys
**Outcome**: Unlock revenue-generating capabilities  
**Examples**:
- Stripe Keys: Subscription Setup
- Stripe Keys: Payment Processing
- GitHub Keys: SaaS Starter Templates

**Metadata**: `outcome = "monetization"`

### Validation Keys
**Outcome**: Unlock testing, validation, and quality assurance patterns  
**Examples**:
- Jupyter Keys: Model Validation Harnesses
- Cursor Keys: Test Generation Patterns
- GitHub Keys: CI/CD Testing Workflows

**Metadata**: `outcome = "validation"`

### Compliance Keys
**Outcome**: Unlock regulatory compliance, security, and governance patterns  
**Examples**:
- Supabase Keys: GDPR Compliance Patterns
- Stripe Keys: PCI Compliance Workflows
- GitHub Keys: Security Scanning Workflows

**Metadata**: `outcome = "compliance"`

### Consulting Keys
**Outcome**: Unlock client delivery patterns, project templates, and consulting workflows  
**Examples**:
- Cursor Keys: Client Project Scaffolds
- GitHub Keys: Client Repository Templates
- Jupyter Keys: Client Analysis Templates

**Metadata**: `outcome = "consulting"`

### SaaS Builder Keys
**Outcome**: Unlock patterns for building SaaS products  
**Examples**:
- Stripe + Supabase Keys: SaaS Starter Stack
- GitHub Keys: SaaS Repository Templates
- Cursor Keys: SaaS Code Generation Patterns

**Metadata**: `outcome = "saas_builder"`

---

## 3. Keys by Maturity

Keys are organized by the level of expertise required.

### Starter Keys
**Maturity**: Beginner-friendly, minimal prerequisites  
**Characteristics**:
- Clear step-by-step instructions
- Minimal tool knowledge required
- Self-contained examples
- Beginner-friendly documentation

**Examples**:
- Cursor Keys: First Prompt Pack (Starter)
- Jupyter Keys: Data Analysis Basics (Starter)
- Stripe Keys: First Payment Flow (Starter)

**Metadata**: `maturity = "starter"`

### Operator Keys
**Maturity**: Intermediate, assumes basic tool knowledge  
**Characteristics**:
- Assumes familiarity with tool
- Focuses on patterns and best practices
- Requires some customization
- Intermediate documentation

**Examples**:
- Cursor Keys: Advanced Scaffolding (Operator)
- Jupyter Keys: Model Validation Patterns (Operator)
- Stripe Keys: Subscription Management (Operator)

**Metadata**: `maturity = "operator"`

### Scale Keys
**Maturity**: Advanced, assumes expert-level tool knowledge  
**Characteristics**:
- Assumes deep tool expertise
- Focuses on optimization and scale
- Requires significant customization
- Advanced documentation

**Examples**:
- Cursor Keys: Enterprise Code Generation (Scale)
- Jupyter Keys: Production ML Pipelines (Scale)
- Stripe Keys: Multi-Product Billing (Scale)

**Metadata**: `maturity = "scale"`

---

## Key Types

Within each tool classification, keys can be different types:

### Prompt Keys
**Type**: Prompt packs, composer prompts, mega prompts  
**Format**: YAML, Markdown, or structured text  
**Use Case**: Unlock AI tool capability (Cursor, AI Studio)

**Metadata**: `key_type = "prompt"` or `key_type = "composer"`

### Notebook Keys
**Type**: Jupyter notebooks, analysis workflows  
**Format**: `.ipynb` files  
**Use Case**: Unlock data science capability (Jupyter)

**Metadata**: `key_type = "notebook"`

### Workflow Keys
**Type**: GitHub Actions, CI/CD workflows, automation scripts  
**Format**: YAML, shell scripts, or code  
**Use Case**: Unlock automation capability (GitHub, CI/CD tools)

**Metadata**: `key_type = "workflow"`

### Template Keys
**Type**: Starter repositories, project scaffolds, code templates  
**Format**: Repository structures, code files  
**Use Case**: Unlock project setup capability (GitHub, Cursor)

**Metadata**: `key_type = "template"`

### Playbook Keys
**Type**: Operational guides, process documentation, runbooks  
**Format**: Markdown, structured documentation  
**Use Case**: Unlock operational capability (any tool)

**Metadata**: `key_type = "playbook"`

### Guide Keys
**Type**: How-to guides, tutorials, documentation  
**Format**: Markdown, HTML, or structured docs  
**Use Case**: Unlock learning capability (any tool)

**Metadata**: `key_type = "guide"`

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

### Example 2: Jupyter Key
```json
{
  "slug": "jupyter-data-analysis-basics",
  "title": "Jupyter Keys: Data Analysis Basics",
  "tool": "jupyter",
  "key_type": "notebook",
  "outcome": "validation",
  "maturity": "starter",
  "description": "Unlock fundamental data analysis workflows in Jupyter"
}
```

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
  maturity: string;       // "starter" | "operator" | "scale"
  
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

---

## Version History

- **1.0.0** (2024-12-30): Initial taxonomy definition
