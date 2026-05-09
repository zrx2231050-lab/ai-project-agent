import { cleanLine, extractEntities, mapValues, stripLeadingLabel, uniqueList } from "../utils/text.js";

const PATTERNS = {
  goals: /\b(goal|objective|target|aim)\b|目标|目的|愿景/i,
  progress: /\b(progress|done|completed|current|status|implemented)\b|进度|完成|已实现|当前|状态/i,
  risks: /\b(risk|blocker|issue|unknown|constraint|problem)\b|风险|阻塞|问题|不确定|限制/i,
  todos: /\b(todo|next|action|task|follow[- ]?up|implement|prepare)\b|待办|任务|下一步|行动|实现|准备/i,
  decisions: /\b(decision|decided|choose|selected)\b|决定|决策|选择/i
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
}
