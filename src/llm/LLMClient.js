import { createLLMProvider } from "./config.js";

export class LLMClient {
  constructor(provider = createLLMProvider()) {
    this.provider = provider;
  }

  async generate(request) {
    const startedAt = Date.now();
    const result = await this.provider.generate(request);
    return {
      provider: result.provider || this.provider.name || "unknown",
      model: result.model || this.provider.model || null,
      text: result.text || "",
      json: result.json || null,
      raw: result.raw || null,
      usage: result.usage || null,
      latencyMs: Date.now() - startedAt
    };
  }

  async generateJson(request) {
    const result = await this.generate({
      ...request,
      responseFormat: "json"
    });
    if (result.json) return result;

    try {
      result.json = JSON.parse(extractJson(result.text));
      return result;
    } catch {
      return {
        ...result,
        json: null,
        parseError: "Model response was not valid JSON."
      };
    }
  }
}

function extractJson(text) {
  const value = String(text || "").trim();
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const objectStart = value.indexOf("{");
  const objectEnd = value.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return value.slice(objectStart, objectEnd + 1);
  }
  return value;
}
