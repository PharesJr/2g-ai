import "dotenv/config";
import { sendSMS } from "../../../utils/sendSms";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// Initialize AI Model Client
const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "meta/Llama-4-Scout-17B-16E-Instruct";
const client = ModelClient(endpoint, new AzureKeyCredential(token));

// In-memory store for conversation history
const conversationStore = new Map();

// Function to count words
const countWords = (text) => text.trim().split(/\s+/).length;

// Function to split and trim response to meet SMS constraints
const trimResponse = (text, maxWords = 45, maxCharsPerPart = 153) => {
  let result = text.replace(/[\r\n]+/g, " ").replace(/[^ -~]/g, ""); // Remove line breaks and non-ASCII
  const parts = [];
  let remaining = result;

  // Split into parts of maxCharsPerPart, respecting word boundaries
  while (remaining.length > 0 && countWords(remaining) > 0) {
    let part = remaining.substring(0, maxCharsPerPart);
    if (countWords(part) > maxWords) {
      // Trim to maxWords within this part
      while (countWords(part) > maxWords && part.length > 0) {
        const lastSpace = part.lastIndexOf(" ", maxCharsPerPart - 1);
        if (lastSpace === -1) break;
        part = part.substring(0, lastSpace);
      }
    }
    parts.push(part.trim());
    remaining = remaining.substring(part.length).trim();
  }

  return parts.length > 0 ? parts : ["Unable to generate a clear response."];
};

export async function POST(req) {
  let body;
  try {
    const rawBody = await req.text();
    console.log("Raw SMS Request Body:", rawBody);

    const parsedBody = new URLSearchParams(rawBody);
    body = {
      from: parsedBody.get("from") || "",
      to: parsedBody.get("to") || "",
      text: parsedBody.get("text") || "",
      date: parsedBody.get("date") || "",
      id: parsedBody.get("id") || "",
    };

    console.log("Received SMS:", body);

    const { from, text } = body;

    if (!from || !text) {
      console.error("Missing sender or message text");
      return new Response("Missing sender or message text", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Get conversation history for the user
    const userId = from;
    const previousMessages = conversationStore.get(userId) || [];
    const userMessages = previousMessages
      .filter((msg) => msg.role === "user")
      .slice(-3); // Keep last 3 user messages
    const messages = [
      {
        role: "system",
        content:
          "You are a friendly, concise SMS chatbot. Respond in under 45 words using simple, clear language suitable for SMS. Avoid greetings or extra phrases.",
      },
      ...userMessages,
      { role: "user", content: text },
    ];

    // Query the AI model
    const aiResponse = await client.path("/chat/completions").post({
      body: {
        messages,
        temperature: 0.1, // More deterministic output
        top_p: 0.9,
        model: model,
        max_tokens: 60, // Allow slightly longer responses
      },
    });

    if (isUnexpected(aiResponse)) {
      console.error(`AI Error for ID ${body.id}:`, aiResponse.body.error);
      await sendSMS({
        to: from,
        message: "Error processing your query. Please try again.",
        from: body.to,
      });
      return new Response("AI model error", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }

    let reply =
      aiResponse.body.choices[0]?.message.content || "No response from AI.";

    // Trim and split response into parts
    const replyParts = trimResponse(reply, 45, 153);

    // If all parts are too short or empty, use a fallback
    if (replyParts.every((part) => part.length < 10 || countWords(part) < 5)) {
      replyParts.splice(
        0,
        replyParts.length,
        "Unable to generate a clear response."
      );
    }

    // Update conversation history with the full response
    conversationStore.set(
      userId,
      [
        ...userMessages,
        { role: "user", content: text },
        { role: "assistant", content: replyParts.join(" ") },
      ].slice(-4)
    ); // Store up to 4 messages (3 user + 1 assistant)

    // Send each part as a separate SMS
    for (const part of replyParts) {
      await sendSMS({
        to: from,
        message: part,
        from: body.to,
      });
    }

    return new Response("SMS processed", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error(`Error for ID ${body?.id}:`, error);
    if (body?.from && body?.to) {
      await sendSMS({
        to: body.from,
        message: "Server error. Please try again later.",
        from: body.to,
      });
    }
    return new Response("Server error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
