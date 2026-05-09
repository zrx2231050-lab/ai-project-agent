import assert from "node:assert/strict";
import { createInitialState, answerQuestion, generateProjectBrief, runAgentPipeline } from "../agentPipeline.js";
import { ProjectWorkflow } from "../workflows/projectWorkflow.js";

await testWorkflowExtraction();
await testRagGrounding();
await testModelFallback();
await testBriefGeneration();

console.log("All focused tests passed.");

async function testWorkflowExtraction() {
  const result = await runAgentPipeline(createInitialState(), {
    title: "中文测试资料",
    content: [
      "# 项目启动",
      "目标：构建 AI 项目执行 Agent。",
      "",
      "## 风险",
      "风险：模型 token 额度尚未确认。",
      "",
      "## 待办",
      "待办：准备 GitHub 演示项目。"
    ].join("\n")
  });

  assert.equal(result.state.sources.length, 1);
  assert.equal(result.state.taskItems.length, 1);
  assert.equal(result.state.riskItems.length, 1);
  assert.equal(result.state.sources[0].snippets[0].heading, "项目启动");
}

async function testRagGrounding() {
  const result = await runAgentPipeline(createInitialState(), {
    title: "风险资料",
    content: "风险：生成内容必须引用来源片段。\n待办：实现 RAG 问答。"
  });
  const answer = answerQuestion(result.state, "目前有什么风险？");
  assert.equal(answer.intent, "risk");
  assert.ok(answer.confidence > 0);
  assert.ok(answer.sources[0].sourceTitle);
}

async function testModelFallback() {
  const failingLlm = {
    provider: { name: "test-provider" },
    async generateJson() {
      throw new Error("simulated provider failure");
    }
  };
  const workflow = new ProjectWorkflow({ llm: failingLlm, enableLLM: true });
  const result = await workflow.ingest(createInitialState(), {
    title: "fallback",
    content: "目标：验证模型回退。\n待办：保持本地可运行。"
  });
  assert.equal(result.agents.executor.model.fallback, true);
  assert.match(result.agents.executor.model.reason, /simulated provider failure/);
}

async function testBriefGeneration() {
  const result = await runAgentPipeline(createInitialState(), {
    title: "brief",
    content: "目标：生成项目简报。\n当前进度：已完成工作台。"
  });
  const brief = generateProjectBrief(result.state);
  assert.match(brief, /Project Brief/);
  assert.match(brief, /Goals/);
}
