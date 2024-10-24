import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { customModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { deleteChatById, getChatById, saveChat } from "@/db/queries";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const query = messages[0].content

  const ragie_response = await fetch("https://api.ragie.ai/retrievals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.RAGIE_API_KEY,
    },
    body: JSON.stringify({ rerank: false, top_k: 8, query }),
  });

  if (!ragie_response.ok) {
    console.error(
      `Failed to retrieve data from Ragie API: ${ragie_response.status} ${ragie_response.statusText}`
    );
    return;
  }

  const data = await ragie_response.json();
  const chunkText = data.scored_chunks.map((chunk:{text: string}) => chunk.text);
 
  const coreMessages = convertToCoreMessages(messages);

  const systemPrompt = `These are very important to follow:

    You are "Ragie AI", a professional but friendly AI chatbot working as an assitant to the user.

    Your current task is to help the user based on all of the information available to you shown below.
    Answer informally, directly, and concisely without a heading or greeting but include everything relevant. 
    Use richtext Markdown when appropriate including bold, italic, paragraphs, and lists when helpful.
    If using LaTeX, use double $$ as delimiter instead of single $. Use $$...$$ instead of parentheses.
    Organize information into multiple sections or points when appropriate.
    Don't include raw item IDs or other raw fields from the source.
    Don't use XML or other markup unless requested by the user.
    

    Here is all of the information available to answer the user:
    ===
    ${chunkText}
    ===

    If the user asked for a search and there are no results, make sure to let the user know that you couldn't find anything,
    and what they might be able to do to find the information they need.

    END SYSTEM INSTRUCTIONS`;

  const result = await streamText({
    model: customModel,
    messages: [...coreMessages, { role: "system", content: systemPrompt }],
    temperature: 2,
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [...coreMessages, ...responseMessages],
            userId: session.user.id,
          });
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
