# What Is A Key?

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Defines the atomic unit of KEYS  
**Purpose**: Absolute definition of what constitutes a KEY

---

## Atomic Definition

**A KEY is a structured, validated, reusable asset that unlocks a specific, practical outcome in an external tool.**

---

## Required Properties

Every KEY must satisfy ALL of the following:

### 1. Unlocks a Specific Outcome
A KEY must unlock a **specific, practical outcome**, not a vague capability.

✅ **Valid**: "Unlock Stripe subscription management workflow"  
❌ **Invalid**: "Unlock AI assistance"

✅ **Valid**: "Unlock Jupyter data validation patterns"  
❌ **Invalid**: "Unlock data science"

### 2. Assumes an External Tool
A KEY must assume an **external tool** that the user already owns or can access.

✅ **Valid**: "Unlock Cursor code generation workflows" (assumes Cursor)  
❌ **Invalid**: "Unlock code generation" (no tool specified)

✅ **Valid**: "Unlock GitHub Actions CI/CD patterns" (assumes GitHub)  
❌ **Invalid**: "Unlock CI/CD" (no tool specified)

### 3. Is Reusable
A KEY must be **reusable** across multiple projects, contexts, or sessions.

✅ **Valid**: A prompt pack that works for multiple projects  
❌ **Invalid**: A one-off prompt for a specific task

✅ **Valid**: A notebook template that works for multiple datasets  
❌ **Invalid**: A notebook for a specific dataset

### 4. Is Inspectable
A KEY must be **inspectable**—users can see what it does and how it works.

✅ **Valid**: A prompt pack with visible structure and variables  
❌ **Invalid**: A black box that hides its logic

✅ **Valid**: A notebook with clear cells and documentation  
❌ **Invalid**: An opaque notebook with no explanation

### 5. Is Deterministic or Bounded
A KEY must produce **deterministic or bounded** results—users know what to expect.

✅ **Valid**: A workflow that produces consistent outputs  
❌ **Invalid**: A workflow with unpredictable results

✅ **Valid**: A prompt that produces bounded variations  
❌ **Invalid**: A prompt that produces wildly different outputs

### 6. Produces Tangible Artifacts
A KEY must produce **tangible artifacts**—code, data, documentation, configurations, etc.

✅ **Valid**: A prompt that generates code files  
❌ **Invalid**: A prompt that only provides advice

✅ **Valid**: A notebook that produces analysis reports  
❌ **Invalid**: A notebook that only provides insights

### 7. Reduces Time, Risk, or Uncertainty
A KEY must **reduce time, risk, or uncertainty** compared to doing it manually.

✅ **Valid**: A workflow that saves hours of manual work  
❌ **Invalid**: A workflow that takes longer than manual work

✅ **Valid**: A prompt that reduces security risk  
❌ **Invalid**: A prompt that increases risk

---

## Allowed Forms

A KEY can take any of the following forms:

### Prompt Keys
**Format**: YAML, Markdown, or structured text  
**Use Case**: Unlock AI tool capability (Cursor, AI Studio)  
**Example**: Cursor prompt packs, Composer instructions

### Notebook Keys
**Format**: `.ipynb` files (Jupyter notebooks)  
**Use Case**: Unlock data science capability (Jupyter)  
**Example**: Data analysis notebooks, validation harnesses

### Workflow Keys
**Format**: YAML, shell scripts, or code  
**Use Case**: Unlock automation capability (GitHub, CI/CD tools)  
**Example**: GitHub Actions workflows, CI/CD scripts

### Template Keys
**Format**: Repository structures, code files  
**Use Case**: Unlock project setup capability (GitHub, Cursor)  
**Example**: Starter repositories, project scaffolds

### Playbook Keys
**Format**: Markdown, structured documentation  
**Use Case**: Unlock operational capability (any tool)  
**Example**: Operational guides, process documentation

### Guide Keys
**Format**: Markdown, HTML, or structured docs  
**Use Case**: Unlock learning capability (any tool)  
**Example**: How-to guides, tutorials, documentation

### Validator Keys
**Format**: Code, scripts, or configurations  
**Use Case**: Unlock validation capability (any tool)  
**Example**: Test suites, validation scripts, quality gates

---

## Forbidden Forms

A KEY cannot be:

### ❌ Black Boxes
A KEY cannot hide its logic or execution path. Users must be able to inspect it.

### ❌ Magic Buttons
A KEY cannot be a button that does something without showing how. Users must understand the process.

