const sample = `Goal: build an AI-driven personal knowledge management and project execution agent.

Current progress:
- Initial scope is defined.
- The prototype should support project notes, repository descriptions, and meeting summaries.

Risks:
- Model token quota is not confirmed yet.
- Users may upload fragmented notes with inconsistent wording.

Todos:
- Create a GitHub repository for the prototype.
- Implement document parsing, planning, execution, and review agents.
- Prepare a concise demo for the application form.

Decision: keep the first version local-first and dependency-light.`;

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
  els.title.value = "Kickoff meeting notes";
  els.content.value = sample;
});

document.querySelector("#ingestButton").addEventListener("click", async () => {
  const result = await postJson("/api/ingest", {
    title: els.title.value || "Untitled source",
    content: els.content.value
  });
  renderState(result.state);
  renderTrace(result.agents);
});

document.querySelector("#askButton").addEventListener("click", async () => {
  const result = await postJson("/api/ask", {
    question: els.question.value || "What should I do next?"
  });
  els.answer.textContent = `${result.answer}\n\nSources:\n${result.sources
    .map((source) => `- ${source.sourceTitle}: ${source.snippet}`)
    .join("\n")}`;
});

document.querySelector("#resetButton").addEventListener("click", async () => {
  const state = await postJson("/api/reset", {});
  renderState(state);
  els.trace.innerHTML = "";
  els.answer.textContent = "Memory reset. Add new material to restart the agent workflow.";
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
    ["Sources", state.sources.length],
    ["Risks", state.risks.length],
    ["Todos", state.todos.length]
  ]
    .map(([label, value]) => `<span><strong>${value}</strong>${label}</span>`)
    .join("");
  renderList(els.goals, state.goals);
  renderList(els.progress, state.progress);
  renderList(els.risks, state.risks);
  renderList(els.todos, state.todos);
}

function renderList(target, items) {
  target.innerHTML = "";
  const values = items.length ? items : ["No explicit item detected yet."];
  for (const item of values.slice(0, 8)) {
    const li = document.createElement("li");
    li.textContent = item;
    target.append(li);
  }
}

function renderTrace(agents) {
  els.trace.innerHTML = Object.entries(agents)
    .map(
      ([name, payload]) => `
        <details open>
          <summary>${name}</summary>
          <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
        </details>
      `
    )
    .join("");
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
