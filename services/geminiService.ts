
import { GoogleGenAI } from "@google/genai";

export const getBusinessInsights = async (salesData: any, inventoryData: any) => {
  // Always use process.env.API_KEY directly as a named parameter in the constructor.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Maamulaha ganacsiga "Koob Coffee" waxaan u baahanahay talo ku saabsan ganacsiga.
    Halkan waa xogta iibka ee hadda: ${JSON.stringify(salesData)}
    Halkan waa xogta kaydka (inventory): ${JSON.stringify(inventoryData)}
    
    Fadlan i sii 3 dhibcood oo muhiim ah oo ku saabsan sida aan u horumarin karno iibka ama aan u badbaadin karno kharashka. 
    U soo qor af-Soomaali fudud oo ganacsi ku dheehan yahay.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    if (!response || !response.text) {
      return "AI-gu wax jawaab ah ma soo bixin. Fadlan mar kale isku day.";
    }

    return response.text;
  } catch (error: any) {
    const errorString = JSON.stringify(error).toUpperCase();
    
    // Handle Quota Exceeded (429) specifically
    if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes("QUOTA")) {
      return "Nidaamka AI-ga wuxuu gaaray xadkiisii (Quota/Limit). Fadlan sug waxyar ama hubi qorshahaaga Google AI Studio si aad u sii waddo isticmaalka.";
    }
    
    // Handle Unauthorized (401) or Forbidden (403)
    if (errorString.includes("401") || errorString.includes("403") || errorString.includes("UNAUTHENTICATED") || errorString.includes("PERMISSION_DENIED")) {
      return "Fadlan hubi in API Key-gaagu sax yahay oo uu leeyahay oggolaansho kugu filan.";
    }

    // Handle Bad Request (400)
    if (errorString.includes("400") || errorString.includes("INVALID_ARGUMENT")) {
      return "Xogta la diray ma saxna. Fadlan hubi xogtaada.";
    }

    // Handle Server Errors (500, 503)
    if (errorString.includes("500") || errorString.includes("503") || errorString.includes("INTERNAL") || errorString.includes("UNAVAILABLE")) {
      return "Cilad ayaa ka dhacday server-ka AI-ga. Fadlan mar kale isku day waxyar ka dib.";
    }

    return "Raalli ahow, hadda ma awoodo inaan bixiyo faallooyinka AI sababo farsamo awgeed. Fadlan mar kale isku day waxyar ka dib.";
  }
};
