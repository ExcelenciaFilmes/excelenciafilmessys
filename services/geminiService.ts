import { GoogleGenAI, Type, Modality } from '@google/genai';
import { ChecklistItem } from '../types.ts';

const getAI = () => {
  // Use process.env.API_KEY directly as per @google/genai guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateChecklist = async (title: string, description: string): Promise<ChecklistItem[]> => {
  try {
    const ai = getAI();
    const prompt = `Para um projeto de vídeo com o título "${title}" e descrição "${description}", gere um checklist de produção. Separe as tarefas em "Pré-produção", "Produção" e "Pós-produção". Retorne SOMENTE o JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pre_producao: { type: Type.ARRAY, items: { type: Type.STRING } },
            producao: { type: Type.ARRAY, items: { type: Type.STRING } },
            pos_producao: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(response.text?.trim() || "{}");
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", response.text);
      throw new Error("A IA retornou uma resposta em um formato inválido.");
    }
    
    const checklistItems: ChecklistItem[] = [];
    
    if (jsonResponse.pre_producao) {
      jsonResponse.pre_producao.forEach((item: string) => {
        checklistItems.push({ id: `check-${Date.now()}-${Math.random()}`, text: `(Pré-produção) ${item}`, completed: false });
      });
    }
    if (jsonResponse.producao) {
      jsonResponse.producao.forEach((item: string) => {
        checklistItems.push({ id: `check-${Date.now()}-${Math.random()}`, text: `(Produção) ${item}`, completed: false });
      });
    }
    if (jsonResponse.pos_producao) {
      jsonResponse.pos_producao.forEach((item: string) => {
        checklistItems.push({ id: `check-${Date.now()}-${Math.random()}`, text: `(Pós-produção) ${item}`, completed: false });
      });
    }

    return checklistItems;
  } catch (error) {
    console.error("Erro na API Gemini:", error);
    // Retorna array vazio em caso de erro para não quebrar a UI
    return [];
  }
};


export const generateScript = async (title: string, description: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `Escreva um roteiro curto para um vídeo com o título "${title}". A descrição do vídeo é: "${description}". O roteiro deve ser conciso, direto e pronto para gravação. Formate com indicações de cena e diálogo.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o texto.";
  } catch (error) {
    console.error("Erro ao gerar roteiro:", error);
    return "Erro ao gerar roteiro. Verifique a chave da API.";
  }
};


export const generateImage = async (title: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `Uma imagem de conceito cinematográfica para um vídeo chamado "${title}". Alta qualidade, arte digital, thumbnail para YouTube.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content?.parts) {
        throw new Error(`A geração de imagem falhou.`);
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error("Nenhuma imagem retornada.");
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    throw error;
  }
};
