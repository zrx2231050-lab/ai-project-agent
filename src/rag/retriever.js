import { tokenize } from "../utils/text.js";

export function retrieveSnippets(state, question, limit = 5) {
  const queryTerms = tokenize(question);
  return state.sources
    .flatMap((source) =>
      source.snippets.map((text) => ({
        sourceId: source.id,
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
