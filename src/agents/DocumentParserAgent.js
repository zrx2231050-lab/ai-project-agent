import { cleanLine, extractEntities, stripLeadingLabel, uniqueList } from "../utils/text.js";

const PATTERNS = {
  goals: /\b(goal|objective|target|aim)\b|目标|目的|愿景|要解决/i,
  progress: /\b(progress|done|completed|current|status|implemented|finished)\b|进度|完成|已实现|当前|状态|已经/i,
  risks: /\b(risk|blocker|issue|unknown|constraint|problem|concern)\b|风险|阻塞|问题|不确定|限制|担心/i,
  todos: /\b(todo|next|action|task|follow[- ]?up|implement|prepare|need to)\b|待办|任务|下一步|行动|实现|准备|需要/i,
  decisions: /\b(decision|decided|choose|selected|keep)\b|决定|决策|选择|采用|保持/i
};

const SEVERITY_PATTERNS = {
  high: /\b(high|critical|severe|blocked|urgent)\b|高|严重|紧急|阻塞|无法/i,
  low: /\b(low|minor|small)\b|低|轻微/i
};

const PRIORITY_PATTERNS = {
  high: /\b(urgent|must|critical|blocker|asap)\b|必须|紧急|优先|阻塞|关键/i,
  low: /\b(could|nice|later)\b|可以|稍后|低/i
};

export class DocumentParserAgent {
  run(source) {
    const extraction = {
      goals: [],
      progress: [],
      risks: [],
      todos: [],
      decisions: [],
      entities: extractEntities(source.content),
      facts: [],
      structuredFacts: [],
      taskItems: [],
      riskItems: [],
      confidence: 0
    };

    source.snippets.forEach((snippet, index) => {
      const cleaned = cleanLine(snippet);
      if (!cleaned) return;
      extraction.facts.push(cleaned);

      for (const [bucket, pattern] of Object.entries(PATTERNS)) {
        if (pattern.test(cleaned)) {
          const text = stripLeadingLabel(cleaned);
          extraction[bucket].push(text);
          extraction.structuredFacts.push(toFact(source, bucket, text, index));
          if (bucket === "todos") extraction.taskItems.push(toTask(source, text, index));
          if (bucket === "risks") extraction.riskItems.push(toRisk(source, text, index));
        }
      }
    });

    if (!extraction.goals.length && extraction.facts[0]) {
      extraction.goals.push(extraction.facts[0]);
      extraction.structuredFacts.push(toFact(source, "goals", extraction.facts[0], 0, 0.58));
    }

    extraction.goals = uniqueList(extraction.goals);
    extraction.progress = uniqueList(extraction.progress);
    extraction.risks = uniqueList(extraction.risks);
    extraction.todos = uniqueList(extraction.todos);
    extraction.decisions = uniqueList(extraction.decisions);
    extraction.entities = uniqueList(extraction.entities);
    extraction.facts = uniqueList(extraction.facts);
    extraction.structuredFacts = uniqueByText(extraction.structuredFacts);
    extraction.taskItems = uniqueByText(extraction.taskItems);
    extraction.riskItems = uniqueByText(extraction.riskItems);
    extraction.confidence = estimateConfidence(extraction);

    return extraction;
  }
}

function toFact(source, kind, text, snippetIndex, confidence = 0.74) {
  return {
    id: `fact-${source.id}-${kind}-${snippetIndex}`,
    sourceId: source.id,
    kind: normalizeKind(kind),
    text,
    confidence,
    snippetIndex
  };
}

function toTask(source, text, snippetIndex) {
  return {
    id: `task-${source.id}-${snippetIndex}`,
    sourceId: source.id,
    text,
    priority: detectPriority(text),
    status: /阻塞|blocked|无法/i.test(text) ? "blocked" : "todo",
    confidence: 0.76
  };
}

function toRisk(source, text, snippetIndex) {
  return {
    id: `risk-${source.id}-${snippetIndex}`,
    sourceId: source.id,
    text,
    severity: detectSeverity(text),
    mitigation: buildMitigation(text),
    confidence: 0.78
  };
}

function normalizeKind(kind) {
  return {
    goals: "goal",
    progress: "progress",
    risks: "risk",
    todos: "todo",
    decisions: "decision"
  }[kind];
}

function detectPriority(text) {
  if (PRIORITY_PATTERNS.high.test(text)) return "high";
  if (PRIORITY_PATTERNS.low.test(text)) return "low";
  return "medium";
}

function detectSeverity(text) {
  if (SEVERITY_PATTERNS.high.test(text)) return "high";
  if (SEVERITY_PATTERNS.low.test(text)) return "low";
  return "medium";
}

function buildMitigation(text) {
  if (/token|额度|配额|quota/i.test(text)) return "确认模型额度、记录预估 token 消耗，并准备降级方案。";
  if (/碎片|inconsistent|不一致/i.test(text)) return "增加资料规范化和来源引用，减少上下文歧义。";
  if (/幻觉|unsupported|cite|引用/i.test(text)) return "要求生成内容附带来源片段，并交给审核 Agent 标记无证据断言。";
  return `为该风险建立验证任务并指定负责人：${text}`;
}

function estimateConfidence(extraction) {
  const signalCount =
    extraction.goals.length +
    extraction.progress.length +
    extraction.risks.length +
    extraction.todos.length +
    extraction.decisions.length;
  return Math.min(0.95, Number((0.45 + signalCount * 0.07).toFixed(2)));
}

function uniqueByText(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
