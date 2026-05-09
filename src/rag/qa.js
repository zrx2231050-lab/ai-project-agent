import { retrieveSnippets } from "./retriever.js";

export function answerQuestion(state, question) {
  const matches = retrieveSnippets(state, question, 5);
  const lowerQuestion = String(question || "").toLowerCase();
  const buckets = [
    ["risk", "风险", state.risks],
    ["todo", "待办", state.todos],
    ["task", "任务", state.todos],
    ["goal", "目标", state.goals],
    ["progress", "进度", state.progress],
    ["decision", "决策", state.decisions]
  ];
  const focused = buckets.find(([en, zh]) => lowerQuestion.includes(en) || String(question).includes(zh));
  const facts = focused ? focused[2].slice(0, 5) : matches.map((match) => match.text).slice(0, 5);

  const answer = facts.length
    ? facts.map((fact, index) => `${index + 1}. ${fact}`).join("\n")
    : "当前资料中没有足够证据回答这个问题。请继续上传项目文档、会议记录或代码说明。";

  return {
    question,
    answer,
    sources: matches.map(({ sourceId, sourceTitle, text, score }) => ({
      sourceId,
      sourceTitle,
      snippet: text,
      score
    }))
  };
}
