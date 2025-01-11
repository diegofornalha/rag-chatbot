"use client";

import { Loader2 } from "lucide-react";
import { useModelSelection } from "@/hooks/useModelSelection";
import { GeminiConfig } from "./gemini-config";
import { GroqConfig } from "./groq-config";

interface Props {
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
}

export function MultimodalInput({ input, setInput, handleSubmit, isLoading }: Props) {
  const { selectedModel, handleModelClick } = useModelSelection();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const formEvent = new Event("submit", { bubbles: true, cancelable: true }) as unknown as React.FormEvent<HTMLFormElement>;
      handleSubmit(formEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 bg-white border-t">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleModelClick("groq")}
          className={`px-4 py-2 rounded-md ${
            selectedModel === "groq"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Groq
        </button>
        {selectedModel === "groq" && <GroqConfig />}
        
        <button
          type="button"
          onClick={() => handleModelClick("gemini")}
          className={`px-4 py-2 rounded-md ${
            selectedModel === "gemini"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Gemini
        </button>
        {selectedModel === "gemini" && <GeminiConfig />}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          rows={1}
          className="flex-1 resize-none rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Enviar"
          )}
        </button>
      </div>
    </form>
  );
}
