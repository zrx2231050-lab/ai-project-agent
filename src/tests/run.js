import assert from "node:assert/strict";
import { createInitialState, answerQuestion, generateProjectBrief, runAgentPipeline } from "../agentPipeline.js";
import { extractTextFromDocx, readUploadedDocument } from "../ingest/documentReaders.js";
import { ProjectWorkflow } from "../workflows/projectWorkflow.js";

await testWorkflowExtraction();
await testRagGrounding();
await testModelFallback();
await testBriefGeneration();
await testDocxImport();

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

async function testDocxImport() {
  const docx = createStoredZip({
    "[Content_Types].xml": '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
    "word/document.xml":
      '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>目标：导入 Word 文档。</w:t></w:r></w:p><w:p><w:r><w:t>风险：Word 解析可能失败。</w:t></w:r></w:p><w:p><w:r><w:t>待办：验证 DOCX 导入流程。</w:t></w:r></w:p></w:body></w:document>'
  });
  const text = extractTextFromDocx(docx);
  assert.match(text, /导入 Word 文档/);

  const uploaded = readUploadedDocument({
    filename: "project-note.docx",
    contentBase64: docx.toString("base64")
  });
  const result = await runAgentPipeline(createInitialState(), uploaded);
  assert.equal(uploaded.type, "docx");
  assert.equal(result.state.riskItems.length, 1);
  assert.equal(result.state.taskItems.length, 1);
}

function createStoredZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBuffer = Buffer.from(name);
    const data = Buffer.from(content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt32LE(0, 10);
    localHeader.writeUInt32LE(0, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuffer, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt32LE(0, 12);
    centralHeader.writeUInt32LE(0, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localFiles = Buffer.concat(localParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(Object.keys(files).length, 8);
  eocd.writeUInt16LE(Object.keys(files).length, 10);
  eocd.writeUInt32LE(centralDirectory.length, 12);
  eocd.writeUInt32LE(localFiles.length, 16);
  return Buffer.concat([localFiles, centralDirectory, eocd]);
}
