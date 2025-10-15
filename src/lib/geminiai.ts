import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";
export function getGeminiAI() {
  const key = process.env.GEMINI_AI_API_KEY;
  console.log('process.env.GEMINI_AI_API_KEY', process.env.GEMINI_AI_API_KEY);
  if (!key) throw new Error('OPENAI_API_KEY not set');
  return new GoogleGenAI(
    {
      apiKey: process.env.GEMINI_AI_API_KEY
    }
  );
}
