# Agent Workflow

The current workflow is:

1. Normalize a source document.
2. Split it into retrievable snippets with heading, line range, token, and source metadata.
3. Run `DocumentParserAgent` to extract structured facts, task items, risk items, entities, and confidence signals.
4. Merge facts into project state.
5. Run `PlanningAgent` to prioritize next actions, detect blockers, and identify the next milestone.
6. Run `ExecutionAgent` to generate a brief, recommendation, and expected deliverables.
7. Run `ReviewAgent` to check grounding against the source and produce a confidence score.
8. Save the resulting `AgentRun` and generated brief.

The workflow is implemented in `src/workflows/projectWorkflow.js`.
