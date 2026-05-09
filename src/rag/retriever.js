import { snippetText, tokenize } from "../utils/text.js";

export function retrieveSnippets(state, question, limit = 5) {
  const queryTerms = tokenize(question);
  const intent = detectQuestionIntent(question);

  return state.sources
    .flatMap((source) =>
      (source.snippets || []).map((snippet) => {
        const text = snippetText(snippet);
        return {
          sourceId: source.id,
          sourceTitle: source.title,
          snippetId: typeof snippet === "string" ? `${source.id}-legacy` : snippet.id,
          heading: typeof snippet === "string" ? "正文" : snippet.heading,
          startLine: typeof snippet === "string" ? null : snippet.startLine,
          endLine: typeof snippet === "string" ? null : snippet.endLine,
          text,
          score: scoreSnippet(queryTerms, text, intent)
        };
      })
    )
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function detectQuestionIntent(question) {
  const text = String(question || "").toLowerCase();
  if (/risk|风险|阻塞|问题|不确定/.test(text)) return "risk";
  if (/todo|task|next|action|待办|任务|下一步|行动/.test(text)) return "todo";
  if (/goal|objective|目标|目的/.test(text)) return "goal";
  if (/progress|status|进度|状态|完成/.test(text)) return "progress";
  if (/decision|决策|决定|选择/.test(text)) return "decision";
  if (/summary|brief|总结|摘要|概括/.test(text)) return "summary";
  return "general";
}

function scoreSnippet(queryTerms, text, intent) {
  const snippetTerms = new Set(tokenize(text));
  const baseScore = queryTerms.reduce((score, term) => score + (snippetTerms.has(term) ? 2 : 0), 0);
  const partialScore = queryTerms.reduce((score, term) => {
    if (term.length < 3) return score;
    return score + (String(text).toLowerCase().includes(term) ? 1 : 0);
  }, 0);
  return baseScore + partialScore + intentBoost(text, intent);
}

function intentBoost(text, intent) {
  const value = String(text || "");
  const boosts = {
    risk: /risk|风险|阻塞|问题|不确定|限制/i,
    todo: /todo|task|next|待办|任务|下一步|行动|准备|实现/i,
    goal: /goal|objective|目标|目的|愿景/i,
    progress: /progress|status|进度|状态|完成|已经/i,
    decision: /decision|决策|决定|选择|采用/i,
    summary: /目标|进度|风险|待办|决策|goal|progress|risk|todo/i
  };
  return boosts[intent]?.test(value) ? 3 : 0;
}
