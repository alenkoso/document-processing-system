# How to Query the API

This document explains how to interact with the chat API endpoint.

## Basic Usage

Send a POST request to `/api/chat` with your question in the prompt field:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Your question here"}'
```

## Example Queries

1. Basic question:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What happens in the Flourish and Blotts scene in Harry Potter?"}'
```

## Response Format

The API returns JSON with the following structure:

```json
{
  "answer": "The AI-generated answer to your question",
  "context": [
    {
      "source": "filename.txt",
      "index": 1
    }
  ]
}
```

- `answer`: The generated response to your question
- `context`: Array of document chunks used to generate the answer
  - `source`: The source document name
  - `index`: The chunk index in the document

## Error Responses

If an error occurs, you'll receive a response with a 500 status code:

```json
{
  "error": "Failed to generate response",
  "details": "Specific error message"
}
```
