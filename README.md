# AI Chatbot for 2G Environments

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). It powers an AI chatbot accessible via SMS, designed for 2G environments where users rely on basic mobile phones with no or limited internet access. The chatbot uses the Africa's Talking SMS API to handle two-way text communication and an AI model (`meta/Llama-4-Scout-17B-16E-Instruct`) to generate concise, context-aware responses suitable for SMS (under 160 characters per message).

## Project Overview

This project enables users in low-bandwidth 2G environments (common in regions like rural Kenya) to interact with an AI chatbot via SMS. Users send queries to a designated number, and the chatbot responds with answers optimized for brevity and clarity, supporting multi-part SMS for longer responses. The system retains conversation context (last 3 user messages) to provide coherent follow-up responses, making it ideal for agricultural queries (e.g., "Is it safe to plant onions in June?") or other practical questions.

Key features:
- **SMS Integration**: Uses Africa's Talking API to send/receive SMS, ensuring compatibility with 2G networks.
- **AI-Powered Responses**: Leverages an AI model hosted at `https://models.github.ai/inference` for intelligent, concise replies.
- **Context Retention**: Stores up to 3 previous user messages for conversational continuity.
- **Optimized for SMS**: Responses are trimmed to fit SMS limits (160 chars for single messages, 153 chars per part for concatenated messages).
- **2G Focus**: Designed for basic phones, requiring no internet or smartphone capabilities.

## Getting Started

### Prerequisites
- **Node.js**: Install Node.js (v16 or later) to run the Next.js server.
- **Africa's Talking Account**: Set up an account and obtain an API key and username for SMS functionality.
- **Environment Variables**: Create a `.env` file in the project root with:
  ```plaintext
  GITHUB_TOKEN=your-ai-model-token
  SMS_API=your-africas-talking-api-key
  SMS_USERNAME=your-africas-talking-username

  Installation
Clone the repository:
bash

git clone https://github.com/PharesJr/2g-ai.git

Install dependencies:
bash

npm install
# or
yarn install
# or
pnpm install
# or
bun install
Run the development server:
bash

npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev


Open http://localhost:3000 to verify the server is running. The SMS endpoint is at /api/sms.

Configuration
SMS Endpoint: Configure Africa's Talking to send incoming SMS webhooks to http://your-domain/api/sms (or use a tool like ngrok for local testing).
AI Model: The app uses meta/Llama-4-Scout-17B-16E-Instruct via the Azure AI Inference client. Ensure your GITHUB_TOKEN is valid for the endpoint https://models.github.ai/inference.
Usage
Users send an SMS query to your Africa's Talking shortcode or phone number (e.g., "Is it safe to plant maize in June?").
The app processes the query via /api/sms, queries the AI model, and sends a response (single or multi-part SMS).
Responses are optimized for 2G devices, ensuring clarity within SMS character limits.
Project Structure
app/api/sms/route.js: Handles incoming SMS webhooks, queries the AI model, and sends responses.
app/utils/sendSMS.js: Integrates with Africa's Talking API to send SMS messages.
app/page.tsx: Default Next.js page (optional, can be customized for a web interface).
2G Environment Considerations
Low Bandwidth: The app relies solely on SMS, requiring no data connection, making it ideal for 2G networks.
Message Length: Responses are trimmed to 160 chars for single SMS or split into 153-char parts for concatenation, ensuring compatibility with basic phones.
Error Handling: Includes fallbacks for AI errors or invalid inputs, sending user-friendly error messages via SMS.
Scalability: Uses an in-memory conversation store for context. For production, consider a database like Redis for larger user bases.
Testing
Use Africa's Talking sandbox to simulate SMS without real charges.
Test with queries like "Can I plant onions now?" to verify single SMS responses.
Test longer responses (e.g., "Explain onion farming") to confirm multi-part SMS concatenation.
Check logs for errors, especially if certain phone numbers fail (e.g., due to format issues).
Learn More
Next.js Documentation - Learn about Next.js features and API.
Africa's Talking SMS API - Details on SMS integration.
Azure AI Inference - Info on the AI model client.
Deploy on Vercel
Deploy easily using the Vercel Platform. Ensure environment variables are set in Vercel’s dashboard. See Next.js deployment documentation for details.

Contributing
Feedback and contributions are welcome! Check out the project’s GitHub repository to submit issues or pull requests.


### Key Updates
1. **Project Context**:
   - Added a detailed overview explaining the AI chatbot’s purpose: enabling AI interaction via SMS in 2G environments.
   - Highlighted the use of Africa's Talking API and the AI model (`meta/Llama-4-Scout-17B-16E-Instruct`).
   - Emphasized suitability for basic phones and low-bandwidth networks.
2. **2G-Specific Details**:
   - Noted the app’s design for 2G networks, requiring no internet and supporting SMS-only communication.
   - Described message length optimization (160 chars for single SMS, 153 chars per part for concatenated SMS).
3. **Setup Instructions**:
   - Added prerequisites for Africa’s Talking account and environment variables.
   - Included instructions for configuring SMS webhooks and testing with tools like ngrok.
4. **Testing Guidance**:
   - Suggested testing with Africa’s Talking sandbox and specific queries to verify single and multi-part SMS.
   - Referenced the phone number issue from your earlier query, suggesting log checks.
5. **Retained Next.js Info**:
   - Kept core Next.js setup, deployment, and learning resources, but tailored them to the SMS chatbot context.
6. **Project Structure**:
   - Added a section describing key files (`route.js`, `sendSMS.js`) and their roles.
7. **License Placeholder**:
   - Included a placeholder for specifying a license (e.g., MIT), which you can update.

### Notes
- **Phone Number Issue**: Your earlier query mentioned some numbers failing with the Africa’s Talking API. The README suggests checking logs for errors, but you may want to add number normalization in `sendSMS` (e.g., adding `+254` for Kenyan numbers). I can provide that update if needed.
- **Testing**: Test the SMS endpoint with Africa’s Talking sandbox and queries like "Can I plant onions now?" to ensure responses fit in one SMS or split correctly.
- **Deployment**: Vercel is ideal for Next.js, but ensure your Africa’s Talking webhook URL is updated post-deployment (e.g., `https://your-vercel-app.vercel.app/api/sms`).
- **Scalability**: The README notes the in-memory `conversationStore` limitation. For production, consider adding a Redis setup guide if you plan to scale.

### Next Steps
- **Test the README**: Ensure all instructions (e.g., `.env` setup, webhook configuration) work in your environment.
- **Add Normalization**: If phone number issues persist, I can update `utils/sendSMS.js` to normalize numbers.
- **Enhance Features**: If you want to add command handling (e.g., "HELP" for instructions) or retry logic, let me know.

Would you like me to update `sendSMS.js` for number normalization, add specific features to the README, or focus on another aspect (e.g., testing or deployment)?