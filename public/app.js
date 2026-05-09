const sample = `目标：构建一个 AI 驱动的个人知识管理与项目执行 Agent。

当前进度：
- 初始范围已经明确。
- 原型需要支持项目笔记、代码仓库说明和会议纪要。

风险：
- 模型 token 免费额度尚未确认。
- 用户上传的资料可能比较碎片化，表述也不完全一致。

待办：
- 创建 GitHub 原型仓库。
- 实现文档解析、规划、执行和审核 Agent。
- 为申请表准备一个简洁的演示项目。

决策：第一版保持本地优先和轻依赖。`;

const els = {
  title: document.querySelector("#titleInput"),
  content: document.querySelector("#contentInput"),
  question: document.querySelector("#questionInput"),
  answer: document.querySelector("#answerBox"),
  trace: document.querySelector("#agentTrace"),
  metrics: document.querySelector("#metrics"),
  goals: document.querySelector("#goalsList"),
  progress: document.querySelector("#progressList"),
  risks: document.querySelector("#risksList"),
  todos: document.querySelector("#todosList")
};

document.querySelector("#sampleButton").addEventListener("click", () => {
  els.title.value = "项目启动会议记录";
  els.content.value = sample;
});

document.querySelector("#ingestButton").addEventListener("click", async () => {
  const result = await postJson("/api/ingest", {
    title: els.title.value || "未命名资料",
    content: els.content.value
  });
  renderState(result.state);
  renderTrace(result.agents);
});

document.querySelector("#askButton").addEventListener("click", async () => {
  const result = await postJson("/api/ask", {
    question: els.question.value || "下一步应该做什么？"
  });
  els.answer.textContent = `${result.answer}\n\n引用来源：\n${result.sources
    .map((source) => `- ${source.sourceTitle}：${source.snippet}`)
    .join("\n")}`;
});

document.querySelector("#resetButton").addEventListener("click", async () => {
  const state = await postJson("/api/reset", {});
  renderState(state);
  els.trace.innerHTML = "";
  els.answer.textContent = "记忆已重置。请添加新资料以重新运行 Agent 工作流。";
});

loadState();

async function loadState() {
  const response = await fetch("/api/state");
  renderState(await response.json());
}

async function postJson(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

function renderState(state) {
  els.metrics.innerHTML = [
    ["资料", state.sources.length],
    ["风险", state.risks.length],
    ["待办", state.todos.length]
  ]
    .map(([label, value]) => `<span><strong>${value}</strong>${label}</span>`)
    .join("");
  renderList(els.goals, state.goals);
  renderList(els.progress, state.progress);
  renderRiskList(els.risks, state);
  renderTaskList(els.todos, state);
}

function renderList(target, items) {
  target.innerHTML = "";
  const values = items.length ? items : ["暂未识别到明确内容。"];
  for (const item of values.slice(0, 8)) {
    const li = document.createElement("li");
    li.textContent = item;
    target.append(li);
  }
}

function renderTaskList(target, state) {
  target.innerHTML = "";
  const tasks = state.taskItems?.length
    ? state.taskItems.map((task) => `${priorityLabel(task.priority)} ${task.text}`)
    : state.todos;
  renderList(target, tasks);
}

function renderRiskList(target, state) {
  target.innerHTML = "";
  const risks = state.riskItems?.length
    ? state.riskItems.map((risk) => `${severityLabel(risk.severity)} ${risk.text}；缓解：${risk.mitigation}`)
    : state.risks;
  renderList(target, risks);
}

function renderTrace(agents) {
  const labels = {
    parser: "文档解析 Agent",
    planner: "规划 Agent",
    executor: "执行 Agent",
    reviewer: "审核 Agent"
  };
  els.trace.innerHTML = Object.entries(agents)
    .map(
      ([name, payload]) => `
        <details open>
          <summary>${labels[name] || name}</summary>
          <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
        </details>
      `
    )
    .join("");
}

function priorityLabel(priority) {
  return {
    high: "高优先级：",
    medium: "中优先级：",
    low: "低优先级："
  }[priority] || "";
}

function severityLabel(severity) {
  return {
    high: "高风险：",
    medium: "中风险：",
    low: "低风险："
  }[severity] || "";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}
