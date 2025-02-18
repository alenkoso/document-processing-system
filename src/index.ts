import express from "express";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { Anthropic } from "@anthropic-ai/sdk";
import dotenv from "dotenv";

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

app.post("/api/chat", async (req, res) => {
	try {
		const { prompt = "What is the capital of the moon?" } = req.body;

		const result = await generateText({
			model: openai("gpt-4o-mini"),
			prompt,
			maxTokens: 500,
		});

		res.json({
			answer: result.text
		});
	} catch (error) {
		// More detailed error logging
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
