/**
 * Control Plane - System Brain
 * 
 * A continuously visible graph view of the entire system:
 * inputs → agents → policies → actions → outputs
 * 
 * Users can click any node to inspect code, prompts, policies, logs, and decisions.
 * Shows both "what happened" and "what did NOT happen (and why)".
 * 
 * @phase Phase 2 - Living System Brain
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  Cpu,
  Shield,
  Play,
  FileOutput,
  FileInput,
  ChevronRight,
  X,
  Code,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Terminal,
  Lock,
  Filter,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// System Node Types
interface SystemNode {
  id: string;
  type: 'input' | 'agent' | 'policy' | 'action' | 'output';
  name: string;
  description: string;
  status: 'active' | 'idle' | 'blocked' | 'error';
  lastRun?: string;
  runCount: number;
  blastRadius?: string[];
  constraints?: string[];
  code?: string;
  prompt?: string;
  logs?: LogEntry[];
  decisions?: Decision[];
  position: { x: number; y: number };
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  agent?: string;
}

interface Decision {
  id: string;
  timestamp: string;
  input: string;
  output: string;
  reasoning: string;
  confidence: number;
  alternatives: string[];
  whyNot: string[];
}

interface Edge {
  from: string;
  to: string;
  label?: string;
  type: 'flow' | 'control' | 'data';
  active: boolean;
}

// Mock system data representing the actual architecture
const SYSTEM_NODES: SystemNode[] = [
  // Inputs
  {
    id: 'input-1',
    type: 'input',
    name: 'User Request',
    description: 'Natural language task from user',
    status: 'idle',
    runCount: 1247,
    position: { x: 50, y: 300 },
  },
  {
    id: 'input-2',
    type: 'input',
    name: 'Scheduled Job',
    description: 'Time-based automation trigger',
    status: 'active',
    lastRun: new Date(Date.now() - 300000).toISOString(),
    runCount: 89,
    position: { x: 50, y: 450 },
  },
  {
    id: 'input-3',
    type: 'input',
    name: 'Webhook Event',
    description: 'External system notification',
    status: 'idle',
    runCount: 2341,
    position: { x: 50, y: 150 },
  },
  
  // Agents
  {
    id: 'agent-1',
    type: 'agent',
    name: 'Orchestrator',
    description: 'Routes tasks to specialized agents',
    status: 'active',
    lastRun: new Date().toISOString(),
    runCount: 3677,
    blastRadius: ['All Agents', 'Policy Engine'],
    code: `function orchestrate(request: TaskRequest): Agent[] {
  const agents = [];
  if (request.requiresSecurity) agents.push('SecurityAgent');
  if (request.requiresAnalysis) agents.push('AnalysisAgent');
  if (request.requiresGeneration) agents.push('GeneratorAgent');
  return agents;
}`,
    prompt: 'You are the orchestrator. Analyze the user request and determine which specialized agents should handle it. Return a JSON array of agent names.',
    logs: [
      { timestamp: new Date().toISOString(), level: 'info', message: 'Routing request to SecurityAgent and AnalysisAgent' },
    ],
    position: { x: 300, y: 300 },
  },
  {
    id: 'agent-2',
    type: 'agent',
    name: 'Security Agent',
    description: 'Validates security policies before execution',
    status: 'active',
    lastRun: new Date(Date.now() - 5000).toISOString(),
    runCount: 1847,
    blastRadius: ['Database (Read-Only)', 'Policy Engine'],
    constraints: ['No-Write', 'No-Delete', 'No-External-API'],
    code: `async function validateSecurity(context: Context): Promise<ValidationResult> {
  const checks = [
    checkBlastRadius(context),
    checkPermissions(context),
    checkDataSensitivity(context),
  ];
  const results = await Promise.all(checks);
  return aggregateResults(results);
}`,
    prompt: 'Validate the security posture of this operation. Check blast radius, permissions, and data sensitivity. Return PASS or BLOCK with reasoning.',
    logs: [
      { timestamp: new Date(Date.now() - 5000).toISOString(), level: 'info', message: 'Security check passed' },
      { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'warn', message: 'Elevated permissions required for table user_secrets' },
    ],
    decisions: [
      {
        id: 'dec-1',
        timestamp: new Date(Date.now() - 5000).toISOString(),
        input: 'Request to query user data',
        output: 'ALLOW',
        reasoning: 'Requester has SELECT permission on user table. No PII columns accessed.',
        confidence: 0.98,
        alternatives: ['ALLOW with masking', 'BLOCK and notify admin'],
        whyNot: ['No masking policy active for this user', 'Not a sensitive operation'],
      },
    ],
    position: { x: 550, y: 200 },
  },
  {
    id: 'agent-3',
    type: 'agent',
    name: 'Analysis Agent',
    description: 'Performs code and data analysis',
    status: 'idle',
    runCount: 2156,
    blastRadius: ['Database (Read-Only)', 'File System (Read-Only)'],
    constraints: ['Read-Only', 'No-Network'],
    code: `async function analyzeCode(files: string[]): Promise<Analysis> {
  const ast = await parseFiles(files);
  const patterns = detectPatterns(ast);
  const issues = findIssues(patterns);
  return generateReport(issues);
}`,
    prompt: 'Analyze the provided code files. Look for security issues, bugs, and code smells. Return a structured analysis report.',
    position: { x: 550, y: 350 },
  },
  {
    id: 'agent-4',
    type: 'agent',
    name: 'Generator Agent',
    description: 'Generates code, docs, and artifacts',
    status: 'blocked',
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    runCount: 923,
    blastRadius: ['Output Directory', 'Temp Files'],
    constraints: ['Output-Only', 'Sandboxed'],
    code: `async function generateArtifact(spec: Spec): Promise<Artifact> {
  const template = await loadTemplate(spec.type);
  const content = await render(template, spec.data);
  await validateOutput(content);
  return saveArtifact(content);
}`,
    prompt: 'Generate an artifact based on the specification. Ensure it follows templates and passes validation.',
    position: { x: 550, y: 500 },
  },
  
  // Policies
  {
    id: 'policy-1',
    type: 'policy',
    name: 'Read-Only Policy',
    description: 'Prevents any write operations',
    status: 'active',
    runCount: 4521,
    constraints: ['NO_WRITE', 'NO_DELETE', 'NO_ALTER'],
    code: `policy ReadOnly {
  deny write, delete, alter on *;
  allow read, select on *;
}`,
    position: { x: 800, y: 150 },
  },
  {
    id: 'policy-2',
    type: 'policy',
    name: 'Blast Radius Limit',
    description: 'Restricts scope of operations',
    status: 'active',
    runCount: 3677,
    constraints: ['MAX_AFFECTED_ROWS: 100', 'MAX_TABLES: 3'],
    code: `policy BlastRadius {
  max_affected_rows: 100;
  max_tables: 3;
  require_confirmation_if: affected_rows > 10;
}`,
    position: { x: 800, y: 250 },
  },
  {
    id: 'policy-3',
    type: 'policy',
    name: 'Determinism Check',
    description: 'Ensures reproducible outputs',
    status: 'active',
    runCount: 2891,
    constraints: ['SEED_REQUIRED', 'TEMPERATURE: 0'],
    code: `policy Determinism {
  require seed for generation;
  temperature: 0.0;
  top_p: 1.0;
}`,
    position: { x: 800, y: 350 },
  },
  {
    id: 'policy-4',
    type: 'policy',
    name: 'Audit Trail',
    description: 'Logs all actions for review',
    status: 'active',
    runCount: 3677,
    code: `policy AuditTrail {
  log all actions with context;
  retain logs for 90 days;
  include: agent, prompt, output, reasoning;
}`,
    position: { x: 800, y: 450 },
  },
  
  // Actions
  {
    id: 'action-1',
    type: 'action',
    name: 'Execute Query',
    description: 'Run database query',
    status: 'active',
    lastRun: new Date(Date.now() - 5000).toISOString(),
    runCount: 1847,
    blastRadius: ['Database'],
    position: { x: 1050, y: 200 },
  },
  {
    id: 'action-2',
    type: 'action',
    name: 'Generate Report',
    description: 'Create analysis report',
    status: 'idle',
    runCount: 923,
    blastRadius: ['File System'],
    position: { x: 1050, y: 350 },
  },
  {
    id: 'action-3',
    type: 'action',
    name: 'Send Notification',
    description: 'Alert user of completion',
    status: 'blocked',
    runCount: 456,
    blastRadius: ['External API'],
    position: { x: 1050, y: 500 },
  },
  
  // Outputs
  {
    id: 'output-1',
    type: 'output',
    name: 'Report Artifact',
    description: 'Generated analysis document',
    status: 'idle',
    runCount: 923,
    position: { x: 1300, y: 300 },
  },
  {
    id: 'output-2',
    type: 'output',
    name: 'Decision Log',
    description: 'Audit trail of decisions',
    status: 'active',
    lastRun: new Date().toISOString(),
    runCount: 3677,
    position: { x: 1300, y: 450 },
  },
];

const SYSTEM_EDGES: Edge[] = [
  // Input to Orchestrator
  { from: 'input-1', to: 'agent-1', type: 'flow', active: true },
  { from: 'input-2', to: 'agent-1', type: 'flow', active: false },
  { from: 'input-3', to: 'agent-1', type: 'flow', active: false },
  
  // Orchestrator to Agents
  { from: 'agent-1', to: 'agent-2', label: 'security', type: 'control', active: true },
  { from: 'agent-1', to: 'agent-3', label: 'analysis', type: 'control', active: false },
  { from: 'agent-1', to: 'agent-4', label: 'generation', type: 'control', active: false },
  
  // Agents to Policies
  { from: 'agent-2', to: 'policy-1', type: 'control', active: true },
  { from: 'agent-2', to: 'policy-2', type: 'control', active: true },
  { from: 'agent-3', to: 'policy-1', type: 'control', active: false },
  { from: 'agent-4', to: 'policy-3', type: 'control', active: false },
  
  // All to Audit
  { from: 'agent-1', to: 'policy-4', type: 'data', active: true },
  { from: 'agent-2', to: 'policy-4', type: 'data', active: true },
  { from: 'agent-3', to: 'policy-4', type: 'data', active: false },
  { from: 'agent-4', to: 'policy-4', type: 'data', active: false },
  
  // Policies to Actions
  { from: 'policy-1', to: 'action-1', label: 'allowed', type: 'control', active: true },
  { from: 'policy-2', to: 'action-1', label: 'allowed', type: 'control', active: true },
  { from: 'policy-3', to: 'action-2', label: 'allowed', type: 'control', active: false },
  
  // Actions to Outputs
  { from: 'action-1', to: 'output-2', type: 'data', active: true },
  { from: 'action-2', to: 'output-1', type: 'data', active: false },
  { from: 'action-3', to: 'output-2', type: 'data', active: false },
  
  // Audit to Output
  { from: 'policy-4', to: 'output-2', type: 'data', active: true },
];

export default function SystemBrain() {
  const [selectedNode, setSelectedNode] = useState<SystemNode | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'logs' | 'decisions'>('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filteredNodes = useMemo(() => {
    return SYSTEM_NODES.filter(node => {
      if (filter !== 'all' && node.type !== filter) return false;
      if (search && !node.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filter, search]);

  const getNodeIcon = (type: SystemNode['type']) => {
    switch (type) {
      case 'input': return FileInput;
      case 'agent': return Cpu;
      case 'policy': return Shield;
      case 'action': return Play;
      case 'output': return FileOutput;
    }
  };

  const getStatusColor = (status: SystemNode['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'idle': return 'text-slate-400 bg-slate-400/20 border-slate-400/30';
      case 'blocked': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'error': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">System Brain</h1>
                <p className="text-xs text-slate-400">Living visualization of all agents, policies, and actions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  {SYSTEM_NODES.filter(n => n.status === 'active').length} Active
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  {SYSTEM_NODES.filter(n => n.status === 'idle').length} Idle
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  {SYSTEM_NODES.filter(n => n.status === 'blocked').length} Blocked
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Graph View */}
        <div className="flex-1 relative overflow-hidden">
          {/* Toolbar */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur rounded-lg p-2 border border-slate-800">
              <Filter className="w-4 h-4 text-slate-400 ml-2" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-sm border-none outline-none text-slate-300"
              >
                <option value="all">All Types</option>
                <option value="input">Inputs</option>
                <option value="agent">Agents</option>
                <option value="policy">Policies</option>
                <option value="action">Actions</option>
                <option value="output">Outputs</option>
              </select>
            </div>
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search nodes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-slate-900/90 border-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Graph Canvas */}
          <div className="w-full h-full bg-slate-950 relative">
            <svg className="w-full h-full">
              {/* Edges */}
              {SYSTEM_EDGES.map((edge, index) => {
                const fromNode = SYSTEM_NODES.find(n => n.id === edge.from);
                const toNode = SYSTEM_NODES.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                
                return (
                  <g key={index}>
                    <line
                      x1={fromNode.position.x}
                      y1={fromNode.position.y}
                      x2={toNode.position.x}
                      y2={toNode.position.y}
                      stroke={edge.active ? '#3b82f6' : '#334155'}
                      strokeWidth={edge.active ? 2 : 1}
                      strokeDasharray={edge.type === 'control' ? '5,5' : undefined}
                      opacity={edge.active ? 1 : 0.3}
                    />
                    {edge.label && (
                      <text
                        x={(fromNode.position.x + toNode.position.x) / 2}
                        y={(fromNode.position.y + toNode.position.y) / 2 - 5}
                        fill={edge.active ? '#60a5fa' : '#64748b'}
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Nodes */}
              {filteredNodes.map((node) => {
                const Icon = getNodeIcon(node.type);
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.position.x}, ${node.position.y})`}
                    className="cursor-pointer"
                    onClick={() => setSelectedNode(node)}
                  >
                    <circle
                      r="30"
                      className={`${getStatusColor(node.status).split(' ')[1]} ${getStatusColor(node.status).split(' ')[2]} transition-all`}
                      strokeWidth="2"
                    />
                    <foreignObject x="-15" y="-15" width="30" height="30">
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className={`w-4 h-4 ${getStatusColor(node.status).split(' ')[0]}`} />
                      </div>
                    </foreignObject>
                    <text
                      y="45"
                      fill="#94a3b8"
                      fontSize="11"
                      textAnchor="middle"
                      className="font-medium"
                    >
                      {node.name}
                    </text>
                    {node.status === 'active' && (
                      <circle r="35" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.5">
                        <animate
                          attributeName="r"
                          values="35;40;35"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.5;0;0.5"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur rounded-lg p-4 border border-slate-800">
            <h4 className="text-sm font-semibold mb-2">Node Types</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <FileInput className="w-3 h-3 text-blue-400" />
                <span>Input</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span>Agent</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-green-400" />
                <span>Policy</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="w-3 h-3 text-yellow-400" />
                <span>Action</span>
              </div>
              <div className="flex items-center gap-2">
                <FileOutput className="w-3 h-3 text-pink-400" />
                <span>Output</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="w-[450px] bg-slate-900 border-l border-slate-800 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = getNodeIcon(selectedNode.type);
                      return (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(selectedNode.status)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      );
                    })()}
                    <div>
                      <h2 className="font-semibold">{selectedNode.name}</h2>
                      <p className="text-xs text-slate-400 capitalize">{selectedNode.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 hover:bg-slate-800 rounded"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                {(['overview', 'code', 'logs', 'decisions'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {activeTab === 'overview' && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-300 mb-2">Description</h3>
                      <p className="text-sm text-slate-400">{selectedNode.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-3 bg-slate-950 border-slate-800">
                        <p className="text-xs text-slate-500">Status</p>
                        <Badge className={`mt-1 ${getStatusColor(selectedNode.status)}`}>
                          {selectedNode.status}
                        </Badge>
                      </Card>
                      <Card className="p-3 bg-slate-950 border-slate-800">
                        <p className="text-xs text-slate-500">Total Runs</p>
                        <p className="text-lg font-semibold">{selectedNode.runCount.toLocaleString()}</p>
                      </Card>
                    </div>

                    {selectedNode.lastRun && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">Last Run</h3>
                        <p className="text-sm text-slate-400">
                          {new Date(selectedNode.lastRun).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {selectedNode.blastRadius && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          Blast Radius
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedNode.blastRadius.map((item) => (
                            <Badge key={item} variant="outline" className="border-yellow-500/30 text-yellow-400">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedNode.constraints && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-blue-400" />
                          Constraints
                        </h3>
                        <div className="space-y-1">
                          {selectedNode.constraints.map((constraint) => (
                            <div key={constraint} className="flex items-center gap-2 text-sm text-slate-400">
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                              {constraint}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'code' && selectedNode.code && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Code className="w-4 h-4" />
                      Implementation
                    </div>
                    <pre className="p-4 bg-slate-950 rounded-lg overflow-x-auto text-xs font-mono text-slate-300">
                      {selectedNode.code}
                    </pre>
                    
                    {selectedNode.prompt && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-slate-400 pt-4 border-t border-slate-800">
                          <Terminal className="w-4 h-4" />
                          System Prompt
                        </div>
                        <div className="p-4 bg-slate-950 rounded-lg text-xs text-slate-400 italic">
                          &ldquo;{selectedNode.prompt}&rdquo;
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'logs' && selectedNode.logs && (
                  <div className="space-y-2">
                    {selectedNode.logs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg text-sm ${
                          log.level === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                          log.level === 'warn' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                          'bg-slate-950 border border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge
                            variant="outline"
                            className={
                              log.level === 'error' ? 'border-red-500/30 text-red-400' :
                              log.level === 'warn' ? 'border-yellow-500/30 text-yellow-400' :
                              'border-blue-500/30 text-blue-400'
                            }
                          >
                            {log.level}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-300">{log.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'decisions' && selectedNode.decisions && (
                  <div className="space-y-4">
                    {selectedNode.decisions.map((decision) => (
                      <Card key={decision.id} className="p-4 bg-slate-950 border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                            Decision #{decision.id}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(decision.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Input</p>
                            <p className="text-sm text-slate-300">{decision.input}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Decision</p>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {decision.output}
                            </Badge>
                          </div>
                          
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Reasoning</p>
                            <p className="text-sm text-slate-400">{decision.reasoning}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Confidence</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                  style={{ width: `${decision.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-slate-300">
                                {(decision.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-slate-800">
                            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Why NOT these alternatives?
                            </p>
                            <div className="space-y-1">
                              {decision.alternatives.map((alt, i) => (
                                <div key={alt} className="flex items-start gap-2 text-sm">
                                  <X className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-slate-400">{alt}</span>
                                  <ChevronRight className="w-3 h-3 text-slate-600 mx-1" />
                                  <span className="text-slate-500">{decision.whyNot[i]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
