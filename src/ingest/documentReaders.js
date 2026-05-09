import { inflateRawSync } from "node:zlib";

const DOCX_DOCUMENT_PATH = "word/document.xml";

export function readUploadedDocument({ filename, contentBase64 }) {
  const name = String(filename || "uploaded-file").trim();
  const buffer = Buffer.from(String(contentBase64 || ""), "base64");
  if (!buffer.length) {
    throw new Error("Uploaded file is empty.");
  }

  if (/\.docx$/i.test(name)) {
    return {
      title: name.replace(/\.docx$/i, ""),
      type: "docx",
      content: extractTextFromDocx(buffer)
    };
  }

  if (/\.(md|markdown|txt)$/i.test(name)) {
    return {
      title: name.replace(/\.(md|markdown|txt)$/i, ""),
      type: /\.md|\.markdown/i.test(name) ? "markdown" : "text",
      content: buffer.toString("utf8")
    };
  }

  throw new Error("Unsupported file type. Please upload .docx, .md, or .txt files.");
}

export function extractTextFromDocx(buffer) {
  const entries = readZipEntries(buffer);
  const documentXml = entries.get(DOCX_DOCUMENT_PATH);
  if (!documentXml) {
    throw new Error("Invalid DOCX file: word/document.xml was not found.");
  }
  return xmlToText(documentXml.toString("utf8"));
}

function readZipEntries(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const end = centralDirectoryOffset + centralDirectorySize;
  const entries = new Map();
  let offset = centralDirectoryOffset;

  while (offset < end) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Invalid DOCX file: central directory is malformed.");
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.toString("utf8", offset + 46, offset + 46 + fileNameLength);
    const data = readLocalFile(buffer, localHeaderOffset, compressedSize, compressionMethod);
    entries.set(fileName, data);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function readLocalFile(buffer, offset, compressedSize, compressionMethod) {
  if (buffer.readUInt32LE(offset) !== 0x04034b50) {
    throw new Error("Invalid DOCX file: local file header is malformed.");
  }
  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

  if (compressionMethod === 0) return compressed;
  if (compressionMethod === 8) return inflateRawSync(compressed);
  throw new Error(`Unsupported DOCX compression method: ${compressionMethod}`);
}

function findEndOfCentralDirectory(buffer) {
  const minOffset = Math.max(0, buffer.length - 0xffff - 22);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }
  throw new Error("Invalid DOCX file: end of central directory was not found.");
}

function xmlToText(xml) {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}
