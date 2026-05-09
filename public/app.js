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

const viewMeta = {
  dashboard: ["Dashboard", "项目总览"],
  documents: ["Documents", "资料管理"],
  tasks: ["Tasks", "任务看板"],
  risks: ["Risks", "风险中心"],
  qa: ["Q&A", "项目问答"],
  briefs: ["Briefs", "项目简报"],
  runs: ["Agent Runs", "运行轨迹"]
};

let currentView = "dashboard";
let appState = null;
let lastAgents = null;
let lastAnswer = null;
let latestBrief = "";

const els = {
  metrics: document.querySelector("#metrics"),
  viewRoot: document.querySelector("#viewRoot"),
  viewEyebrow: document.querySelector("#viewEyebrow"),
  viewTitle: document.querySelector("#viewTitle")
};

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    document.querySelectorAll(".nav-button").forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

els.viewRoot.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  if (action === "load-sample") {
    document.querySelector("#titleInput").value = "项目启动会议记录";
    document.querySelector("#contentInput").value = sample;
  }

  if (action === "ingest") {
    const result = await postJson("/api/ingest", {
      title: document.querySelector("#titleInput").value || "未命名资料",
      content: document.querySelector("#contentInput").value
    });
    appState = result.state;
    lastAgents = result.agents;
    currentView = "dashboard";
    setActiveNav();
    render();
  }

  if (action === "reset") {
    appState = await postJson("/api/reset", {});
    lastAgents = null;
    lastAnswer = null;
    latestBrief = "";
    render();
  }

  if (action === "ask") {
    lastAnswer = await postJson("/api/ask", {
      question: document.querySelector("#questionInput").value || "下一步应该做什么？"
    });
    renderQaView();
  }

  if (action === "brief") {
    latestBrief = await fetch("/api/brief").then((response) => response.text());
    renderBriefsView();
  }
});

await loadState();

async function loadState() {
  const response = await fetch("/api/state");
  appState = await response.json();
  render();
}

