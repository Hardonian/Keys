# Control Plane

> **The Mission Control for AI-Assisted Development**

A deterministic, explainable, and trustworthy system for orchestrating AI agents to perform complex tasks safely. Think of it as **mission control for your codebase** — where every agent has a role, every action is auditable, and nothing happens without explicit constraints.

```
┌─────────────────────────────────────────────────────────────┐
│  🎛️  CONTROL PLANE                                          │
│                                                              │
│  Inputs → Agents → Policies → Actions → Outputs             │
│     ↓        ↓         ↓          ↓         ↓               │
│  Visible  Inspectable  Enforced  Auditable  Verifiable      │
└─────────────────────────────────────────────────────────────┘
```

## Instant Win (30 Seconds)

See it in action immediately:

```bash
pnpm install
pnpm dev
```

Then visit:
- **`/demo`** - Run a live agent demonstration (zero setup)
- **`/brain`** - Explore the living system visualization
- **`/library`** - Browse available keys and workflows

## What This Is

**Control Plane** is an opinionated system for running AI agents with:

### 🎯 Determinism by Default
- Same inputs → Same outputs, always
- Full replay capability with recorded seeds
- Evidence bundles for every action

### 🛡️ Safety First
- **Blast radius constraints** - Agents can only touch what you allow
- **Policy enforcement** - Every action validated before execution
- **Anti-features** - Hard-coded guardrails that fail loudly

### 🔍 Explainability
- Every decision explains itself
- Complete reasoning traces
- "What did NOT happen (and why)" visibility

### 🤝 Human-Agent Collaboration
- Multiple agents with distinct cognitive roles
- Agent disagreement surfaced, not hidden
- Arbitration UI for conflicts

## Core Concepts

### The Control Plane Metaphor

```
┌────────────────────────────────────────────────────────────┐
│  INPUTS                                                    │
│  • User requests    • Webhooks    • Scheduled jobs         │
└──────────────────────┬─────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR (Control Tower)                              │
│  Routes tasks to specialized agents based on intent        │
└──────────────────────┬─────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────────────┐
│  AGENTS (Flight Crew)                                      │
│  Each with a role: Operator, Auditor, Skeptic, Optimizer  │
│  Each with constraints: what they CAN and CANNOT touch     │
└──────────────────────┬─────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────────────┐
│  POLICIES (Flight Rules)                                   │
│  • Read-Only Policy      • Blast Radius Limits             │
│  • Determinism Check     • Audit Trail Enforcement         │
└──────────────────────┬─────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────────────┐
│  ACTIONS (Maneuvers)                                       │
│  Executed only after all policies pass                     │
└──────────────────────┬─────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────────────┐
│  OUTPUTS (Mission Reports)                                 │
│  • Evidence bundles  • Decision logs  • Generated artifacts│
│  All downloadable, shareable, and replayable               │
└────────────────────────────────────────────────────────────┘
```

### Multi-Agent Collaboration

Agents don't work alone. They collaborate with distinct roles:

| Role | Responsibility | Can Veto? |
|------|---------------|-----------|
| **Operator** | Executes the primary task | ✅ Yes |
| **Auditor** | Reviews for correctness | ✅ Yes |
| **Skeptic** | Challenges assumptions | ❌ No (flags for review) |
| **Optimizer** | Improves efficiency | ❌ No (suggests improvements) |
| **Arbiter** | Resolves conflicts | ✅ Yes |

### Blast Radius Constraints

Every agent has explicit boundaries:

```typescript
// What this agent CAN touch
canTouch: [
  "Database (Read-Only)",
  "Tables: users, projects (SELECT only)",
  "Max 100 rows per query",
  "Files: /tmp/sandbox/*"
]

// What this agent CANNOT touch
cannotTouch: [
  "Production database writes",
  "User secrets or credentials",
  "External APIs without permission",
  "Files outside /tmp/sandbox"
]
```

## What This System Refuses To Do

We believe in **anti-features** — things we deliberately prevent:

### ❌ No Silent Failures
Every error is logged, reported, and actionable. You'll always know what went wrong.

