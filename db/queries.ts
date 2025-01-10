"server-only";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function saveChat({
  id,
  messages,
}: {
  id: string;
  messages: any;
}) {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id },
    });

    if (chat) {
      return await prisma.chat.update({
        where: { id },
        data: {
          messages: JSON.stringify(messages),
        },
      });
    }

    return await prisma.chat.create({
      data: {
        id,
        messages: JSON.stringify(messages),
      },
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await prisma.chat.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChats() {
  try {
    return await prisma.chat.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error("Failed to get chats from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    return await prisma.chat.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}
