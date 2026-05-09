# Model Integration Plan

The project already includes a provider boundary for future Xiaomi model access:

- `src/llm/LLMClient.js`
- `src/llm/providers/MockProvider.js`
- `src/llm/providers/XiaomiProvider.js`

Planned environment variables:

```bash
XIAOMI_API_KEY=your_token
XIAOMI_BASE_URL=https://api.example.com
XIAOMI_MODEL=model_name
LLM_PROVIDER=xiaomi
```

## Planned Usage

Agents will call a common interface:

```js
llm.generate({
  systemPrompt,
  userPrompt,
  schema
});
```

This keeps the workflow independent from any single model vendor. The next implementation stages can progressively replace local extraction, planning, execution, and review heuristics with structured model calls.
