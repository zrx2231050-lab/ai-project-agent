# Document Import

The workspace supports three file import types:

- `.docx`
- `.md`
- `.txt`

Word `.docx` files are parsed locally without external dependencies. The backend reads the DOCX zip structure, extracts `word/document.xml`, converts Word paragraphs into plain text, and sends that text through the existing multi-agent workflow.

## API

```http
POST /api/ingest-file
```

Payload:

```json
{
  "filename": "project-note.docx",
  "contentBase64": "base64-encoded-file"
}
```

Response includes the normal agent result plus file metadata:

```json
{
  "file": {
    "filename": "project-note.docx",
    "type": "docx",
    "extractedCharacters": 1200
  }
}
```

## Notes

- Legacy `.doc` files are not supported.
- Embedded images, comments, and tracked changes are not extracted yet.
- This local parser is intended for reviewable MVP behavior; a production version can later use a stronger document parsing library.
