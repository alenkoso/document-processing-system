import express from "express";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { config } from './config';
import { logger } from './utils/logger';
import { DocumentProcessor } from './documentProcessor';
import { apiLimiter } from './middleware/rateLimit';
import path from 'path';
import { monitorRequest } from "./middleware/monitoring";

const app = express();
const port = config.PORT;

app.use(express.json());
app.use('/api', apiLimiter);

// Add monitoring middleware
app.use(monitorRequest);

// Add memory usage monitoring
setInterval(() => {
  const used = process.memoryUsage();
  logger.info('Memory usage', {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(used.external / 1024 / 1024)}MB`
  });
}, 30000);

app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (_, res) => {
	const healthInfo = {
		status: 'ok',
		timestamp: new Date().toISOString(),
		version: process.env.npm_package_version,
		uptime: process.uptime(),
		memory: process.memoryUsage(),
		documents: {
			count: documentProcessor.getDocumentCount(),
			chunks: documentProcessor.getChunkCount()
		}
	};
	res.json(healthInfo);
});

const openai = createOpenAI({
	apiKey: config.OPENAI_API_KEY,
});

const documentProcessor = new DocumentProcessor();

// Load documents when server starts
(async () => {
	try {
		logger.info('Loading documents from:', { path: config.DOCUMENTS_PATH });
		await documentProcessor.loadDocumentsFromDirectory(config.DOCUMENTS_PATH);
		logger.info('Documents loaded successfully');
	} catch (error) {
		logger.error('Failed to load documents:', {
			error: error instanceof Error ? error.message : String(error)
		});
	}
})();

app.post("/api/chat", async (req, res) => {
	try {
		const { prompt } = req.body;
		const relevantChunks = documentProcessor.findRelevantChunks(prompt);
		
		const contextualPrompt = `
			Based on the following context:
			${relevantChunks.map(chunk => chunk.content).join('\n\n')}
			
			Please answer this question: ${prompt}
		`;

		const result = await generateText({
			model: openai("gpt-4o-mini"),
			prompt: contextualPrompt,
			maxTokens: 500,
		});

		res.json({
			answer: result.text,
			context: relevantChunks.map(chunk => ({
				source: chunk.source,
				index: chunk.index
			}))
		});
	} catch (error) {
		logger.error('Chat API error:', {
			error: error instanceof Error ? error.message : String(error)
		});
		
		res.status(500).json({ 
			error: 'Failed to generate response',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
});

// Root route
app.get('/', (_, res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

const server = app.listen(port, () => {
	logger.info(`Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	logger.info('SIGTERM received. Starting graceful shutdown');
	server.close(() => {
		logger.info('Server closed');
		process.exit(0);
	});
});
