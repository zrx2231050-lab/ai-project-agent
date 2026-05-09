# Roadmap

## Completed

- Local-first multi-agent workflow.
- Document parsing, planning, execution, and review agents.
- Structured facts, tasks, risks, decisions, and agent runs.
- RAG chunking, retrieval, intent detection, citations, and answer confidence.
- Chinese product workspace with dashboard, documents, tasks, risks, Q&A, briefs, and agent run views.
- Configurable LLM provider boundary with Xiaomi-compatible HTTP provider and local fallback.
- Focused smoke tests for workflow, RAG, model fallback, and brief generation.

## Next

- Replace heuristic extraction with model-generated structured JSON.
- Add embedding retrieval and reranking after token access is available.
- Support PDF, Word, meeting transcript, and repository imports.
- Add multi-project workspaces and scheduled project health checks.
- Add a human approval queue for high-risk generated actions.

## Token Usage Plan

Free model quota will be used for:

- Higher quality document parsing and fact extraction.
- Multi-step task planning with clearer priorities and dependencies.
- Execution drafts such as project briefs, meeting minutes, and action plans.
- Review Agent checks for grounding, unsupported claims, and hallucination risk.
