import { DocumentParserAgent } from "../agents/DocumentParserAgent.js";
import { ExecutionAgent } from "../agents/ExecutionAgent.js";
import { PlanningAgent } from "../agents/PlanningAgent.js";
import { ReviewAgent } from "../agents/ReviewAgent.js";
import { normalizeSourceDocument } from "../domain/state.js";
import { LLMClient } from "../llm/LLMClient.js";
import { isLLMEnabled } from "../llm/config.js";
import { buildSourceSnippets } from "../rag/chunker.js";
import { uniqueList } from "../utils/text.js";

export class ProjectWorkflow {
  constructor({
    llm = new LLMClient(),
    enableLLM = isLLMEnabled(),
    parser = new DocumentParserAgent(),
    planner = new PlanningAgent(),
    executor = new ExecutionAgent({ llm, enableLLM }),
    reviewer = new ReviewAgent()
  } = {}) {
    this.llm = llm;
    this.enableLLM = enableLLM;
    this.parser = parser;
    this.planner = planner;
    this.executor = executor;
    this.reviewer = reviewer;
  }

  async ingest(state, sourceInput) {
    const source = withSnippets(normalizeSourceDocument(sourceInput));
    const parsed = await this.parser.run(source);
    const nextState = mergeExtraction(state, source, parsed);
    const plan = await this.planner.run(nextState);
    const execution = await this.executor.run(nextState, plan);
    const review = await this.reviewer.run(source, parsed, execution);
    const run = {
      id: `run-${Date.now()}`,
      sourceId: source.id,
      createdAt: new Date().toISOString(),
      parser: parsed,
      planner: plan,
      executor: execution,
      reviewer: review
    };

    return {
      state: {
        ...nextState,
        updatedAt: new Date().toISOString(),
        agentRuns: [run, ...(nextState.agentRuns || [])].slice(0, 50),
        briefs: [toBrief(run), ...(nextState.briefs || [])].slice(0, 20)
      },
      agents: {
        parser: parsed,
        planner: plan,
        executor: execution,
        reviewer: review
      }
    };
  }
}

export function runAgentPipeline(state, sourceInput) {
  return new ProjectWorkflow().ingest(state, sourceInput);
}

function withSnippets(source) {
  return {
    ...source,
    snippets: buildSourceSnippets(source.content, { sourceId: source.id })
  };
}

function mergeExtraction(state, source, parsed) {
  const sources = [
    {
      id: source.id,
      projectId: source.projectId,
      title: source.title,
      type: source.type,
      createdAt: source.createdAt,
      snippets: source.snippets
    },
    ...state.sources
  ];

  return {
    ...state,
    sources,
    goals: uniqueList([...state.goals, ...parsed.goals]),
    progress: uniqueList([...state.progress, ...parsed.progress]),
    risks: uniqueList([...state.risks, ...parsed.risks]),
    riskItems: uniqueByText([...(state.riskItems || []), ...parsed.riskItems]),
    todos: uniqueList([...state.todos, ...parsed.todos]),
    taskItems: uniqueByText([...(state.taskItems || []), ...parsed.taskItems]),
    decisions: uniqueList([...state.decisions, ...parsed.decisions]),
    entities: uniqueList([...state.entities, ...parsed.entities]),
    facts: uniqueByText([...(state.facts || []), ...parsed.structuredFacts])
  };
}

function uniqueByText(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item.text || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toBrief(run) {
  return {
    id: `brief-${Date.now()}`,
    sourceId: run.sourceId,
    createdAt: run.createdAt,
    plan: run.planner,
    execution: run.executor,
    review: run.reviewer
  };
}
