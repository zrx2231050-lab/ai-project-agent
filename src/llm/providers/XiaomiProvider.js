export class XiaomiProvider {
  constructor({
    apiKey = process.env.XIAOMI_API_KEY,
    baseUrl = process.env.XIAOMI_BASE_URL,
    model = process.env.XIAOMI_MODEL,
    timeoutMs = 30000
  } = {}) {
    this.name = "xiaomi";
    this.apiKey = apiKey;
    this.baseUrl = baseUrl?.replace(/\/$/, "");
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async generate({ systemPrompt, userPrompt, temperature = 0.2, responseFormat }) {
    this.assertConfigured();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          temperature,
          messages: [
            { role: "system", content: systemPrompt || "You are a precise project assistant." },
            { role: "user", content: userPrompt || "" }
          ],
          ...(responseFormat === "json" ? { response_format: { type: "json_object" } } : {})
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Xiaomi model request failed: ${response.status} ${detail}`);
      }

      const raw = await response.json();
      const text = raw.choices?.[0]?.message?.content || "";
      return {
        provider: "xiaomi",
        model: this.model,
        text,
        json: responseFormat === "json" ? tryParseJson(text) : null,
        usage: raw.usage || null,
        raw
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  assertConfigured() {
    const missing = [
      ["XIAOMI_API_KEY", this.apiKey],
      ["XIAOMI_BASE_URL", this.baseUrl],
      ["XIAOMI_MODEL", this.model]
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length) {
      throw new Error(`XiaomiProvider is not configured. Missing: ${missing.join(", ")}`);
    }
  }
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
