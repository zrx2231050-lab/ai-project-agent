import { readFile } from "node:fs/promises";
import { createInitialState, answerQuestion, runAgentPipeline } from "./agentPipeline.js";

const meeting = await readFile(new URL("../examples/meeting-notes.md", import.meta.url), "utf8");
const repo = await readFile(new URL("../examples/code-repo-note.md", import.meta.url), "utf8");

let state = createInitialState();
let result = runAgentPipeline(state, { title: "Meeting notes", content: meeting });
state = result.state;
result = runAgentPipeline(state, { title: "Repository note", content: repo });
state = result.state;

const answer = answerQuestion(state, "What are the main risks and next todos?");

console.log("Agent summary:");
console.log(result.agents.executor.summary);
console.log("");
console.log("Answer:");
console.log(answer.answer);

if (process.argv.includes("--assert")) {
  const ok = state.sources.length === 2 && state.risks.length > 0 && state.todos.length > 0 && answer.sources.length > 0;
  if (!ok) {
    throw new Error("Smoke test failed: expected populated state and grounded answer.");
  }
}
