# Product Principles

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Non-Negotiable Guardrails

---

## Overview

These principles govern all product decisions, feature development, and asset acceptance in KEYS. They are non-negotiable guardrails that ensure KEYS stays true to its identity as "the keyring to modern tools."

---

## Principle 1: Keys Never Compete with Tools

### Rule
KEYS never builds features that compete with external tools. KEYS unlocks tools; it doesn't replace them.

### Examples

#### ✅ Allowed
- Cursor Keys that unlock Cursor workflows
- Jupyter Keys that unlock Jupyter notebooks
- Stripe Keys that unlock Stripe patterns

#### ❌ Forbidden
- Building a code editor to compete with Cursor
- Building a notebook environment to compete with Jupyter
- Building a payment processor to compete with Stripe

### Rationale
KEYS is above the tool wars. It provides keys that unlock tools, regardless of which tools users choose.

---

## Principle 2: Keys Never Hide Execution Paths

### Rule
Keys must show users how tools are used. No black boxes, no hidden execution.

### Examples

#### ✅ Allowed
- Prompt packs that show the prompt structure
- Notebooks that show the analysis steps
- Workflows that show the automation logic

#### ❌ Forbidden
- APIs that hide how tools are called
- Services that abstract away tool usage
- Wrappers that obscure execution paths

### Rationale
Users need to understand how tools work. Keys unlock capability by showing the path, not hiding it.

---

## Principle 3: Keys Always Produce Tangible Outputs

### Rule
Every key must produce a tangible, reusable output. No abstract "assistance" or vague "help."

### Examples

#### ✅ Allowed
- A notebook file (.ipynb)
- A prompt pack (YAML file)
- A workflow file (GitHub Actions YAML)
- A starter repository (code files)

#### ❌ Forbidden
- "AI assistance" with no output
- "Guidance" without deliverables
- "Support" without assets

### Rationale
Keys unlock capability by providing assets users can use, modify, and reuse. Abstract help doesn't unlock capability.

---

## Principle 4: Keys Assets Must Be Reusable and Deterministic

### Rule
Keys must be reusable across projects and produce deterministic results. No one-off solutions.

### Examples

#### ✅ Allowed
- Prompt packs that work across projects
- Notebooks that can be adapted to different datasets
- Workflows that can be customized for different repos

#### ❌ Forbidden
- One-off code generation for a single project
- Custom solutions that don't generalize
- Assets that only work once

### Rationale
Keys unlock capability by providing patterns that work repeatedly. One-off solutions don't scale.

---

## Principle 5: Keys Optimize for Usefulness, Not Novelty

### Rule
Keys prioritize practical, proven patterns over novel, experimental approaches.

### Examples

#### ✅ Allowed
- Proven authentication patterns
- Established data analysis workflows
- Well-tested CI/CD configurations

#### ❌ Forbidden
- Experimental AI techniques
- Unproven architectural patterns
- Novel approaches without validation

### Rationale
Keys unlock capability by providing patterns that work. Novelty without usefulness doesn't unlock capability.

---

## Principle 6: Keys Are Tool-Agnostic When Possible

### Rule
Keys should work with multiple tools when possible. Avoid lock-in to specific platforms.

### Examples

#### ✅ Allowed
- Prompt packs that work with multiple AI models
- Workflows that work with multiple CI/CD systems
- Patterns that work with multiple databases

#### ❌ Forbidden
- Keys that only work with one specific tool
- Keys that require specific platforms
- Keys that create unnecessary dependencies

### Rationale
KEYS is above the tool wars. Keys should unlock capability regardless of which tools users choose.

---

## Principle 7: Keys Are Outcome-Driven

### Rule
Every key must unlock a specific, practical outcome. No vague promises or abstract benefits.

### Examples

#### ✅ Allowed
- "Unlock Stripe subscription management"
- "Unlock Jupyter data analysis workflows"
- "Unlock Cursor authentication scaffolding"

#### ❌ Forbidden
- "Improve your workflow"
- "Enhance your productivity"
- "Better AI assistance"

### Rationale
Keys unlock capability by focusing on specific outcomes. Vague promises don't unlock capability.

---

## Principle 8: Keys Are Transparent About Dependencies

### Rule
Keys must clearly state what tools, services, or dependencies they require.

### Examples

#### ✅ Allowed
- "Requires Cursor"
- "Requires Jupyter"
- "Requires Stripe account"

#### ❌ Forbidden
- Hidden dependencies
- Unclear requirements
- Surprise prerequisites

### Rationale
Users need to know what they need before using a key. Transparency builds trust.

---

## Principle 9: Keys Are Versioned and Updatable

### Rule
All keys must be versioned and updatable. Users should be able to get updates and improvements.

### Examples

#### ✅ Allowed
- Semantic versioning (1.0.0, 1.1.0, 2.0.0)
- Changelog tracking
- Update notifications

#### ❌ Forbidden
- Static, unversioned assets
- No update mechanism
- Breaking changes without notice

### Rationale
Tools evolve, and keys must evolve with them. Versioning enables updates and improvements.

---

## Principle 10: Keys Respect User Ownership

### Rule
Keys belong to users once acquired. Users can modify, share, and use keys as they see fit (within license terms).

### Examples

#### ✅ Allowed
- Users modify keys for their needs
- Users share keys with their team
- Users fork keys to create variants

#### ❌ Forbidden
- Keys that lock users into specific usage
- Keys that prevent modification
- Keys that require constant online connection

### Rationale
Keys unlock capability by giving users assets they own and control. Lock-in doesn't unlock capability.

---

## Decision Framework

When evaluating any new feature, asset, or direction, apply these principles:

1. **Does this compete with a tool?** → If yes, reject
2. **Does this hide execution paths?** → If yes, reject
3. **Does this produce tangible outputs?** → If no, reject
4. **Is this reusable and deterministic?** → If no, reject
5. **Does this optimize for usefulness?** → If no, reconsider
6. **Is this tool-agnostic?** → If no, reconsider
7. **Is this outcome-driven?** → If no, reconsider
8. **Is this transparent about dependencies?** → If no, fix
9. **Is this versioned and updatable?** → If no, fix
10. **Does this respect user ownership?** → If no, fix

---

## Enforcement

### Product Reviews
All new features and assets are reviewed against these principles before acceptance.

### Marketplace Curation
Marketplace assets are curated to ensure they follow these principles.

### Documentation
All documentation must align with these principles.

### Roadmap
Roadmap items are evaluated against these principles before prioritization.

---

## Exceptions

Exceptions to these principles are **extremely rare** and require:
1. Explicit justification
2. Product team approval
3. Documentation of the exception
4. Regular review of the exception

**Default**: No exceptions. Principles are non-negotiable.

---

## Version History

- **1.0.0** (2024-12-30): Initial product principles
