import { MockProvider } from "./providers/MockProvider.js";
import { XiaomiProvider } from "./providers/XiaomiProvider.js";

export function createLLMProvider(env = process.env) {
  const providerName = String(env.LLM_PROVIDER || "mock").toLowerCase();
  if (providerName === "xiaomi") {
    return new XiaomiProvider({
      apiKey: env.XIAOMI_API_KEY,
      baseUrl: env.XIAOMI_BASE_URL,
      model: env.XIAOMI_MODEL,
      timeoutMs: Number(env.LLM_TIMEOUT_MS || 30000)
    });
  }
  return new MockProvider();
}

export function isLLMEnabled(env = process.env) {
  return String(env.LLM_ENABLED || "false").toLowerCase() === "true";
}
