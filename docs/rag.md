# RAG Design

The current RAG layer is local and deterministic so the project can run without a model token.

## Pipeline

1. `chunker.js` splits source material by headings, paragraphs, and line ranges.
2. `retriever.js` detects question intent and scores snippets with term overlap plus intent boosts.
3. `qa.js` selects structured facts when available, falls back to retrieved evidence, and returns confidence.

Each answer includes:

- detected intent
- answer text
- confidence score
- insufficient evidence flag
- source title
- chunk heading
- line range
- snippet text
- retrieval score

This design can later be upgraded to embeddings and reranking without changing the public API.
