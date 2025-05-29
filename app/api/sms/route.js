// app/api/sms/route.js
import "dotenv/config";
import { sendSMS } from "../../../utils/sendSms";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// Initialize AI Model Client
const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "deepseek/DeepSeek-V3-0324";
const client = ModelClient(endpoint, new AzureKeyCredential(token));

// Function to count words
const countWords = (text) => text.trim().split(/\s+/).length;

// Function to trim response to meet constraints
const trimResponse = (text, maxWords = 45, maxChars = 200) => {
  let result = text.replace(/[\r\n]+/g, " ").replace(/[^ -~]/g, ""); // Remove line breaks and non-ASCII
  // Trim to maxChars
  result = result.substring(0, maxChars);
  // Ensure word count is under maxWords
  while (countWords(result) > maxWords && result.length > 0) {
    const lastSpace = result.lastIndexOf(" ", maxChars - 1);
    if (lastSpace === -1) break;
    result = result.substring(0, lastSpace);
  }
  return result.trim();
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

    // Query the AI model with stricter prompt
    const aiResponse = await client.path("/chat/completions").post({
      body: {
        messages: [
          {
            role: "system",
            content:
              "You are a concise assistant. Respond in under 45 words and 200 characters. Be clear, factual, and to the point. Avoid greetings or extra phrases.",
          },
          {
            role: "user",
            content: text, // Directly use the user's text
          },
        ],
        temperature: 0.3, // Lower temperature for more predictable, concise output
        top_p: 0.9, // Slightly reduce randomness
        model: model,
        max_tokens: 50, // Tighter token limit (~200 chars, assuming ~4 chars/token)
      },
    });

    if (isUnexpected(aiResponse)) {
      console.error("AI Model Error:", aiResponse.body.error);
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

    // Trim and validate response
    reply = trimResponse(reply, 45, 200);

    // If reply is empty or too short, use a fallback
    if (reply.length < 10 || countWords(reply) < 5) {
      reply = "Unable to generate a clear response.";
    }

    // Send AI response back to user via SMS
    await sendSMS({
      to: from,
      message: reply,
      from: body.to,
    });

    return new Response("SMS processed", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error processing SMS request:", error);
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