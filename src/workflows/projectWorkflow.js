import { DocumentParserAgent } from "../agents/DocumentParserAgent.js";
import { ExecutionAgent } from "../agents/ExecutionAgent.js";
import { PlanningAgent } from "../agents/PlanningAgent.js";
import { ReviewAgent } from "../agents/ReviewAgent.js";
import { normalizeSourceDocument } from "../domain/state.js";
import { splitIntoSnippets, uniqueList } from "../utils/text.js";

export class ProjectWorkflow {
  constructor({
    parser = new DocumentParserAgent(),
    planner = new PlanningAgent(),
    executor = new ExecutionAgent(),
    reviewer = new ReviewAgent()
  } = {}) {
    this.parser = parser;
    this.planner = planner;
    this.executor = executor;
    this.reviewer = reviewer;
  }

  ingest(state, sourceInput) {
    const source = withSnippets(normalizeSourceDocument(sourceInput));
    const parsed = this.parser.run(source);
    const nextState = mergeExtraction(state, source, parsed);
    const plan = this.planner.run(nextState);
    const execution = this.executor.run(nextState, plan);
    const review = this.reviewer.run(source, parsed, execution);
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
    snippets: splitIntoSnippets(source.content)
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
    todos: uniqueList([...state.todos, ...parsed.todos]),
    decisions: uniqueList([...state.decisions, ...parsed.decisions]),
    entities: uniqueList([...state.entities, ...parsed.entities])
  };
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
