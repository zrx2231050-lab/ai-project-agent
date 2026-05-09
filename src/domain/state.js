export function createInitialState() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    projects: [],
    sources: [],
    goals: [],
    progress: [],
    risks: [],
    riskItems: [],
    todos: [],
    taskItems: [],
    decisions: [],
    entities: [],
    facts: [],
    agentRuns: [],
    briefs: []
  };
}

export function normalizeSourceDocument(source) {
  return {
    id: source.id || `src-${Date.now()}`,
    projectId: source.projectId || "default",
    title: String(source.title || "Untitled source").trim(),
    type: source.type || "text",
    content: String(source.content || "").trim(),
    createdAt: source.createdAt || new Date().toISOString()
  };
}
