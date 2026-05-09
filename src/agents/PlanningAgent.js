export class PlanningAgent {
  run(state) {
    const sourceTasks = (state.taskItems || []).length
      ? state.taskItems
      : state.todos.map((text, index) => ({
          id: `task-from-todo-${index}`,
          text,
          priority: inferPriority(text),
          status: "todo",
          confidence: 0.62
        }));
    const riskTasks = (state.riskItems || state.risks.map((text) => ({ text, severity: inferSeverity(text) })))
      .slice(0, 4)
      .map((risk, index) => ({
        id: `mitigation-${index}`,
        text: `缓解风险：${risk.text}`,
        priority: risk.severity === "high" ? "high" : "medium",
        status: "todo",
        dependsOn: risk.id || null,
        confidence: risk.confidence || 0.68
      }));
    const tasks = sortTasks(uniqueByText([...sourceTasks, ...riskTasks])).slice(0, 10);
    const actions = tasks.map((task) => task.text);
    const blockers = tasks.filter((task) => task.status === "blocked" || /阻塞|blocked|无法|token|额度/i.test(task.text));

    return {
      priority: blockers.length || state.risks.length ? "focus-risk-first" : "continue-execution",
      actions,
      tasks,
      blockers,
      nextMilestone: buildMilestone(state, tasks),
      rationale: state.risks.length
        ? "检测到开放风险，因此计划会先处理验证、缓解和演示可信度，再继续扩展功能。"
        : "暂未检测到明确风险，因此计划聚焦继续实现、整理文档和补充演示。"
    };
  }
}

function sortTasks(tasks) {
  const weight = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort((a, b) => (weight[a.priority] ?? 1) - (weight[b.priority] ?? 1));
}

function uniqueByText(tasks) {
  const seen = new Set();
  return tasks.filter((task) => {
    const key = task.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildMilestone(state, tasks) {
  if (!state.sources.length) return "导入第一批项目资料";
  if (state.risks.length) return "完成风险验证与可追溯输出";
  if (tasks.length) return "完成下一批高优先级待办";
  return "补充更多资料以形成可执行计划";
}

function inferPriority(text) {
  if (/必须|紧急|优先|关键|urgent|critical|must/i.test(text)) return "high";
  if (/可以|稍后|later|nice/i.test(text)) return "low";
  return "medium";
}

function inferSeverity(text) {
  if (/高|严重|紧急|阻塞|critical|blocked/i.test(text)) return "high";
  if (/低|轻微|minor/i.test(text)) return "low";
  return "medium";
}
