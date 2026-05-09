const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "are",
  "will",
  "you",
  "your",
  "have",
  "has",
  "into",
  "项目",
  "用户",
  "进行",
  "一个",
  "可以",
  "需要",
  "通过",
  "负责"
]);

const PATTERNS = {
  goals: /\b(goal|objective|target|aim)\b|目标|目的|愿景/i,
  progress: /\b(progress|done|completed|current|status|implemented)\b|进度|完成|已实现|当前|状态/i,
  risks: /\b(risk|blocker|issue|unknown|constraint|problem)\b|风险|阻塞|问题|不确定|限制/i,
  todos: /\b(todo|next|action|task|follow[- ]?up|implement|prepare)\b|待办|任务|下一步|行动|实现|准备/i,
  decisions: /\b(decision|decided|choose|selected)\b|决定|决策|选择/i
};

export function createInitialState() {
  return {
    updatedAt: new Date().toISOString(),
    sources: [],
    goals: [],
    progress: [],
    risks: [],
    todos: [],
    decisions: [],
    entities: [],
    briefs: []
  };
}

export function runAgentPipeline(state, source) {
  const normalizedSource = normalizeSource(source);
  const parsed = documentParserAgent(normalizedSource);
  const nextState = mergeExtraction(state, normalizedSource, parsed);
  const plan = planningAgent(nextState);
  const execution = executionAgent(nextState, plan);
  const review = reviewAgent(normalizedSource, parsed, execution);
  const brief = {
    id: `brief-${Date.now()}`,
    sourceId: normalizedSource.id,
    createdAt: new Date().toISOString(),
    plan,
    execution,
    review
  };

  return {
    state: {
      ...nextState,
      updatedAt: new Date().toISOString(),
      briefs: [brief, ...nextState.briefs].slice(0, 20)
    },
    agents: {
      parser: parsed,
      planner: plan,
      executor: execution,
      reviewer: review
    }
  };
}

export function answerQuestion(state, question) {
  const matches = retrieveSnippets(state, question, 5);
  const lowerQuestion = question.toLowerCase();
  const buckets = [
    ["risk", "风险", state.risks],
    ["todo", "待办", state.todos],
    ["task", "任务", state.todos],
    ["goal", "目标", state.goals],
    ["progress", "进度", state.progress],
    ["decision", "决策", state.decisions]
  ];
  const focused = buckets.find(([en, zh]) => lowerQuestion.includes(en) || question.includes(zh));
  const facts = focused ? focused[2].slice(0, 5) : matches.map((match) => match.text).slice(0, 5);

  const answer = facts.length
    ? facts.map((fact, index) => `${index + 1}. ${fact}`).join("\n")
    : "当前资料中没有足够证据回答这个问题。请继续上传项目文档、会议记录或代码说明。";

  return {
    question,
    answer,
    sources: matches.map(({ sourceTitle, text, score }) => ({
      sourceTitle,
      snippet: text,
      score
    }))
  };
}

export function generateProjectBrief(state) {
  return [
    "# Project Brief",
    "",
    "## Goals",
    listOrEmpty(state.goals),
    "",
    "## Current Progress",
    listOrEmpty(state.progress),
    "",
    "## Risks",
    listOrEmpty(state.risks),
    "",
    "## Next Actions",
    listOrEmpty(state.todos),
    "",
    "## Decisions",
    listOrEmpty(state.decisions)
  ].join("\n");
}

function normalizeSource(source) {
  const content = String(source.content || "").trim();
  return {
    id: source.id || `src-${Date.now()}`,
    title: String(source.title || "Untitled source").trim(),
    content,
    createdAt: source.createdAt || new Date().toISOString(),
    snippets: splitIntoSnippets(content)
  };
}

function documentParserAgent(source) {
  const extraction = {
    goals: [],
    progress: [],
    risks: [],
    todos: [],
    decisions: [],
    entities: extractEntities(source.content),
    facts: []
  };

  for (const snippet of source.snippets) {
    const cleaned = cleanLine(snippet);
    if (!cleaned) continue;
    extraction.facts.push(cleaned);
    for (const [bucket, pattern] of Object.entries(PATTERNS)) {
      if (pattern.test(cleaned)) {
        extraction[bucket].push(stripLeadingLabel(cleaned));
      }
    }
  }

  if (!extraction.goals.length && extraction.facts[0]) {
    extraction.goals.push(extraction.facts[0]);
  }

  return mapValues(extraction, uniqueList);
}

