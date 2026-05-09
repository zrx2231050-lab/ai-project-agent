import { STOP_WORDS, tokenize } from "../utils/text.js";

export class ReviewAgent {
  run(source, parsed, execution) {
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
}
