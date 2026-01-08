import { GoogleGenAI, Type } from "@google/genai";
import { SmartFillResponse } from "../types";

const parseInvoiceItems = async (description: string): Promise<SmartFillResponse | null> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing for Gemini Service");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
    return null;
  }
};

export const geminiService = {
  parseInvoiceItems
};