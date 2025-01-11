import { StreamingTextResponse } from "ai";
import { createGroqModel } from "@/ai";
import { createGeminiModel } from "@/ai/gemini";

const SYSTEM_PROMPT = `Você é um assistente prestativo e amigável. Suas respostas devem ser claras, precisas e em português do Brasil. Mantenha um tom profissional mas acolhedor.`;

async function getContextFromRagie(query: string) {
  try {
    const response = await fetch("https://ragie.fly.dev/api/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.warn("Falha ao buscar dados da API Ragie:", response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data.chunks || [];
  } catch (error) {
    console.warn("Falha ao buscar dados da API Ragie:", error);
    return [];
  }
}

export async function POST(req: Request) {
  interface RequestData {
    messages: any[];
    data?: {
      model?: string;
      geminiKey?: string;
      groqKey?: string;
    };
  }

  let requestData: RequestData = { messages: [] };
  try {
    // Extrai os dados da requisição
    requestData = await req.json();
    const { messages, data } = requestData;
    const { model = 'groq', geminiKey, groqKey } = data || {};

    // Obtém o último input do usuário
    const lastUserMessage = messages.findLast((m: any) => m.role === "user");
    if (!lastUserMessage) {
      throw new Error("Nenhuma mensagem do usuário encontrada");
    }

    // Valida as chaves de API
    if (model === 'gemini' && (!geminiKey || geminiKey.length < 10)) {
      throw new Error("Chave API Gemini inválida ou não fornecida");
    }
    if (model === 'groq' && (!groqKey || !groqKey.startsWith('gsk_'))) {
      throw new Error("Chave API Groq inválida ou não fornecida");
    }

    // Busca contexto da Ragie API
    const contextChunks = await getContextFromRagie(lastUserMessage.content);
    const context = contextChunks.map((chunk: any) => chunk.content).join("\n");

    // Cria a mensagem do sistema com o contexto
    const systemMessage = {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\nContexto relevante:\n${context}`,
    };

    // Prepara as mensagens para o modelo
    const allMessages = [systemMessage, ...messages];

    // Seleciona o modelo apropriado
    let selectedModel;
    try {
      if (model === 'gemini') {
        if (!geminiKey) throw new Error("Chave API Gemini não fornecida");
        selectedModel = createGeminiModel(geminiKey);
      } else {
        if (!groqKey) throw new Error("Chave API Groq não fornecida");
        selectedModel = createGroqModel(groqKey);
      }
    } catch (error: any) {
      throw new Error(`Erro ao inicializar modelo ${model}: ${error.message}`);
    }

    // Gera a resposta
    const response = await selectedModel.invoke(allMessages);

    // Garante que a resposta é um ReadableStream
    if (response && response instanceof ReadableStream) {
      return new StreamingTextResponse(response);
    } else if (response && typeof response === 'object' && 'body' in response) {
      const stream = (response as Response).body;
      if (!stream) {
        throw new Error("Resposta sem corpo");
      }
      return new StreamingTextResponse(stream);
    } else {
      throw new Error("Resposta inválida do modelo");
    }

  } catch (error: any) {
    console.error("Erro na rota de chat:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao processar mensagem",
        model: requestData?.data?.model || 'groq'
      }),
      { 
        status: error.message?.includes("API") ? 401 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Função auxiliar para salvar o chat
async function saveChat(data: { id: string; messages: any[] }) {
  // Implementação futura da persistência do chat
  return Promise.resolve();
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await saveChat({ id, messages: [] });
    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error("Erro ao deletar chat:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao deletar o chat" }),
      { status: 500 }
    );
  }
}
