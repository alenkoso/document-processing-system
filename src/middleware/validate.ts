import { Request, Response, NextFunction } from 'express';

export function validateChatRequest(req: Request, res: Response, next: NextFunction) {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({
            error: 'Invalid request',
            details: 'Prompt is required and must be a non-empty string'
        });
    }
    
    if (prompt.length > 500) {
        return res.status(400).json({
            error: 'Invalid request',
            details: 'Prompt must be less than 500 characters'
        });
    }
    
    next();
} 