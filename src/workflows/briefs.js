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
    listOrEmpty(state.risks),
    "",
    "## Next Actions",
    listOrEmpty(state.todos),
    "",
    "## Decisions",
    listOrEmpty(state.decisions)
  ].join("\n");
}
