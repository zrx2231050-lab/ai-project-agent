export const STOP_WORDS = new Set([
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
  "project",
  "user",
  "项目",
  "用户",
  "进行",
  "一个",
  "可以",
  "需要",
  "通过",
  "负责",
  "什么",
  "目前",
  "如何",
  "哪些"
]);

export function cleanLine(line) {
  return String(line || "")
    .replace(/^[-*#>\d.\s]+/, "")
    .trim();
}

export function stripLeadingLabel(line) {
  return cleanLine(line)
    .replace(/^(goal|objective|progress|risk|todo|decision|current progress)\s*[:：-]\s*/i, "")
    .replace(/^(目标|目的|进度|当前进度|风险|待办|任务|决策|决定)\s*[:：-]\s*/i, "")
    .trim();
}

export function extractEntities(content) {
  const text = String(content || "");
  const english = text.match(/\b[A-Z][A-Za-z0-9_-]{2,}\b/g) || [];
  const chinese = text.match(/[\u4e00-\u9fa5]{2,}(?:Agent|系统|项目|资料|风险|任务|模型|额度)?/g) || [];
  return uniqueList([...english, ...chinese]).slice(0, 30);
}

export function tokenize(text) {
  return (
    String(text || "")
      .toLowerCase()
      .match(/[a-z0-9_'-]+|[\u4e00-\u9fa5]{2,}/g)
      ?.filter((term) => !STOP_WORDS.has(term)) || []
  );
}

export function uniqueList(items) {
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

export function mapValues(object, mapper) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, mapper(value)]));
}

export function listOrEmpty(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- 暂未识别到明确内容。";
}

export function snippetText(snippet) {
  return typeof snippet === "string" ? snippet : snippet?.text || "";
}
