import { MockProvider } from "./providers/MockProvider.js";

export class LLMClient {
  constructor(provider = new MockProvider()) {
    this.provider = provider;
  }

  generate(request) {
    return this.provider.generate(request);
  }
}
