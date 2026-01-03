
// @google/genai service layer for Quant Ninja
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Bet } from "../types";

/**
 * Processes a live frame from the agent's viewport to identify +EV bets.
 * Uses Gemini 3 Flash for fast vision-to-structured-data conversion.
 */
export const processLiveFrame = async (base64Image: string): Promise<{ bets: Bet[], isValid: boolean }> => {
  // Always initialize right before use to ensure latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  const prompt = `
    You are an expert sports betting analyst. Analyze this screenshot.
    
    CRITICAL VALIDATION:
    Is this image clearly a sports betting dashboard or +EV tool containing a table of bet lines?
    A valid dashboard MUST show columns for: Event/Matchup, Market/Line, Odds, and ideally EV%.

    DATA EXTRACTION:
    1. Scan for rows that represent a +EV bet.
    2. Extract: Event, Market, Odds (Decimal), Bookie, and EV%.
    3. Only include bets with a POSITIVE EV.
    
    Response must be a JSON object: { "isValid": boolean, "bets": Array<{event, market, odds, ev, bookie}> }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            bets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  event: { type: Type.STRING },
                  market: { type: Type.STRING },
                  odds: { type: Type.NUMBER },
                  ev: { type: Type.NUMBER },
                  bookie: { type: Type.STRING },
                },
                required: ['event', 'market', 'odds', 'ev', 'bookie']
              }
            }
          },
          required: ['isValid', 'bets']
        }
      }
    });

    const data = JSON.parse(response.text || '{"isValid": false, "bets": []}');
    if (!data.isValid) return { bets: [], isValid: false };

    return { 
      bets: data.bets.map((b: any) => ({
        ...b,
        id: `live-${Math.random().toString(36).substr(2, 9)}`, 
        timestamp: Date.now(),
        status: 'PENDING',
        stake: 0
      })), 
      isValid: true 
    };
  } catch (e) {
    return { bets: [], isValid: false };
  }
};

/**
 * General purpose image analysis using Gemini 3 Flash.
 * Used by the VisionSection component.
 */
export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text || "No analysis could be generated for this image.";
  } catch (e) {
    console.error("Image Analysis Error:", e);
    return "Analysis failed. Please check your connection and API key.";
  }
};

/**
 * Text-to-Image generation using Gemini 2.5 Flash Image.
 * Used by the CanvasSection component.
 */
export const generateImage = async (prompt: string, aspectRatio: "1:1" | "16:9" | "9:16"): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio,
        },
      },
    });

    // Iterate through all parts to find the image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image was returned by the model.");
  } catch (e) {
    console.error("Image Generation Error:", e);
    throw e;
  }
};

/**
 * Wrapper for processLiveFrame specifically for the Vision Scanner component.
 */
export const extractBetsFromImage = async (base64Image: string): Promise<Bet[]> => {
  const result = await processLiveFrame(base64Image);
  return result.bets;
};

/**
 * Searches the web for live +EV betting opportunities using Google Search grounding.
 */
export const syncBetsFromWeb = async (): Promise<Bet[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const now = new Date();
  
  const prompt = `
    CURRENT TIMESTAMP: ${now.toISOString()} (${now.toLocaleDateString()} ${now.toLocaleTimeString()})
    
    TASK: Search for LIVE or UPCOMING +EV (Positive Expected Value) sports bets.
    
    STRICT TEMPORAL FILTERING:
    - DISCARD any bet for a game that has already started or finished.
    - Only return bets that can be placed IMMEDIATELY for FUTURE events.
    - Check the current score/status of the game if needed using Google Search.
    
    SOURCES: Crazy Ninja Odds, OddsJam, or similar fresh betting aggregators.
    
    Return a JSON array of objects: { "event": string, "market": string, "odds": number, "bookie": string, "ev": number }.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              event: { type: Type.STRING }, 
              market: { type: Type.STRING }, 
              odds: { type: Type.NUMBER }, 
              ev: { type: Type.NUMBER }, 
              bookie: { type: Type.STRING },
            },
            required: ['event', 'market', 'odds', 'ev', 'bookie']
          }
        }
      }
    });
    
    // Extract website URLs from groundingChunks as per guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingSources = groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];
    
    const parsed = JSON.parse(response.text || '[]');
    return parsed.map((b: any) => ({
      ...b,
      id: `web-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      status: 'PENDING',
      stake: 0,
      groundingSources
    }));
  } catch (e) { 
    console.error("Web Sync Error:", e);
    return []; 
  }
};

/**
 * Verifies the result of pending bets using Google Search grounding.
 */
export const settleBetsWithSearch = async (bets: Bet[]): Promise<Bet[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const pendingToSettle = bets
    .filter(b => b.status === 'PENDING')
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 5);

  if (pendingToSettle.length === 0) return bets;
  const results = [...bets];

  const settleSingleBet = async (bet: Bet) => {
    const prompt = `Verify result for: "${bet.market}" in "${bet.event}" from ${new Date(bet.timestamp).toLocaleDateString()}. 
    Return format: WON | details OR LOST | details. 
    If game not finished: PENDING.`;

    try {
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-pro-preview', 
        contents: prompt, 
        config: { tools: [{ googleSearch: {} }] } 
      });
      if (!response || !response.text) return;

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const groundingSources = groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];

      const text = response.text.trim();
      const [statusPart, details] = text.split('|').map(s => s.trim());
      if (statusPart === 'WON' || statusPart === 'LOST') {
        const foundIndex = results.findIndex(r => r.id === bet.id);
        if (foundIndex !== -1) {
          results[foundIndex] = {
            ...results[foundIndex],
            status: statusPart as 'WON' | 'LOST',
            resultDetails: details || 'Verified via AI Market Search',
            groundingSources
          };
        }
      }
    } catch (e) {
      console.warn(`Settlement failed for ${bet.id}:`, e);
    }
  };
  await Promise.all(pendingToSettle.map(settleSingleBet));
  return results;
};

/**
 * Chat reasoning using Gemini 3 Pro with Thinking budget.
 */
export const generateChatResponse = async (prompt: string, history: any[], useThinking: boolean): Promise<GenerateContentResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: useThinking ? 32768 : 0 } }
  });
};
