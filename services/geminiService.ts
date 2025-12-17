import { GoogleGenAI, Type } from "@google/genai";
import { Player, Quest, RoleType } from "../types";

const QUEST_PROMPT = `
Buatlah quest bertahan hidup yang unik untuk pemain dalam game pixel art survival.
Konteks Dunia: Dunia pasca-apokaliptik yang dipenuhi zombie dan penjarah.
Bahasa: Indonesia.
Berikan judul yang menarik, deskripsi singkat, target yang harus dilakukan, dan hadiah imajiner.
`;

export const generateQuest = async (player: Player): Promise<Quest> => {
  if (!process.env.API_KEY) {
    // Fallback if no API key
    return {
      id: Date.now().toString(),
      title: "Mencari Persediaan (Offline)",
      description: "Temukan makanan dan senjata untuk bertahan hidup.",
      target: "Kumpulkan 5 Apel",
      reward: "Exp & Reputasi",
      completed: false
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const roleName = player.role;
    const hpStatus = player.hp < 50 ? "Terluka Parah" : "Sehat";
    
    const prompt = `${QUEST_PROMPT}
    Status Pemain:
    - Peran: ${roleName}
    - Kondisi: ${hpStatus}
    - Level: ${player.level}
    
    Output JSON only.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            target: { type: Type.STRING },
            reward: { type: Type.STRING }
          },
          required: ["title", "description", "target", "reward"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");

    return {
      id: Date.now().toString(),
      title: data.title || "Misi Misterius",
      description: data.description || "Bertahan hidup dengan segala cara.",
      target: data.target || "Bertahan Hidup",
      reward: data.reward || "Loot Misterius",
      completed: false
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      id: Date.now().toString(),
      title: "Gangguan Sinyal",
      description: "Gagal menghubungi markas pusat (AI Error). Lanjutkan survival.",
      target: "Tetap Hidup",
      reward: "Pengalaman",
      completed: false
    };
  }
};
