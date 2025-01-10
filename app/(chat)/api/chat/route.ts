import { convertToCoreMessages, Message, streamText } from "ai";

import { customModel } from "@/ai";
import { deleteChatById, saveChat } from "@/db/queries";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  try {
    const lastMessage = messages[messages.length - 1].content;

    // Buscar contexto do Ragie
    const ragieResponse = await fetch("https://api.ragie.ai/retrievals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RAGIE_API_KEY}`,
      },
      body: JSON.stringify({
        rerank: true,
        top_k: 6,
        max_chunks_per_document: 4,
        query: lastMessage,
      }),
    });

    if (!ragieResponse.ok) {
      console.error(
        `Falha ao buscar dados da API Ragie: ${ragieResponse.status} ${ragieResponse.statusText}`
      );
      throw new Error("Falha ao buscar contexto do Ragie");
    }

    const ragieData = await ragieResponse.json();
    const contextChunks = ragieData.scored_chunks.map(
      (chunk: { text: string }) => chunk.text
    );

    // Gerar resposta com GROQ
    const coreMessages = convertToCoreMessages([
      {
        role: "system",
        content: `Você é um assistente virtual prestativo e amigável que SEMPRE responde em português do Brasil.

Instruções importantes:
1. Use SEMPRE português do Brasil em suas respostas
2. Mantenha um tom profissional mas acolhedor
3. Use o contexto abaixo para responder às perguntas do usuário
4. Se não encontrar a informação no contexto, diga que não tem essa informação específica
5. Evite inventar informações que não estejam no contexto

Contexto para suas respostas:
${contextChunks.join("\n\n")}`,
      },
      ...messages,
    ]);

    const stream = await streamText({
      model: customModel,
      messages: coreMessages,
    });

    const assistantMessage = {
      role: "assistant",
      content: stream.toString(),
    };

    await saveChat({
      id,
      messages: JSON.stringify([...messages, assistantMessage]),
    });

    return stream.toDataStreamResponse({});
  } catch (error) {
    console.error("Erro ao gerar resposta:", error);
    return new Response("Erro ao gerar resposta", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { id } = await request.json();

  try {
    await deleteChatById({ id });
    return new Response("Operação concluída");
  } catch (error) {
    return new Response("Erro ao excluir conversa", { status: 500 });
  }
}
