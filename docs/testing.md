# Testing

The project intentionally uses Node.js built-in assertions and no external test framework.

Run all checks:

```bash
npm test
```

The test command covers:

- CLI demo workflow.
- Mock LLM provider JSON response.
- Xiaomi provider configuration guard.
- Chinese workflow extraction.
- RAG intent, citations, and confidence.
- Model fallback behavior.
- Project brief generation.
- Word `.docx` extraction and ingest workflow.

The app can be started with:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```
