import OpenAI from 'openai';


export function createSuggestionsAIClient(): OpenAI {

  const key = process.env.SUGGESTION_OPENAI_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  return new OpenAI({
    apiKey: process.env.SUGGESTION_OPENAI_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  });
}
