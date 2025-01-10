"use client";

import { useEffect, useState } from "react";
import { Message } from "ai";
import { Chat } from "./chat";

interface ChatLoaderProps {
  id: string;
  initialMessages?: Array<Message>;
}

export function ChatLoader({ id, initialMessages = [] }: ChatLoaderProps) {
  const [messages, setMessages] = useState<Array<Message>>(initialMessages);

  useEffect(() => {
    // Se não há mensagens iniciais, tentar carregar do localStorage
    if (initialMessages.length === 0) {
      const history = localStorage.getItem("chatHistory");
      if (history) {
        const parsedHistory = JSON.parse(history);
        if (parsedHistory[id]) {
          setMessages(parsedHistory[id]);
        }
      }
    }
  }, [id, initialMessages]);

  return <Chat id={id} initialMessages={messages} />;
} 