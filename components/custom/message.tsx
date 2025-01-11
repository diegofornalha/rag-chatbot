"use client";

import { Message as AIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { ModelType } from "@/hooks/useModelSelection";

interface MessageProps extends Omit<AIMessage, 'model'> {
  model?: ModelType;
  id: string;
}

export function Message({ role, content, model, id }: MessageProps) {
  return (
    <div key={id} className={`flex flex-col ${role === "user" ? "items-end" : ""} gap-2`}>
      <div className={`rounded-lg p-3 max-w-md ${
        role === "user" ? "bg-red-500 text-white" : "bg-gray-100"
      }`}>
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{content || ''}</ReactMarkdown>
        </div>
        {role === "assistant" && model && (
          <div className="text-xs text-right mt-1 opacity-70">
            {model}
          </div>
        )}
      </div>
    </div>
  );
}
