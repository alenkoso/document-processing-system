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

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post("/api/chat", async (req, res) => {
	// TODO: implement the endpoint

	const result = await generateText({
		model: openai("gpt-4o-mini"),
		prompt: "What is the capital of the moon?",
	});

	const anthropicResult = await anthropic.messages.create({
		model: "claude-3-sonnet-20240229",
		messages: [{ 
			role: "user", 
			content: "What is the capital of the moon?" 
		}],
		max_tokens: 100,
	});

	res.json({
		openai: result.text,
		anthropic: anthropicResult.content[0]
	});
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
