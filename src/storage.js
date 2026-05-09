import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInitialState } from "./agentPipeline.js";

const STATE_FILE = fileURLToPath(new URL("../data/state.json", import.meta.url));

export async function loadState() {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return createInitialState();
  }
}

export async function saveState(state) {
  await mkdir(dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

export async function resetState() {
  const state = createInitialState();
  await saveState(state);
  return state;
}
