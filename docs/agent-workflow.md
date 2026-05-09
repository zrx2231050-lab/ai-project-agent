# Agent Workflow

The current workflow is:

1. Normalize a source document.
2. Split it into retrievable snippets.
3. Run `DocumentParserAgent` to extract structured facts.
4. Merge facts into project state.
5. Run `PlanningAgent` to prioritize next actions.
6. Run `ExecutionAgent` to generate a brief and recommendation.
7. Run `ReviewAgent` to check grounding against the source.
8. Save the resulting `AgentRun` and generated brief.

The workflow is implemented in `src/workflows/projectWorkflow.js`.
