
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Bet } from "../types";

/**
 * Specifically tuned for real-time vision processing of betting dashboards.
 */
export const processLiveFrame = async (base64Image: string): Promise<{ bets: Bet[], isValid: boolean }> => {
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
    Is this image clearly a sports betting dashboard or +EV tool (like Crazy Ninja Odds, OddsJam, etc.) containing a table of bet lines?
    A valid dashboard MUST show columns for: Event/Matchup, Market/Line, Odds, and ideally EV%.
    If it is just a generic website, desktop, or non-betting page, set "isValid" to false.

    DATA EXTRACTION (only if isValid is true):
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

    const finalizedBets = data.bets.map((b: any) => ({
      ...b,
      id: `live-${Math.random().toString(36).substr(2, 9)}`, 
      timestamp: Date.now(),
      status: 'PENDING',
      stake: 0
    }));

    return { bets: finalizedBets, isValid: true };
  } catch (e) {
    console.error("Vision Processing Error:", e);
    return { bets: [], isValid: false };
  }
};

export const syncBetsFromWeb = async (): Promise<Bet[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Search for the most recent +EV sports bets from leading odds sites like CrazyNinjaOdds. Return JSON array: {event, market, odds, bookie, ev}.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              event: { type: Type.STRING }, market: { type: Type.STRING }, odds: { type: Type.NUMBER }, ev: { type: Type.NUMBER }, bookie: { type: Type.STRING },
            },
            required: ['event', 'market', 'odds', 'ev', 'bookie']
          }
        }
      }
    });
    
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
  } catch (e) { return []; }
};

export const extractBetsFromImage = async (base64Image: string): Promise<Bet[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } };
  const prompt = `Extract +EV bets from this screenshot. Return JSON array: {event, market, odds, bookie, ev}. Only include rows with positive EV.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [imagePart, { text: prompt }] },
    config: { responseMimeType: 'application/json' }
  });
  const parsed = JSON.parse(response.text || '[]');
  return parsed
    .filter((b: any) => b.ev > 0)
    .map((b: any) => ({ ...b, id: `v-${Math.random().toString(36).substring(7)}`, timestamp: Date.now(), status: 'PENDING', stake: 0 }));
};

export const settleBetsWithSearch = async (bets: Bet[]): Promise<Bet[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const pendingToSettle = bets
    .filter(b => b.status === 'PENDING')
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 5);

  if (pendingToSettle.length === 0) return bets;
  const results = [...bets];

  const settleSingleBet = async (bet: Bet) => {
    const prompt = `Did "${bet.market}" win in the game "${bet.event}" on ${new Date(bet.timestamp).toLocaleDateString()}? 
    Return exactly in this format: WON | short_detail OR LOST | short_detail. 
    If result is not yet available, return PENDING.`;

    try {
      const responsePromise = ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt, 
        config: { tools: [{ googleSearch: {} }] } 
      });
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 15000)
      );
      const response = await Promise.race([responsePromise, timeoutPromise]);
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
            resultDetails: details || 'Result verified via Google Search',
            groundingSources
          };
        }
      }
    } catch (e) {
      console.warn(`Could not settle bet ${bet.id}:`, e);
    }
  };
  await Promise.all(pendingToSettle.map(settleSingleBet));
  return results;
};

export const generateChatResponse = async (prompt: string, history: any[], useThinking: boolean): Promise<GenerateContentResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: useThinking ? 32768 : 0 } }
  });
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } };
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [imagePart, { text: prompt }] } });
  return response.text || '';
};

export const generateImage = async (prompt: string, aspectRatio: "1:1" | "16:9" | "9:16"): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio } }
  });
  for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`; }
  throw new Error("No image generated.");
};
