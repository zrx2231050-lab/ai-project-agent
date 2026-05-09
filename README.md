# AI Project Agent

AI Project Agent is a runnable prototype for an AI-driven personal knowledge management and project execution assistant. It helps users turn scattered documents, code notes, meeting records, and todos into a living project state.

The prototype demonstrates a four-agent workflow:

- **Document Parser Agent** extracts facts, goals, progress, risks, todos, and entities from uploaded material.
- **Planning Agent** converts facts into concrete next actions and prioritizes the project backlog.
- **Execution Agent** drafts project briefs, meeting notes, code-oriented suggestions, and action recommendations.
- **Review Agent** checks whether generated output is grounded in the original source snippets.

It also includes a lightweight retrieval layer for question answering. The current implementation is dependency-free and runs locally, so reviewers can try the full flow without requiring an API key. A future version can replace the heuristic agent functions with Xiaomi/OpenAI-compatible model calls.

## Why This Project

Project context often lives across chat logs, markdown files, source code, issue trackers, meeting notes, and personal todos. Manual整理 is repetitive and error-prone. This agent keeps project memory current by processing each new material, updating structured state, and answering questions with traceable source snippets.

## Features

- Upload or paste project materials from the browser.
- Automatically extract project goals, current progress, risks, todos, decisions, and key entities.
- Update a persistent project state after every new source.
- Ask RAG-style questions and get answers with supporting snippets.
- Run a four-stage agent pipeline with parser, planner, executor, and reviewer outputs.
- Export a generated project brief from the current knowledge base.

## Quick Start

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

Run the command-line demo:

```bash
npm run demo
```

Run a smoke test:

```bash
npm test
```

## API

```http
GET /api/state
POST /api/ingest
POST /api/ask
POST /api/reset
```

Example ingest payload:

```json
{
  "title": "Sprint meeting notes",
  "content": "Goal: ship MVP. Risk: API quota is unknown. Todo: prepare GitHub demo."
}
```

Example ask payload:

```json
{
  "question": "What are the main risks?"
}
```

## Roadmap

- Add Xiaomi model integration for structured extraction and answer generation.
- Support PDFs, Word documents, GitHub repositories, and meeting transcript imports.
- Add embedding-based retrieval and reranking.
- Add a human approval queue for risky actions.
- Add multi-project workspaces and scheduled project health checks.

## License

MIT
