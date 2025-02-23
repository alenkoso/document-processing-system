## Prerequisites
- Docker and Docker Compose
- Node.js v20+ (for local development)
- pnpm (for local development)

## Docker Setup (Recommended)
1. Create `.env` file:
```env
OPENAI_API_KEY=<your_key_here>
```
2. Add any additional documents to `src/documents/` (*.txt files)

3. Run:
```bash
docker-compose up --build
```

4. Open your browser and navigate to `http://localhost:3000`

-------------------------------------------------------------------------------------

## Local Development
1. Install dependencies:
```bash
pnpm install
```

2. Create `.env` file (same as above)

3. Run:
```bash
pnpm run dev
```


## Troubleshooting
- Check Docker logs: `docker-compose logs app`
- Verify documents in `src/documents/`
- Ensure OPENAI_API_KEY is set correctly



-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------

# How to Query the API

This document explains how to interact with the chat API endpoint.

## Basic Usage

Send a POST request to `/api/chat` with your question in the prompt field:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Your question here"}' | jq
```

## Example Queries

1. Basic question:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What happens in the Flourish and Blotts scene in Harry Potter?"}' | jq
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
