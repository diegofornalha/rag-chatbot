"use client";

import { Loader2 } from "lucide-react";
import { useModelSelection } from "@/hooks/useModelSelection";
import { GeminiConfig } from "./gemini-config";
import { GroqConfig } from "./groq-config";
import { DocumentUpload } from "./document-upload";
import { nanoid } from "ai";
import { useState } from "react";
import { FileText } from "lucide-react";

interface Props {
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
  messages: any[];
  setMessages: (messages: any[]) => void;
}

export function MultimodalInput({ input, setInput, handleSubmit, isLoading, messages, setMessages }: Props) {
  const { selectedModel, handleModelClick } = useModelSelection();
  const [jsonContent, setJsonContent] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ id: string; name: string; scope?: string } | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (jsonContent) {
        handleJsonUpload();
        return;
      }
      const formEvent = new Event("submit", { bubbles: true, cancelable: true }) as unknown as React.FormEvent<HTMLFormElement>;
      handleSubmit(formEvent);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Verifica comandos especiais
    if (value.trim() === "/documentos" || value.trim() === "/docs") {
      listDocuments();
      return;
    }

    if (value.trim() === "/clear") {
      setSelectedDocument(null);
      handleStatusUpdate("🔄 **Foco do documento removido**\nA conversa agora é geral.");
      setInput("");
      return;
    }

    // Verifica se é um comando para ver conteúdo de documento
    if (value.trim().startsWith("ID:")) {
      const documentId = value.trim().replace("ID:", "").trim();
      getDocumentContent(documentId);
      return;
    }
    
    // Tenta detectar se o conteúdo é JSON
    try {
      if (value.trim().startsWith('{') && value.trim().endsWith('}')) {
        const parsed = JSON.parse(value);
        setJsonContent(value);
        console.log('📋 JSON detectado:', parsed);
      } else {
        setJsonContent(null);
      }
    } catch {
      setJsonContent(null);
    }
  };

  const listDocuments = async () => {
    try {
      handleStatusUpdate("🔍 **Buscando documentos...**");
      
      const response = await fetch("/api/proxy", {
        method: 'GET',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📚 Lista de documentos:', data);

      if (!data.documents || data.documents.length === 0) {
        handleStatusUpdate("ℹ️ **Nenhum documento encontrado**\nUse o botão de upload ou cole um JSON para adicionar documentos.");
        return;
      }

      const documentList = data.documents
        .map((doc: any) => `- **${doc.name}**\n  ID: [${doc.id}](command:focus:${doc.id})\n  Status: ${doc.status}\n  Chunks: ${doc.chunk_count || 'N/A'}\n  Escopo: ${doc.metadata?.scope || 'N/A'}`)
        .join("\n\n");

      handleStatusUpdate(`📚 **Documentos Disponíveis**\n\n${documentList}\n\n_Clique no ID do documento para focar a conversa nele_`);
    } catch (error) {
      console.error('❌ Erro ao listar documentos:', error);
      handleStatusUpdate(`❌ **Erro ao listar documentos**\n${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
    setInput("");
  };

  const checkDocumentStatus = async (documentId: string) => {
    setIsChecking(true);
    try {
      const response = await fetch(`/api/proxy/${documentId}`, {
        method: 'GET',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Erro ${response.status}: ${response.statusText}`);
      }

      const doc = await response.json();
      console.log('📋 Status do documento:', doc);
      
      const statusMessage = `ℹ️ **Status atualizado do documento**\n- Nome: ${doc.name}\n- ID: ${doc.id}\n- Status: ${doc.status}${doc.chunk_count ? `\n- Chunks: ${doc.chunk_count}` : ''}`;
      handleStatusUpdate(statusMessage);
      
      // Se ainda estiver processando, verifica novamente em 2 segundos
      if (doc.status === "partitioning") {
        setTimeout(() => checkDocumentStatus(documentId), 2000);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      handleStatusUpdate(`❌ Erro ao verificar status do documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleJsonUpload = async () => {
    if (!jsonContent) return;

    console.log('🚀 Iniciando upload do JSON colado');
    handleStatusUpdate("📤 **Preparando upload do JSON...**");
    
    try {
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const file = new File([blob], 'document.json', { type: 'application/json' });
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", JSON.stringify({ scope: "json-from-chat" }));
      formData.append("mode", "fast");

      handleStatusUpdate(`📤 **Upload iniciado**\n- Arquivo: document.json\n- Tamanho: ${(blob.size / 1024).toFixed(2)} KB\n- Tipo: application/json`);

      const response = await fetch("/api/proxy", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Upload do JSON concluído:', data);
      
      const successMessage = `✅ **Upload do JSON concluído com sucesso!**\n- ID: ${data.id}\n- Status: ${data.status}\n\nO documento está sendo processado e em breve estará disponível para consulta.`;
      handleStatusUpdate(successMessage);

      // Aguarda 2 segundos e verifica o status real
      setTimeout(() => checkDocumentStatus(data.id), 2000);

      setInput("");
      setJsonContent(null);
    } catch (error) {
      console.error('❌ Erro no upload do JSON:', error);
      const errorMessage = `❌ **Erro no upload do JSON**\n- Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      handleStatusUpdate(errorMessage);
    }
  };

  const handleStatusUpdate = (message: string) => {
    setMessages([
      ...messages,
      {
        id: nanoid(),
        role: "system",
        content: message,
        onClick: async (href: string) => {
          if (href.startsWith('command:focus:')) {
            const documentId = href.replace('command:focus:', '');
            // Feedback imediato ao clicar
            setMessages(prev => [...prev, {
              id: nanoid(),
              role: "system",
              content: `🎯 **Focando conversa no documento ${documentId}...**`
            }]);
            // Busca os detalhes do documento
            await focusOnDocument(documentId);
          } else if (href.startsWith('command:ID:')) {
            const documentId = href.replace('command:ID:', '');
            // Feedback imediato ao clicar
            setMessages(prev => [...prev, {
              id: nanoid(),
              role: "system",
              content: `🔍 **Buscando conteúdo do documento ${documentId}...**`
            }]);
            // Busca o conteúdo
            await getDocumentContent(documentId);
          }
        }
      }
    ]);
  };

  const focusOnDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/proxy/${documentId}`, {
        method: 'GET',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Erro ${response.status}: ${response.statusText}`);
      }

      const doc = await response.json();
      setSelectedDocument({
        id: doc.id,
        name: doc.name,
        scope: doc.metadata?.scope
      });

      handleStatusUpdate(`🎯 **Conversa focada no documento:**\n- Nome: ${doc.name}\n- Escopo: ${doc.metadata?.scope || 'N/A'}\n\n_Digite suas perguntas sobre este documento. Use /clear para limpar o foco._`);
    } catch (error) {
      console.error('❌ Erro ao focar documento:', error);
      handleStatusUpdate(`❌ **Erro ao focar no documento**\n${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setSelectedDocument(null);
    }
  };

  const getDocumentContent = async (documentId: string) => {
    try {
      // Remove o feedback inicial pois já foi mostrado no onClick
      const response = await fetch(`/api/proxy/${documentId}?action=content`, {
        method: 'GET',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });

      const responseData = await response.json();
      console.log('📄 Resposta da API:', {
        ok: response.ok,
        status: response.status,
        data: responseData
      });

      if (!response.ok) {
        throw new Error(responseData.detail || `Erro ${response.status}: ${response.statusText}`);
      }

      if (!responseData.scored_chunks || responseData.scored_chunks.length === 0) {
        handleStatusUpdate("❌ **Nenhum conteúdo encontrado para este documento**");
        return;
      }

      const content = responseData.scored_chunks
        .map((chunk: any) => chunk.text)
        .join("\n\n");

      // Formata as informações do documento
      const docInfo = responseData.document;
      const documentInfo = [
        `📄 **${docInfo.name}**`,
        `- ID: \`${docInfo.id}\``,
        `- Status: ${docInfo.status}`,
        docInfo.metadata?.scope ? `- Escopo: ${docInfo.metadata.scope}` : '',
        '',
        '**Conteúdo:**',
        '```',
        content,
        '```'
      ].filter(Boolean).join('\n');

      handleStatusUpdate(documentInfo);
    } catch (error) {
      console.error('❌ Erro ao buscar conteúdo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      handleStatusUpdate(`❌ **Erro ao buscar conteúdo do documento**\n${errorMessage}`);
    }
    setInput("");
  };

  return (
    <div className="p-4 border-t">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {selectedDocument && (
          <div className="text-sm text-gray-500 flex items-center gap-2 px-2">
            <span>📄 Documento: <strong>{selectedDocument.name}</strong></span>
            <button
              type="button"
              onClick={() => {
                setSelectedDocument(null);
                handleStatusUpdate("🔄 **Foco do documento removido**\nA conversa agora é geral.");
              }}
              className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
            >
              Limpar foco
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleModelClick("groq")}
            className={`p-2 rounded-lg ${
              selectedModel === "groq"
                ? "bg-red-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Groq
          </button>
          <button
            type="button"
            onClick={() => handleModelClick("gemini")}
            className={`p-2 rounded-lg ${
              selectedModel === "gemini"
                ? "bg-red-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Gemini
          </button>
          <DocumentUpload onStatusUpdate={handleStatusUpdate} />
          <button
            type="button"
            onClick={() => {
              listDocuments();
              setInput("");
            }}
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            title="Listar documentos"
          >
            <FileText className="h-4 w-4" />
          </button>
          {selectedModel === "gemini" && <GeminiConfig />}
          {selectedModel === "groq" && <GroqConfig />}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={jsonContent ? "Pressione Enter para enviar o JSON..." : "Digite sua mensagem..."}
            className={`flex-1 p-2 rounded-lg border ${jsonContent ? 'bg-blue-50' : ''}`}
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !jsonContent)}
            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            onClick={(e) => {
              if (jsonContent) {
                e.preventDefault();
                handleJsonUpload();
              }
            }}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : jsonContent ? (
              "Enviar JSON"
            ) : (
              "Enviar"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
