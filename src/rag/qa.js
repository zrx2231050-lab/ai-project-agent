import { detectQuestionIntent, retrieveSnippets } from "./retriever.js";

export function answerQuestion(state, question) {
  const intent = detectQuestionIntent(question);
  const matches = retrieveSnippets(state, question, 6);
  const facts = selectFactsByIntent(state, intent);
  const evidence = matches.slice(0, 4);
  const confidence = estimateAnswerConfidence(facts, evidence);
  const answer = buildAnswer({ facts, evidence, intent, confidence });

  return {
    question,
    intent,
    answer,
    confidence,
    insufficientEvidence: confidence < 0.45,
    sources: evidence.map(({ sourceId, sourceTitle, snippetId, heading, startLine, endLine, text, score }) => ({
      sourceId,
      sourceTitle,
      snippetId,
      heading,
      startLine,
      endLine,
      snippet: text,
      score
    }))
  };
}

function selectFactsByIntent(state, intent) {
  const map = {
    risk: state.riskItems?.length ? state.riskItems.map((risk) => `${risk.text}；缓解建议：${risk.mitigation}`) : state.risks,
    todo: state.taskItems?.length ? state.taskItems.map((task) => `[${task.priority}] ${task.text}`) : state.todos,
    goal: state.goals,
    progress: state.progress,
    decision: state.decisions,
    summary: [...state.goals, ...state.progress, ...state.risks, ...state.todos].slice(0, 8)
  };
  return (map[intent] || []).filter(Boolean).slice(0, 6);
}

function buildAnswer({ facts, evidence, intent, confidence }) {
  if (!facts.length && !evidence.length) {
    return "当前资料中没有足够证据回答这个问题。请继续上传项目文档、会议记录或代码说明。";
  }

  const prefix =
    confidence < 0.45
      ? "我没有找到足够直接的证据，下面只是基于当前资料的有限判断："
      : answerPrefix(intent);
  const lines = facts.length ? facts : evidence.map((item) => item.text);
  return [prefix, ...lines.slice(0, 6).map((fact, index) => `${index + 1}. ${fact}`)].join("\n");
}

function answerPrefix(intent) {
  return (
    {
      risk: "根据当前资料，主要风险是：",
      todo: "根据当前资料，建议优先推进：",
      goal: "根据当前资料，项目目标是：",
      progress: "根据当前资料，当前进度是：",
      decision: "根据当前资料，已有决策是：",
      summary: "根据当前资料，项目概览如下："
    }[intent] || "根据当前资料，可以回答如下："
  );
}

function estimateAnswerConfidence(facts, evidence) {
  if (!facts.length && !evidence.length) return 0;
  const factSignal = Math.min(0.55, facts.length * 0.18);
  const evidenceSignal = Math.min(0.45, evidence.reduce((sum, item) => sum + Math.min(item.score, 8), 0) / 24);
  return Number(Math.min(0.95, 0.15 + factSignal + evidenceSignal).toFixed(2));
}
