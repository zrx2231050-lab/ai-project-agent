import { STOP_WORDS, tokenize, uniqueList } from "../utils/text.js";

export class ReviewAgent {
  async run(source, parsed, execution) {
    const sourceTerms = new Set(tokenize(source.content));
    const generatedText = [execution.summary, execution.recommendation?.nextAction, execution.recommendation?.topRisk]
      .filter(Boolean)
      .join("\n");
    const summaryTerms = tokenize(generatedText);
    const unsupportedTerms = summaryTerms.filter((term) => !sourceTerms.has(term) && !STOP_WORDS.has(term));
    const groundedSignals = parsed.facts.length + parsed.entities.length;
    const evidenceCoverage = parsed.facts.length ? Math.min(1, groundedSignals / (parsed.facts.length + 3)) : 0;
    const unsupportedRate = summaryTerms.length ? unsupportedTerms.length / summaryTerms.length : 0;
    const confidence = Number(Math.max(0.35, Math.min(0.98, evidenceCoverage - unsupportedRate + 0.35)).toFixed(2));

    return {
      status: confidence < 0.62 ? "needs-human-review" : "grounded",
      checkedAgainst: source.title,
      evidenceCount: groundedSignals,
      confidence,
      unsupportedTerms: uniqueList(unsupportedTerms).slice(0, 12),
      checks: [
        {
          name: "source-grounding",
          passed: confidence >= 0.62,
          detail: `生成内容与来源资料的词项覆盖度约为 ${Math.round(confidence * 100)}%。`
        },
        {
          name: "risk-awareness",
          passed: parsed.risks.length === 0 || Boolean(execution.recommendation?.topRisk),
          detail: parsed.risks.length ? "已将风险纳入执行建议。" : "当前资料未识别到明确风险。"
        }
      ],
      note: "审核 Agent 会比较生成内容和来源资料，并给出保守的可信度评分；低分结果需要人工复核。"
    };
  }
}
