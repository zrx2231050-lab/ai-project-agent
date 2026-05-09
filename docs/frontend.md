# Frontend Workspace

The web app is a lightweight product workspace built with static HTML, CSS, and browser JavaScript.

## Views

- Dashboard: project goals, progress, next actions, risks, and recent agent runs.
- Documents: paste source material, run the agent workflow, and inspect ingested sources.
- Tasks: review structured task items, priority, status, and source.
- Risks: review risk severity and mitigation suggestions.
- Q&A: ask grounded questions and inspect cited evidence.
- Briefs: generate a Markdown project brief from current state.
- Agent Runs: inspect the latest agent trace or previous workflow runs.

The UI intentionally stays dependency-free so reviewers can run it with `npm start` and no build step.
