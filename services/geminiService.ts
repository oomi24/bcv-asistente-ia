
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { NewsSearchResultItem } from '../types';

/**
 * Searches news using Gemini with Google Search grounding.
 */
export const searchNewsWithGemini = async (
  ai: GoogleGenAI,
  query: string
): Promise<{ textResponse: string; searchResults: NewsSearchResultItem[] }> => {
  try {
    console.log(`Searching news with query: ${query}`);
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const textResponse = response.text;
    let searchResults: NewsSearchResultItem[] = [];

    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      searchResults = response.candidates[0].groundingMetadata.groundingChunks
        .map(chunk => {
          const webInfo = chunk.web || chunk.retrievedContext; // Check both possible structures
          if (webInfo && webInfo.uri) {
            return {
              title: webInfo.title || 'Título no disponible',
              link: webInfo.uri,
              snippet: `Información obtenida de ${webInfo.title || webInfo.uri}`, // Snippet might come from main text or be generic
              source: new URL(webInfo.uri).hostname,
              groundingChunks: [chunk] // Keep original chunk for more details if needed
            };
          }
          return null;
        })
        .filter(item => item !== null) as NewsSearchResultItem[];
    }
    
    console.log("News search response:", { textResponse, searchResults });
    return { textResponse, searchResults };

  } catch (error) {
    console.error("Error searching news with Gemini:", error);
    throw new Error(`Failed to search news: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generates text content using Gemini based on a given prompt and optional system instruction.
 */
export const generateTextGemini = async (
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction?: string
): Promise<string> => {
  try {
    console.log(`Generating text with prompt: ${prompt.substring(0,100)}...`);
    if(systemInstruction) console.log(`With system instruction: ${systemInstruction}`);

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    // For general text tasks, omit thinkingConfig (defaults to enabled)

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      ...(Object.keys(config).length > 0 && { config }),
    });
    
    console.log("Text generation response received.");
    return response.text;
  } catch (error) {
    console.error("Error generating text with Gemini:", error);
    throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`);
  }
};
