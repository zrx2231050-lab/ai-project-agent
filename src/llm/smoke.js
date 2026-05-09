import { LLMClient } from "./LLMClient.js";
import { XiaomiProvider } from "./providers/XiaomiProvider.js";

const mock = await new LLMClient().generateJson({
  userPrompt: "Return a short JSON summary.",
  responseFormat: "json"
});

console.log("Mock provider:", mock.provider, mock.json ? "json-ok" : "json-missing");

try {
  await new LLMClient(new XiaomiProvider({})).generate({ userPrompt: "hello" });
  throw new Error("Expected XiaomiProvider to fail without configuration.");
} catch (error) {
  if (!String(error.message).includes("Missing")) throw error;
  console.log("Xiaomi provider config guard: ok");
}
