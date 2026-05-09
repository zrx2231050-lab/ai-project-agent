# Model Integration

The project includes a provider boundary for Xiaomi-compatible model access:

- `src/llm/LLMClient.js`
- `src/llm/config.js`
- `src/llm/providers/MockProvider.js`
- `src/llm/providers/XiaomiProvider.js`

By default the app uses local deterministic logic and the mock provider, so it runs without token quota.

## Environment Variables

```bash
XIAOMI_API_KEY=your_token
XIAOMI_BASE_URL=https://api.example.com/v1
XIAOMI_MODEL=model_name
LLM_PROVIDER=xiaomi
LLM_ENABLED=true
LLM_TIMEOUT_MS=30000
```

Set `LLM_ENABLED=false` to force fully local behavior.

## Provider Contract

Agents will call a common interface:

```js
await llm.generateJson({
  systemPrompt,
  userPrompt,
  schema,
  responseFormat: "json"
});
```

The response is normalized to:

```js
{
  provider,
  model,
  text,
  json,
  raw,
  usage,
  latencyMs
}
```

## Xiaomi-Compatible HTTP Shape

`XiaomiProvider` currently targets an OpenAI-style chat completions API:

```http
POST {XIAOMI_BASE_URL}/chat/completions
Authorization: Bearer {XIAOMI_API_KEY}
Content-Type: application/json
```

Request body:

```json
{
  "model": "model_name",
  "temperature": 0.2,
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "response_format": { "type": "json_object" }
}
```

## Current Agent Usage

`ExecutionAgent` now supports optional model enhancement. If `LLM_ENABLED=true`, it asks the configured model for a structured execution recommendation. If the model is unavailable, misconfigured, or returns non-JSON content, the agent records the fallback reason and continues with local rules.

This makes the repository reviewable without quota while showing exactly where free token access will improve the project.
