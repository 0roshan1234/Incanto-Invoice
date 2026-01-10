import { GoogleGenAI, Type } from "@google/genai";
import { SmartFillResponse } from "../types";

const parseInvoiceItems = async (description: string): Promise<SmartFillResponse | null> => {
  // The value is replaced at build time by Vite based on vite.config.ts
  const apiKey = process.env.API_KEY;

  // Check for valid key
  if (!apiKey || apiKey.trim() === '' || apiKey === '""') {
    console.error("Gemini Parse Error: API Key is missing or empty.");
    alert("System Error: API_KEY is missing. Please ensure 'API_KEY' or 'VITE_API_KEY' is set in your Vercel Environment Variables and redeploy.");
    return null;
  }

  // Remove potential extra quotes from JSON.stringify if present (double safety)
  const cleanKey = apiKey.replace(/['"]+/g, '');

  try {
    const ai = new GoogleGenAI({ apiKey: cleanKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: `Extract invoice details or actions from this text. 
      
      Capabilities:
      1. Extract Client/Customer details (Name, Address, GSTIN, Phone).
      2. Extract Line items (Description, Quantity, Price).
      3. Identify actions to clear data based on user intent:
         - "Clear client", "Remove customer", "Reset client" -> actions.clearClient = true
         - "Clear items", "Remove products", "Reset items" -> actions.clearItems = true
         - "Remove payment", "Not paid", "Clear payment details", "Mark as unpaid" -> actions.markAsUnpaid = true
         - "Mark as paid", "Paid" -> actions.markAsPaid = true
      
      If a price or quantity is implied, use reasonable defaults.
      
      Text: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actions: {
              type: Type.OBJECT,
              properties: {
                clearClient: { type: Type.BOOLEAN, description: "Set to true if user wants to clear/remove client details" },
                clearItems: { type: Type.BOOLEAN, description: "Set to true if user wants to remove all line items" },
                markAsUnpaid: { type: Type.BOOLEAN, description: "Set to true if user wants to remove payment status or mark as unpaid" },
                markAsPaid: { type: Type.BOOLEAN, description: "Set to true if user wants to mark invoice as paid" }
              }
            },
            clientDetails: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Client or Customer Name" },
                address: { type: Type.STRING, description: "Client Address" },
                gstin: { type: Type.STRING, description: "Client GSTIN" },
                phone: { type: Type.STRING, description: "Client Phone Number" }
              }
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: "Description of the product or service" },
                  quantity: { type: Type.NUMBER, description: "Quantity sold" },
                  price: { type: Type.NUMBER, description: "The price or amount mentioned for the item" }
                },
                required: ["description", "quantity", "price"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as SmartFillResponse;
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    alert("Failed to connect to AI service. Please check your internet connection.");
    return null;
  }
};

export const geminiService = {
  parseInvoiceItems
};