### ❌ Opaque Automation
A KEY cannot automate something without showing what it does. Users must see the execution path.

### ❌ One-Off Solutions
A KEY cannot be a solution for a single, specific task. It must be reusable.

### ❌ Tool Replacements
A KEY cannot replace a tool. It must unlock capability in an existing tool.

### ❌ Generic Advice
A KEY cannot be generic advice without specific, actionable steps. It must produce tangible artifacts.

### ❌ Vague Promises
A KEY cannot promise vague outcomes. It must unlock specific, practical outcomes.

---

## Minimum Acceptance Criteria

For any new KEY to be accepted, it must satisfy:

### 1. Tool Specification
- [ ] Clearly identifies the external tool it unlocks
- [ ] Assumes the user has or can access that tool
- [ ] Does not compete with that tool

### 2. Outcome Specification
- [ ] Clearly identifies the specific outcome it unlocks
- [ ] Outcome is practical and measurable
- [ ] Outcome produces tangible artifacts

### 3. Reusability
- [ ] Works across multiple projects or contexts
- [ ] Has configurable variables or parameters
- [ ] Can be adapted to different use cases

### 4. Inspectability
- [ ] Structure is visible and understandable
- [ ] Logic is transparent
- [ ] Execution path is clear

### 5. Determinism
- [ ] Produces consistent or bounded results
- [ ] Users know what to expect
- [ ] Edge cases are documented

### 6. Artifact Production
- [ ] Produces tangible artifacts (code, data, docs, etc.)
- [ ] Artifacts are usable and valuable
- [ ] Artifacts are clearly defined

### 7. Value Proposition
- [ ] Reduces time, risk, or uncertainty
- [ ] Value is measurable or demonstrable
- [ ] Value exceeds the cost of the KEY

---

## Examples

### ✅ Valid KEY: Cursor Authentication Scaffolding
- **Tool**: Cursor
- **Outcome**: Unlock JWT authentication middleware generation
- **Form**: Prompt pack (YAML)
- **Reusable**: Yes (works for multiple projects)
- **Inspectable**: Yes (visible prompt structure)
- **Deterministic**: Yes (produces consistent middleware)
- **Artifacts**: Code files (middleware, routes, tests)
- **Value**: Saves hours of manual coding

### ✅ Valid KEY: Jupyter Data Validation Harness
- **Tool**: Jupyter
- **Outcome**: Unlock data validation patterns for ML models
- **Form**: Notebook (`.ipynb`)
- **Reusable**: Yes (works for multiple datasets)
- **Inspectable**: Yes (visible notebook cells)
- **Deterministic**: Yes (produces consistent validation reports)
- **Artifacts**: Validation reports, test results
- **Value**: Reduces validation risk

### ✅ Valid KEY: GitHub CI/CD Starter Workflow
- **Tool**: GitHub
- **Outcome**: Unlock automated testing and deployment
- **Form**: Workflow (YAML)
- **Reusable**: Yes (works for multiple repositories)
- **Inspectable**: Yes (visible workflow steps)
- **Deterministic**: Yes (produces consistent CI/CD runs)
- **Artifacts**: CI/CD runs, deployment logs
- **Value**: Saves hours of CI/CD setup

### ❌ Invalid: Generic AI Assistant
- **Tool**: None specified
- **Outcome**: Vague ("AI assistance")
- **Form**: Black box
- **Reusable**: Unclear
- **Inspectable**: No (black box)
- **Deterministic**: No (unpredictable)
- **Artifacts**: None specified
- **Value**: Unclear

### ❌ Invalid: One-Off Code Generator
- **Tool**: Cursor
- **Outcome**: Generate code for a specific project
- **Form**: Prompt
- **Reusable**: No (only works for one project)
- **Inspectable**: Yes
- **Deterministic**: Yes
- **Artifacts**: Code files
- **Value**: Limited (one-time use)

---

## Key vs. Not a Key

### Is a KEY:
- A prompt pack that unlocks Cursor workflows ✅
- A notebook that unlocks Jupyter analysis patterns ✅
- A workflow that unlocks GitHub automation ✅
- A template that unlocks project setup ✅
- A playbook that unlocks operational processes ✅
- A guide that unlocks learning outcomes ✅

### Is NOT a KEY:
- An AI model ❌
- An AI agent ❌
- A tool replacement ❌
- A one-off solution ❌
- A black box ❌
- Generic advice ❌
- A vague promise ❌

---

## Version History

- **1.0.0** (2024-12-30): Initial atomic definition
