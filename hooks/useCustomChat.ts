"use client";

import { Message } from "ai";
import { useChat } from "ai/react";
import { useCallback } from "react";
import { toast } from "sonner";
import { useModelSelection } from "./useModelSelection";

interface UseCustomChatProps {
  initialMessages?: Message[];
  id?: string;
}

export function useCustomChat({ initialMessages = [], id }: UseCustomChatProps = {}) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: chatSubmit,
    setInput,
    isLoading,
    stop,
    setMessages
  } = useChat({
    initialMessages,
    id
  });

  const { selectedModel, getModelOptions } = useModelSelection();

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!input.trim()) {
        return;
      }

      try {
        const modelOptions = getModelOptions();
        await chatSubmit(e, {
          data: modelOptions
        });
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Erro ao enviar mensagem. Por favor, tente novamente.");
      }
    },
    [chatSubmit, input, getModelOptions]
  );

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
    isLoading,
    stop,
    setMessages
  };
} 