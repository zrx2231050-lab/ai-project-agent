import { generateProjectBrief } from "../workflows/briefs.js";

export class ExecutionAgent {
  run(state, plan) {
    const topRisk = (state.riskItems || [])[0]?.text || state.risks[0] || "暂无明确风险";
    const topTask = plan.tasks?.[0]?.text || plan.actions[0] || "继续补充项目资料";

    return {
      summary: [
        `当前项目已汇总 ${state.sources.length} 份资料、${state.goals.length} 个目标、${state.todos.length} 个待办和 ${state.risks.length} 个风险。`,
        `建议优先处理：${topTask}。`
      ].join(" "),
      recommendation: {
        nextAction: topTask,
        topRisk,
        suggestedOutput: plan.priority === "focus-risk-first" ? "风险缓解清单" : "项目执行简报"
      },
      deliverables: buildDeliverables(state, plan),
      draft: generateProjectBrief(state)
    };
  }
}

function buildDeliverables(state, plan) {
  return [
    {
      type: "project-brief",
      title: "项目简报",
      description: "汇总目标、进度、风险和下一步行动，适合用于申请表或项目汇报。"
    },
    {
      type: "action-plan",
      title: "行动计划",
      description: `围绕里程碑“${plan.nextMilestone}”推进 ${plan.tasks?.length || plan.actions.length} 个任务。`
    },
    {
      type: "review-report",
      title: "一致性审核报告",
      description: state.risks.length
        ? "重点检查风险项和建议是否能在原始资料中找到依据。"
        : "检查生成内容是否存在无来源断言。"
    }
  ];
}
