import { cleanLine, tokenize } from "../utils/text.js";

export function buildSourceSnippets(content, { sourceId = "source", maxSnippets = 200 } = {}) {
  const lines = String(content || "").split(/\r?\n/);
  const snippets = [];
  let heading = "正文";
  let buffer = [];
  let startLine = 1;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$|^(.+)[：:]$/);

    if (headingMatch && buffer.length) {
      snippets.push(toSnippet(sourceId, snippets.length, heading, buffer, startLine));
      buffer = [];
      startLine = lineIndex + 1;
    }

    if (headingMatch) {
      heading = cleanLine(headingMatch[2] || headingMatch[3] || trimmed);
      startLine = lineIndex + 1;
      return;
    }

    if (!trimmed) {
      if (buffer.length) {
        snippets.push(toSnippet(sourceId, snippets.length, heading, buffer, startLine));
        buffer = [];
      }
      startLine = lineIndex + 2;
      return;
    }

    buffer.push(trimmed);
  });

  if (buffer.length) {
    snippets.push(toSnippet(sourceId, snippets.length, heading, buffer, startLine));
  }

  return splitLongSnippets(snippets).slice(0, maxSnippets);
}

export function splitIntoSnippets(content) {
  return buildSourceSnippets(content).map((snippet) => snippet.text);
}

function toSnippet(sourceId, index, heading, lines, startLine) {
  const text = lines.map(cleanLine).filter(Boolean).join("\n");
  return {
    id: `${sourceId}-chunk-${index}`,
    index,
    heading,
    text,
    startLine,
    endLine: startLine + lines.length - 1,
    tokens: tokenize(text)
  };
}

function splitLongSnippets(snippets) {
  return snippets.flatMap((snippet) => {
    if (snippet.text.length <= 700) return snippet;
    const sentences = snippet.text.split(/(?<=[.!?。！？；;])\s*/).filter(Boolean);
    const chunks = [];
    let current = [];

    sentences.forEach((sentence) => {
      if (current.join("").length + sentence.length > 700 && current.length) {
        chunks.push(current.join(""));
        current = [];
      }
      current.push(sentence);
    });
    if (current.length) chunks.push(current.join(""));

    return chunks.map((text, offset) => ({
      ...snippet,
      id: `${snippet.id}-${offset}`,
      index: snippet.index + offset / 100,
      text,
      tokens: tokenize(text)
    }));
  });
}
