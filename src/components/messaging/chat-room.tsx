"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/app/actions/messaging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

interface ChatRoomProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessageItem[];
}

export function ChatRoom({
  conversationId,
  currentUserId,
  initialMessages,
}: ChatRoomProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages.length]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          router.refresh();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, router]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const result = await sendMessageAction(conversationId, trimmed);
    setSending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <div className="flex h-[540px] flex-col rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-800 dark:text-amber-300">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>
          Never send game passwords, OTPs, or recovery codes in chat. Agree on
          a verified midman before paying.
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {initialMessages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No messages yet. Say hello and discuss the listing details.
          </p>
        ) : (
          initialMessages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                <span className="mb-1 text-[11px] text-muted-foreground">
                  {isMine ? "You" : msg.senderName}
                </span>
                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm ${
                    isMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !body.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
