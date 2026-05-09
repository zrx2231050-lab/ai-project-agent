export class MockProvider {
  async generate({ userPrompt }) {
    return {
      provider: "mock",
      text: `Mock model response for: ${String(userPrompt || "").slice(0, 120)}`,
      raw: null
    };
  }
}
