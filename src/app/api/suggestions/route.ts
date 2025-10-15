import { createSuggestionsAIClient } from "../../../lib/openAI/suggestions";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export async function POST(req: Request) {
  // In a real app, you’d get these from req.body or DB

  const chat = await req.json();

  console.log("chat", chat);

  const videoTitle = "Top 10 Travel Destinations";
  const videoStyle = "Modern, minimal, bold text";

  // Chat history with 3 turns
  const chatHistory: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
      You are a thumbnail suggestion assistant.
      Rules:
      - Always respond in JSON only.
      - JSON shape must be: {
          "message": "string",
          "suggestions": ["string", "string", ...]
        }
       - Never ask the user if they want suggestions.
       - Always generate fresh new suggestions in "suggestions". 
      - Never generate suggestions that are already in "suggestions".
      - Always provide only 3 fresh suggestions.
      - every suggestion length should be less then 10 words
      - Give  style related suggestions, example:- back ground changes, font changes etc...
      - Give any objects to add related  suggestions
    `,
    },
    {
      role: "user",
      content: chat[0].message,
    },
  ];

  try {
    const client = createSuggestionsAIClient();

    const completion = await client.chat.completions.create({
      model: "gemini-2.0-flash", // or "gemini-2.5-flash"
      messages: chatHistory,
      temperature: 0.7,
    });

    let rawOutput = completion.choices[0].message?.content ?? "{}";
    rawOutput = rawOutput.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch (err) {
        console.log(err, "err");
      console.error("Failed to parse LLM response:", rawOutput);
      parsed = { message: "Failed to parse suggestions", suggestions: [] };
    }

    console.log(parsed);

    return new Response(
      JSON.stringify({
        message: parsed.message,
        suggestions: parsed.suggestions,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to generate suggestions:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate suggestions" }),
      { status: 500 }
    );
  }
}

/*
https://platform.openai.com/docs/api-reference/chat/create?lang=node.js
*/
