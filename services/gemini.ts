import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (title: string, author: string | undefined, category: string) => {
  try {
    const prompt = `Напиши привлекательное, продающее описание для товара на маркетплейсе.
    Название: ${title}
    ${author ? `Автор: ${author}` : ''}
    Категория: ${category}
    Язык: Русский.
    Длина: 2-3 предложения. Выдели ключевые преимущества.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Не удалось сгенерировать описание. Пожалуйста, попробуйте позже.";
  }
};

export const chatWithAssistant = async (history: {role: 'user' | 'model', text: string}[], message: string) => {
    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
            config: {
                systemInstruction: "Ты полезный консультант книжного онлайн-магазина. Ты помогаешь выбирать книги и канцтовары. Ты вежлив, используешь эмодзи и отвечаешь кратко и по делу. Предлагай товары из ассортимента магазина, если это уместно."
            }
        });
        
        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Chat Error", error);
        return "Извините, я сейчас не могу ответить. Попробуйте позже.";
    }
}