async function postJson(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function render() {
  const [eyebrow, title] = viewMeta[currentView];
  els.viewEyebrow.textContent = eyebrow;
  els.viewTitle.textContent = title;
  renderMetrics();

  const renderers = {
    dashboard: renderDashboardView,
    documents: renderDocumentsView,
    tasks: renderTasksView,
    risks: renderRisksView,
    qa: renderQaView,
    briefs: renderBriefsView,
    runs: renderRunsView
  };
  renderers[currentView]();
}

function renderMetrics() {
  const state = appState || {};
  els.metrics.innerHTML = [
    ["资料", state.sources?.length || 0],
    ["任务", state.taskItems?.length || state.todos?.length || 0],
    ["风险", state.riskItems?.length || state.risks?.length || 0],
    ["运行", state.agentRuns?.length || 0]
  ]
    .map(([label, value]) => `<span><strong>${value}</strong>${label}</span>`)
    .join("");
}

function renderDashboardView() {
  els.viewRoot.innerHTML = `
    <section class="summary-grid">
      ${summaryCard("目标", listPreview(appState.goals))}
      ${summaryCard("当前进度", listPreview(appState.progress))}
      ${summaryCard("下一步", listPreview(taskLabels().slice(0, 3)))}
      ${summaryCard("主要风险", listPreview(riskLabels().slice(0, 3)))}
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>最近 Agent 运行</h3>
          <p>查看最近一次资料导入后的解析、规划、执行和审核结果。</p>
        </div>
        <button type="button" class="ghost" data-action="reset">重置记忆</button>
      </div>
      ${renderRunTimeline((appState.agentRuns || []).slice(0, 3))}
    </section>
  `;
}

function renderDocumentsView() {
  els.viewRoot.innerHTML = `
    <section class="panel composer">
      <div class="panel-header">
        <div>
          <h3>添加项目资料</h3>
          <p>粘贴会议记录、代码说明、需求文档或待办事项，运行后会更新项目状态。</p>
        </div>
        <button type="button" data-action="load-sample">载入示例</button>
      </div>
      <input id="titleInput" placeholder="资料标题" />
      <textarea id="contentInput" rows="10" placeholder="目标：完成 MVP&#10;风险：模型 token 额度尚未确认&#10;待办：准备 GitHub 演示项目"></textarea>
      <div class="actions">
        <button type="button" data-action="ingest">运行 Agent</button>
        <button type="button" class="ghost" data-action="reset">重置记忆</button>
      </div>
    </section>
    <section class="list-section">
      ${(appState.sources || []).map(renderSourceItem).join("") || emptyState("还没有资料，请先添加项目材料。")}
    </section>
  `;
}

function renderTasksView() {
  const tasks = appState.taskItems?.length
    ? appState.taskItems
    : (appState.todos || []).map((text, index) => ({ id: `todo-${index}`, text, priority: "medium", status: "todo" }));
  els.viewRoot.innerHTML = `
    <section class="table panel">
      <div class="table-row table-head">
        <span>任务</span><span>优先级</span><span>状态</span><span>来源</span>
      </div>
      ${tasks.map(renderTaskRow).join("") || emptyState("还没有识别到待办任务。")}
    </section>
  `;
}

function renderRisksView() {
  const risks = appState.riskItems?.length
    ? appState.riskItems
    : (appState.risks || []).map((text, index) => ({ id: `risk-${index}`, text, severity: "medium", mitigation: "补充资料后生成缓解建议。" }));
  els.viewRoot.innerHTML = `
    <section class="risk-grid">
      ${risks.map(renderRiskItem).join("") || emptyState("还没有识别到风险。")}
    </section>
  `;
}

function renderQaView() {
  els.viewRoot.innerHTML = `
    <section class="qa-layout">
      <div class="panel qa-box">
        <h3>询问项目知识库</h3>
        <textarea id="questionInput" rows="4" placeholder="目前最大的风险是什么？"></textarea>
        <button type="button" data-action="ask">提问</button>
        <pre>${escapeHtml(lastAnswer?.answer || "请先上传资料或载入示例，然后向项目知识库提问。")}</pre>
        ${lastAnswer ? `<p class="confidence">置信度：${Math.round(lastAnswer.confidence * 100)}%</p>` : ""}
      </div>
      <div class="sources">
        ${(lastAnswer?.sources || []).map(renderAnswerSource).join("") || emptyState("暂无引用来源。")}
      </div>
    </section>
  `;
}

function renderBriefsView() {
  els.viewRoot.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>项目简报</h3>
          <p>根据当前知识库生成项目目标、进度、风险、行动和决策摘要。</p>
        </div>
        <button type="button" data-action="brief">生成简报</button>
      </div>
      <pre>${escapeHtml(latestBrief || "点击生成简报，查看当前项目状态的 Markdown 输出。")}</pre>
    </section>
  `;
}

function renderRunsView() {
  els.viewRoot.innerHTML = `
    <section class="panel">
      <h3>最近运行轨迹</h3>
      ${lastAgents ? renderAgentTrace(lastAgents) : renderRunTimeline(appState.agentRuns || [])}
    </section>
  `;
}

function renderSourceItem(source) {
  return `
    <article class="panel list-item">
      <div>
        <h3>${escapeHtml(source.title)}</h3>
        <p>${source.snippets?.length || 0} 个检索片段 · ${formatDate(source.createdAt)}</p>
      </div>
      <span class="pill">${escapeHtml(source.type || "text")}</span>
    </article>
  `;
}

function renderTaskRow(task) {
  return `
    <div class="table-row">
      <span>${escapeHtml(task.text)}</span>
      <span>${priorityLabel(task.priority)}</span>
      <span>${statusLabel(task.status)}</span>
      <span>${sourceTitle(task.sourceId)}</span>
    </div>
  `;
}

function renderRiskItem(risk) {
  return `
    <article class="panel risk-item">
      <div class="item-title">
        <h3>${severityLabel(risk.severity)}</h3>
        <span class="pill">${sourceTitle(risk.sourceId)}</span>
      </div>
      <p>${escapeHtml(risk.text)}</p>
      <strong>缓解建议</strong>
      <p>${escapeHtml(risk.mitigation)}</p>
    </article>
  `;
}

function renderAnswerSource(source) {
  return `
    <article class="source-item">
      <strong>${escapeHtml(source.sourceTitle)}</strong>
      <span>${escapeHtml(source.heading || "正文")} ${formatLines(source)} · 评分 ${source.score}</span>
      <p>${escapeHtml(source.snippet)}</p>
    </article>
  `;
}

function renderAgentTrace(agents) {
  const labels = {
    parser: "文档解析 Agent",
    planner: "规划 Agent",
    executor: "执行 Agent",
    reviewer: "审核 Agent"
  };
  return `<div class="trace">${Object.entries(agents)
    .map(
      ([name, payload]) => `
        <details open>
          <summary>${labels[name] || name}</summary>
          <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
        </details>
      `
    )
    .join("")}</div>`;
}

function renderRunTimeline(runs) {
  if (!runs.length) return emptyState("还没有 Agent 运行记录。");
  return `<div class="timeline">${runs
    .map(
      (run) => `
        <article class="timeline-item">
          <strong>${formatDate(run.createdAt)}</strong>
          <span>${sourceTitle(run.sourceId)} · ${run.reviewer?.status || "unknown"}</span>
          <p>${escapeHtml(run.executor?.summary || "暂无摘要")}</p>
        </article>
      `
    )
    .join("")}</div>`;
}

function summaryCard(title, body) {
  return `
    <article class="panel summary-card">
      <h3>${title}</h3>
      ${body}
    </article>
  `;
}

function listPreview(items) {
  const values = items?.length ? items : ["暂未识别到明确内容。"];
  return `<ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function taskLabels() {
  return appState.taskItems?.length
    ? appState.taskItems.map((task) => `${priorityLabel(task.priority)} ${task.text}`)
    : appState.todos || [];
}

function riskLabels() {
  return appState.riskItems?.length
    ? appState.riskItems.map((risk) => `${severityLabel(risk.severity)} ${risk.text}`)
    : appState.risks || [];
}

function emptyState(text) {
  return `<p class="empty">${text}</p>`;
}

function sourceTitle(sourceId) {
  return appState.sources?.find((source) => source.id === sourceId)?.title || "当前资料";
}

function priorityLabel(priority) {
  return { high: "高", medium: "中", low: "低" }[priority] || "中";
}

function severityLabel(severity) {
  return { high: "高风险", medium: "中风险", low: "低风险" }[severity] || "中风险";
}

function statusLabel(status) {
  return { todo: "未开始", doing: "进行中", done: "已完成", blocked: "阻塞" }[status] || "未开始";
}

function formatLines(source) {
  if (!source.startLine) return "";
  return `第 ${source.startLine}-${source.endLine} 行`;
}

function formatDate(value) {
  if (!value) return "未知时间";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function setActiveNav() {
  document.querySelectorAll(".nav-button").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === currentView);
  });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}
