import { listOrEmpty } from "../utils/text.js";

export function generateProjectBrief(state) {
  return [
    "# Project Brief",
    "",
    "## Goals",
    listOrEmpty(state.goals),
    "",
    "## Current Progress",
    listOrEmpty(state.progress),
    "",
    "## Risks",
    listOrEmpty(formatRisks(state)),
    "",
    "## Next Actions",
    listOrEmpty(formatTasks(state)),
    "",
    "## Decisions",
    listOrEmpty(state.decisions)
  ].join("\n");
}

function formatTasks(state) {
  if (state.taskItems?.length) {
    return state.taskItems.map((task) => `[${task.priority}] ${task.text}`);
  }
  return state.todos;
}

function formatRisks(state) {
  if (state.riskItems?.length) {
    return state.riskItems.map((risk) => `[${risk.severity}] ${risk.text} Mitigation: ${risk.mitigation}`);
  }
  return state.risks;
}
