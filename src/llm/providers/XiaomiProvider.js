export class XiaomiProvider {
  constructor({
    apiKey = process.env.XIAOMI_API_KEY,
    baseUrl = process.env.XIAOMI_BASE_URL,
    model = process.env.XIAOMI_MODEL
  } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate() {
    throw new Error(
      "XiaomiProvider is a planned integration point. Configure XIAOMI_API_KEY, XIAOMI_BASE_URL, and XIAOMI_MODEL after token access is approved."
    );
  }
}
