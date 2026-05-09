import { generateProjectBrief } from "../workflows/briefs.js";

export class ExecutionAgent {
  run(state, plan) {
    return {
      summary: [
        `The project has ${state.sources.length} source(s), ${state.goals.length} goal(s), ${state.todos.length} todo(s), and ${state.risks.length} risk item(s).`,
        plan.actions.length
          ? `Recommended next action: ${plan.actions[0]}`
          : "Recommended next action: add more project material to improve the agent memory."
      ].join(" "),
      draft: generateProjectBrief(state)
    };
  }
}
