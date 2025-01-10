import { nanoid } from "ai";
import { Chat } from "@/components/custom/chat";
import { Message } from "ai";

export const runtime = "edge";

export default function IndexPage() {
  const id = nanoid();
  const initialMessages: Message[] = [];

  return <Chat id={id} initialMessages={initialMessages} />;
}
