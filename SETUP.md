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