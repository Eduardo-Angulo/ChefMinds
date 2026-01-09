
import { GoogleGenAI, Type } from "@google/genai";
import { MealSuggestion } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getMealSuggestion = async (preference: string): Promise<MealSuggestion> => {
  // We specify the language in the prompt to ensure the AI generates content in Spanish.
  const prompt = `Basado en la preferencia del usuario: "${preference}", sugiere una comida deliciosa, realista y coherente para hoy. 
  Proporciona una receta detallada y un prompt descriptivo para generar una imagen apetitosa de este plato.
  TODA la respuesta debe estar en ESPAÑOL.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipe: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              cookingTime: { type: Type.STRING },
              difficulty: { type: Type.STRING, description: "Nivel de dificultad: Fácil, Media o Difícil" },
              calories: { type: Type.STRING }
            },
            required: ["name", "description", "ingredients", "steps", "cookingTime", "difficulty", "calories"]
          },
          imagePrompt: { type: Type.STRING, description: "Detailed visual description of the dish in English for better image generation results" }
        },
        required: ["recipe", "imagePrompt"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateMealImage = async (imagePrompt: string): Promise<string | null> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `Professional food photography of: ${imagePrompt}. High resolution, bokeh background, appetizing lighting, overhead shot.` }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
