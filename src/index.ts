import express from "express";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import dotenv from "dotenv";
import { DocumentProcessor } from './documentProcessor';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Adding this due to docker compose not being able to find the documents folder
const DOCUMENTS_PATH = process.env.DOCUMENTS_PATH || path.join(process.cwd(), 'documents');

// Middleware
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public'), {
	setHeaders: (res, path) => {
		if (path.endsWith('.js')) {
			res.setHeader('Content-Type', 'application/javascript');
		}
	}
}));

// Debug logging
console.log('Static file paths:', {
	dirname: __dirname,
	publicPath: path.join(__dirname, 'public')
});

app.use((req, res, next) => {
	console.log('Request URL:', req.url);
	next();
});

const openai = createOpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Did the API key load?
console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

const documentProcessor = new DocumentProcessor();

// Load documents when server starts
(async () => {
	try {
		console.log('Attempting to load documents from:', DOCUMENTS_PATH);
		await documentProcessor.loadDocumentsFromDirectory(DOCUMENTS_PATH);
		console.log('Documents loaded successfully');
	} catch (err) {
		const error = err as Error;
		console.error('Failed to load documents:', error.message);
		console.error('Error details:', {
			name: error.name,
			message: error.message,
			stack: error.stack
		});
	}
})();

app.post("/api/chat", async (req, res) => {
	try {
		const { prompt = "What is the capital of the moon?" } = req.body;

		// Find relevant document chunks
		const relevantChunks = documentProcessor.findRelevantChunks(prompt);
		
		// Create a prompt that includes the relevant context
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
		const err = error as { message: string, code?: string, type?: string, response?: any };
		console.error('Error details:', {
			message: err.message,
			code: err.code,
			type: err.type,
			response: err.response
		});

		res.status(500).json({ 
			error: 'Failed to generate response',
			details: err.message
		});
	}
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
