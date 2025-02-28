import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

// Use a server-side environment variable or a secure service
// For development purposes only, not for production
const getApiKey = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error("Google API key is missing. Please set it in your environment variables.");
  }
  
  return apiKey;
};

// Initialize the chat model with Gemini
const chatModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-lite",
  apiKey: getApiKey(),
  maxOutputTokens: 1024,
  temperature: 0.7
});

// Export function to be used by App.jsx
export async function askAI(question) {
  try {
    const responseMessage = await chatModel.invoke([new HumanMessage(question)]);
    return responseMessage.content;
  } catch (error) {
    console.error("Error querying AI model:", error);
    return "Sorry, there was an error processing your request.";
  }
}

// Example usage (can be removed in production)
// const userQuestion = "Hello! What is the capital of France?";
// const responseMessage = await chatModel.invoke([new HumanMessage(userQuestion)]);
// console.log(responseMessage.content);