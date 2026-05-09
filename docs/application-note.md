# Application Note

Suggested application description:

> This project is an AI-driven personal knowledge management and project execution Agent. It solves the problem that project documents, code notes, meeting records, risks, and todos are scattered across different places and expensive to organize manually. The Agent ingests project material, extracts goals, progress, risks, decisions, and tasks, updates a persistent project state, and answers questions with RAG citations.

Core architecture:

- Document Parser Agent extracts structured project facts.
- Planning Agent prioritizes tasks and identifies blockers.
- Execution Agent generates project briefs and action recommendations.
- Review Agent checks whether output is grounded in source material.
- RAG layer retrieves source snippets with headings, line ranges, scores, and confidence.

Current implementation:

- Fully runnable without token quota.
- Chinese product workspace for project review.
- Xiaomi-compatible model provider boundary.
- Local fallback when model access is unavailable.

Token usage:

> Free Xiaomi model quota will be used to replace local heuristic extraction with model-based structured parsing, improve task planning quality, generate richer project execution suggestions, and strengthen the Review Agent's grounding and hallucination checks.
