"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const params = useParams();
  const documentId = params["documentId"] as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentInfo, setDocumentInfo] = useState<any>(null);

  useEffect(() => {
    async function loadDocument() {
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (response.ok) {
          const data = await response.json();
          setDocumentInfo(data);
        }
      } catch (error) {
        console.error("Erro ao carregar documento:", error);
      }
    }
    loadDocument();
  }, [documentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          documentId: documentId,
          history: messages
        })
      });

      if (!response.ok) throw new Error("Erro ao enviar mensagem");
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Chat</h1>
        <Card className="p-4">
          {documentInfo && (
            <div>
              <h3 className="font-semibold mb-2">{documentInfo.name}</h3>
              {documentInfo.metadata?.scope && (
                <p className="text-sm text-gray-600">Escopo: {documentInfo.metadata.scope}</p>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4 mb-4 min-h-[400px] max-h-[600px] overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 p-3 rounded-lg ${
              msg.role === "user"
                ? "bg-blue-100 ml-auto max-w-[80%]"
                : "bg-gray-100 mr-auto max-w-[80%]"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="text-center p-4">
            <p>Gerando resposta...</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta..."
          className="flex-1 p-2 border rounded-lg"
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          Enviar
        </Button>
      </form>
    </div>
  );
} 