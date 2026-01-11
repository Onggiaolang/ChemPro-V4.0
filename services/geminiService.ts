
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { FlowerIdentification } from "../types";

// Always initialize GoogleGenAI with a named parameter for apiKey.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const identifyFlower = async (base64Image: string): Promise<FlowerIdentification> => {
  const model = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1] || base64Image
          }
        },
        {
          text: "Identify this flower. Provide detailed botanical information and care instructions in JSON format."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          scientificName: { type: Type.STRING },
          family: { type: Type.STRING },
          origin: { type: Type.STRING },
          meaning: { type: Type.STRING },
          careGuide: {
            type: Type.OBJECT,
            properties: {
              watering: { type: Type.STRING },
              sunlight: { type: Type.STRING },
              soil: { type: Type.STRING },
              temperature: { type: Type.STRING }
            },
            required: ["watering", "sunlight", "soil", "temperature"]
          },
          interestingFacts: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["name", "scientificName", "family", "careGuide", "interestingFacts"]
      }
    }
  });

  // Accessing response.text as a property.
  return JSON.parse(response.text || '{}');
};

export const chatWithBotanist = async (history: { role: string; text: string }[], message: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are 'Hoa', a world-class AI botanist. You specialize in flower identification, plant health diagnosis, and floral symbolism. Your tone is warm, professional, and poetic yet scientific. Answer questions about flowers, gardening, and plant care.",
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

export const getFlowerCollection = async () => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "List 6 popular and beautiful flowers with a short description for an 'Explore' section.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            id: { type: Type.STRING }
          },
          required: ["name", "description", "category", "id"]
        }
      }
    }
  });
  // Accessing response.text as a property.
  return JSON.parse(response.text || '[]');
};
