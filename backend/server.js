import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware with 25mb limit for document/image base64 payloads
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Health Check Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running!' });
});

// Chat & Document Analysis Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, attachments } = req.body;
        if (!prompt && (!attachments || attachments.length === 0)) {
            return res.status(400).json({ error: 'Prompt or document attachment is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is missing from server environment variables.' });
        }

        const contents = [];

        // Process attachments (PDFs, images, documents)
        if (attachments && Array.isArray(attachments)) {
            for (const att of attachments) {
                if (att.data && att.mimeType) {
                    contents.push({
                        inlineData: {
                            mimeType: att.mimeType,
                            data: att.data,
                        }
                    });
                }
            }
        }

        // Add prompt text
        if (prompt && prompt.trim()) {
            contents.push(prompt.trim());
        } else if (contents.length > 0) {
            contents.push('Please analyze this document/image in detail and explain the core concepts.');
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: contents,
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});