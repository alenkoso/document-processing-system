import express from "express";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { Anthropic } from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { DocumentProcessor } from './documentProcessor';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const openai = createOpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Did the API key load?
console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

const documentProcessor = new DocumentProcessor();

// Load documents when server starts
(async () => {
	try {
		await documentProcessor.loadDocumentsFromDirectory(
			path.join(__dirname, 'documents')
		);
		console.log('Documents loaded successfully');
	} catch (error) {
		console.error('Failed to load documents:', error);
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

// curl -X POST http://localhost:3000/api/chat \
// -H "Content-Type: application/json" \
// -d '{"prompt": "What happens in the Flourish and Blotts scene in Harry Potter?"}'