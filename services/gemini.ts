import { GoogleGenAI } from "@google/genai";

// Read API key from Vite env (preferred) or older env vars for compatibility
const API_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY)
  || (typeof window !== 'undefined' && (window as any).__VITE_API_KEY__)
  || '';

let ai: any = null;
if (!API_KEY) {
  // Не бросаем ошибку — просто логируем, чтобы приложение не падало в браузере
  // Библиотека @google/genai требует ключ при инициализации в браузере —
  // поэтому оставим ai = null и обработаем это в функциях ниже.
  // eslint-disable-next-line no-console
  console.warn('Google GenAI API key not set. Set VITE_API_KEY to enable AI features.');
} else {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const generateProductDescription = async (title: string, author: string | undefined, category: string) => {
  try {
    if (!ai) {
      // AI не инициализирован — возвращаем понятное сообщение, не бросая ошибку
      return 'Генерация описания недоступна: не настроен API ключ.';
    }
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
        if (!ai) {
            return 'Чат недоступен: не настроен API ключ.';
        }
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