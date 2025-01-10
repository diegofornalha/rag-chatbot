"use client";

import { Attachment, Message } from "ai";
import { useChat } from "ai/react";
import { useState } from "react";

import { Message as PreviewMessage } from "@/components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";

import DotsLoader from "./dot-loader";
import { BotIcon, UserIcon } from "./icons";
import { MultimodalInput } from "./multimodal-input";

export function Chat({
  id,
  initialMessages = [],
}: {
  id?: string;
  initialMessages?: Array<Message>;
}) {
  const { messages: chatMessages, handleSubmit, input, setInput, append, isLoading, stop } =
    useChat({
      body: { id },
      initialMessages,
      onError(error) {
        append({
          id: Date.now().toString(),
          role: "assistant",
          content: "Desculpe, houve um erro ao processar sua mensagem. Por favor, tente novamente.",
        });
      },
    });

  // Ensure messages is always an array
  const messages = Array.isArray(chatMessages) ? chatMessages : [];

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <div className="flex flex-col h-screen">
      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto bg-gray-50" ref={messagesContainerRef}>
        <div className="max-w-2xl mx-auto">
          <div className="py-2 space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`px-4 py-2 ${
                  message.role === "assistant"
                    ? "bg-white"
                    : "bg-gray-50"
                }`}
              >
                <div className={`max-w-2xl mx-auto flex ${
                  message.role === "user" ? "justify-end" : ""
                }`}>
                  <div className={`flex gap-2 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}>
                    <div className="size-[20px] shrink-0 text-gray-400 self-start mt-1">
                      {message.role === "user" ? <UserIcon /> : <BotIcon />}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.role === "user" 
                        ? "bg-blue-500 text-white" 
                        : "bg-white"
                    }`}>
                      <PreviewMessage
                        role={message.role}
                        content={message.content}
                        attachments={message.experimental_attachments}
                        toolInvocations={message.toolInvocations}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="px-4 py-2 bg-white">
                <div className="max-w-2xl mx-auto flex">
                  <div className="flex gap-2">
                    <div className="size-[20px] shrink-0 text-gray-400 self-start mt-1">
                      <BotIcon />
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <DotsLoader />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>
      </div>

      {/* Área de input fixa */}
      <div className="bg-white border-t mt-auto">
        <div className="max-w-2xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="min-h-[72px]">
            <MultimodalInput
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              append={append}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
