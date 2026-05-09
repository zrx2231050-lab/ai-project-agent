export class MockProvider {
  constructor() {
    this.name = "mock";
    this.model = "local-heuristic";
  }

  async generate({ userPrompt, responseFormat }) {
    const text =
      responseFormat === "json"
        ? JSON.stringify({ summary: "Mock structured response", confidence: 0.5 })
        : `Mock model response for: ${String(userPrompt || "").slice(0, 120)}`;
    return {
      provider: "mock",
      model: this.model,
      text,
      json: responseFormat === "json" ? { summary: "Mock structured response", confidence: 0.5 } : null,
      usage: { inputTokens: 0, outputTokens: 0 },
      raw: null
    };
  }
}