### ❌ No Unbounded Operations
Every operation has limits: max rows, max files, max time, max memory.

### ❌ No Data Exfiltration
Your data never leaves your environment without explicit opt-in.

### ❌ No Black Box Decisions
Every decision explains itself. No "trust me, I'm an AI."

### ❌ No Hidden Policies
All policies are visible, versioned, and auditable.

### ❌ No Training on Your Data
Your inputs and outputs are never used to train models.

## Golden Paths

Pre-configured workflows for common scenarios:

### Security Audit (45s)
```
SecurityAgent → RLSValidator → ReportAgent
Scan dependencies → Check secrets → Validate policies → Generate report
```

### Dependency Health (30s)
```
ParserAgent → VulnAgent → ReportAgent
Parse manifests → Query vulnerability DB → Generate health report
```

### Architecture Documentation (60s)
```
ScannerAgent → APIExtractor → DiagramAgent → DocCompiler
Scan structure → Extract APIs → Generate diagrams → Compile docs
```

## Quick Start

### Run the Demo

Visit `/demo` to see a live agent execution with full observability.

### Explore the System Brain

Visit `/brain` to see the living visualization of all agents, policies, and data flows.

### Use in Your Code

```typescript
import { orchestrate, createEvidenceBundle } from '@control-plane/core';

// Run an orchestrated task
const result = await orchestrate({
  task: 'Analyze codebase for security issues',
  agents: ['SecurityAgent', 'Auditor'],
  policies: ['read-only', 'max-rows-100'],
  determinism: 'deterministic',
});

// Get evidence bundle
const evidence = createEvidenceBundle(result);
console.log(evidence.explanation);
// → Full human-readable explanation of what happened and why
```

## Architecture

```
frontend/          Next.js 14+ App Router
├── app/demo/      Instant Win experience
├── app/brain/     System visualization
├── lib/
│   ├── evidence-bundle.ts    # Explainability layer
│   ├── trust-controls.ts     # Safety & blast radius
│   ├── anti-features.ts      # Guardrails
│   └── multi-agent.ts        # Collaboration

backend/           Express + TypeScript
├── agents/        Agent implementations
├── policies/      Safety policy engine
├── orchestration/ Multi-agent coordination
└── audit/         Evidence & logging

contracts/         Zod schemas for all data
```

## Safety & Trust

### Policy Enforcement Points

```
Pre-Execution    → Validate blast radius, check permissions
Mid-Execution    → Monitor resources, enforce timeouts
Post-Execution   → Verify outputs, complete audit trail
```

### Determinism Modes

- **Deterministic** (default): Same input → Same output, always
- **Probabilistic**: Controlled randomness for creativity
- **Exploratory**: Maximum exploration (flagged as non-reproducible)

### Evidence Bundles

Every action produces an evidence bundle:

```json
{
  "id": "uuid",
  "action": { "type", "agent", "input" },
  "trace": [/* step-by-step execution */],
  "policies": [/* policy check results */],
  "reasoning": { /* why decisions were made */ },
  "output": { /* generated content */ },
  "replay": { /* deterministic replay instructions */ }
}
```

## Enterprise Features

The open-source version includes:
- ✅ Multi-agent orchestration
- ✅ Policy enforcement engine
- ✅ Evidence bundles
- ✅ System brain visualization
- ✅ Blast radius constraints
- ✅ Determinism controls

Enterprise additions:
- 🔐 SSO/SAML integration
- 📊 Advanced audit dashboards
- 🔒 Custom policy DSL
- 🏢 Multi-tenant isolation
- 📈 Usage analytics
- 🎯 Custom agent training

## Development

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev

# Run type checks
pnpm type-check

# Run tests
pnpm test:all

# Verify everything
pnpm verify:full
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Key areas:
- New agent types
- Policy implementations
- Visualization improvements
- Documentation

## License

MIT License - see [LICENSE](./LICENSE)

Enterprise features are available under a commercial license. Contact us for details.

---

**Built with ❤️ for teams who want AI agents they can trust.**

[Demo](/demo) • [System Brain](/brain) • [Documentation](/docs) • [Enterprise](/enterprise)
