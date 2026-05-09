import { uniqueList } from "../utils/text.js";

export class PlanningAgent {
  run(state) {
    const riskDrivenTodos = state.risks.slice(0, 3).map((risk) => `Mitigate risk: ${risk}`);
    const sourceDrivenTodos = state.todos.slice(0, 5);
    const actions = uniqueList([...sourceDrivenTodos, ...riskDrivenTodos]).slice(0, 8);

    return {
      priority: state.risks.length ? "focus-risk-first" : "continue-execution",
      actions,
      rationale: state.risks.length
        ? "Open risks exist, so the next plan prioritizes validation and mitigation before expansion."
        : "No explicit risk was detected, so the plan continues implementation and documentation."
    };
  }
}
