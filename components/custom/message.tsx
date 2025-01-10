"use client";

import { Attachment } from "ai";
import { BotIcon, UserIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  args?: Record<string, any>;
  state: "running" | "result" | "partial-call";
  result?: any;
}

export function Message({
  role,
  content,
  attachments,
  toolInvocations,
}: {
  role: string;
  content: string;
  attachments?: Array<Attachment>;
  toolInvocations?: Array<ToolInvocation>;
}) {
  return (
    <div className={`prose break-words ${role === "user" ? "text-white prose-invert" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ node, children, ...props }) => (
            <div className="relative">
              <pre {...props}>{children}</pre>
            </div>
          ),
          code: ({ node, children, ...props }) => (
            <code {...props}>{children}</code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      {attachments && attachments.length > 0 && (
        <div className="flex flex-row gap-2">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}
        </div>
      )}

      {toolInvocations && toolInvocations.length > 0 && (
        <div className="space-y-2">
          {toolInvocations.map((invocation, index) => (
            <div key={index}>
              {invocation.toolName === "getWeather" && invocation.state === "result" && (
                <div>Weather: {JSON.stringify(invocation.result)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