function planningAgent(state) {
  const riskDrivenTodos = state.risks.slice(0, 3).map((risk) => `Mitigate risk: ${risk}`);
  const sourceDrivenTodos = state.todos.slice(0, 5);
  const actions = uniqueList([...sourceDrivenTodos, ...riskDrivenTodos]).slice(0, 8);

  return {
    priority: state.risks.length ? "focus-risk-first" : "continue-execution",
    actions,
    rationale: state.risks.length
      ? "Open risks exist, so the next plan prioritizes validation and mitigation before expansion."
      : "No explicit risk was detected, so the plan continues implementation and documentation."
  };
}

function executionAgent(state, plan) {
  return {
    summary: [
      `The project has ${state.sources.length} source(s), ${state.goals.length} goal(s), ${state.todos.length} todo(s), and ${state.risks.length} risk item(s).`,
      plan.actions.length
        ? `Recommended next action: ${plan.actions[0]}`
        : "Recommended next action: add more project material to improve the agent memory."
    ].join(" "),
    draft: generateProjectBrief(state)
  };
}

function reviewAgent(source, parsed, execution) {
  const sourceTerms = new Set(tokenize(source.content));
  const summaryTerms = tokenize(execution.summary);
  const unsupportedTerms = summaryTerms.filter((term) => !sourceTerms.has(term) && !STOP_WORDS.has(term));
  const groundedSignals = parsed.facts.length + parsed.entities.length;

  return {
    status: unsupportedTerms.length > 8 && groundedSignals < 3 ? "needs-human-review" : "grounded",
    checkedAgainst: source.title,
    evidenceCount: groundedSignals,
    note:
      "The reviewer compares generated output with source terms and extracted facts. It is intentionally conservative in this local prototype."
  };
}

function mergeExtraction(state, source, parsed) {
  const sources = [
    {
      id: source.id,
      title: source.title,
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

function retrieveSnippets(state, question, limit) {
  const queryTerms = tokenize(question);
  return state.sources
    .flatMap((source) =>
      source.snippets.map((text) => ({
        sourceTitle: source.title,
        text,
        score: scoreSnippet(queryTerms, text)
      }))
    )
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function scoreSnippet(queryTerms, text) {
  const snippetTerms = new Set(tokenize(text));
  return queryTerms.reduce((score, term) => score + (snippetTerms.has(term) ? 1 : 0), 0);
}

function splitIntoSnippets(content) {
  return content
    .split(/\n+|(?<=[.!?。！？；;])\s+/)
    .map(cleanLine)
    .filter(Boolean)
    .slice(0, 200);
}

function cleanLine(line) {
  return String(line).replace(/^[-*#\d.\s]+/, "").trim();
}

function stripLeadingLabel(line) {
  return line.replace(/^(goal|objective|progress|risk|todo|decision|current progress)\s*[:：-]\s*/i, "").trim();
}

function extractEntities(content) {
  const english = content.match(/\b[A-Z][A-Za-z0-9_-]{2,}\b/g) || [];
  const chinese = content.match(/[\u4e00-\u9fa5]{2,}(?:Agent|系统|项目|资料|风险|任务|模型|额度)?/g) || [];
  return uniqueList([...english, ...chinese]).slice(0, 30);
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .match(/[a-z0-9_'-]+|[\u4e00-\u9fa5]{2,}/g)
    ?.filter((term) => !STOP_WORDS.has(term)) || [];
}

function uniqueList(items) {
  const seen = new Set();
  const output = [];
  for (const item of items.flat()) {
    const value = String(item || "").trim();
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      output.push(value);
    }
  }
  return output;
}

function mapValues(object, mapper) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, mapper(value)]));
}

function listOrEmpty(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- No explicit item detected yet.";
}
