export const domainSchemas = {
  Project: {
    id: "string",
    name: "string",
    description: "string",
    createdAt: "ISO timestamp"
  },
  SourceDocument: {
    id: "string",
    projectId: "string",
    title: "string",
    type: "text | markdown | transcript | code-note",
    content: "string",
    snippets: "Snippet[]",
    createdAt: "ISO timestamp"
  },
  ExtractedFact: {
    id: "string",
    sourceId: "string",
    kind: "goal | progress | risk | todo | decision | entity",
    text: "string",
    confidence: "number"
  },
  TaskItem: {
    id: "string",
    text: "string",
    priority: "low | medium | high",
    status: "todo | doing | done | blocked",
    sourceId: "string"
  },
  RiskItem: {
    id: "string",
    text: "string",
    severity: "low | medium | high",
    mitigation: "string",
    sourceId: "string"
  },
  AgentPlan: {
    priority: "focus-risk-first | continue-execution",
    actions: "string[]",
    tasks: "TaskItem[]",
    blockers: "TaskItem[]",
    nextMilestone: "string",
    rationale: "string"
  },
  AgentRun: {
    id: "string",
    sourceId: "string",
    parser: "object",
    planner: "object",
    executor: "object",
    reviewer: "object",
    createdAt: "ISO timestamp"
  },
  ReviewResult: {
    status: "grounded | needs-human-review",
    evidenceCount: "number",
    note: "string"
  }
};
