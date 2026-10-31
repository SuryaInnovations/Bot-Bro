"use client";

import React, { useEffect, useRef } from "react";
import { Message, Artifact } from "@/types";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  onRegenerate: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onFeedback: (messageId: string, feedback: "positive" | "negative") => void;
  onOpenArtifact: (artifact: Partial<Artifact>) => void;
  onSelectSuggestion?: (prompt: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
  onRegenerate,
  onEditMessage,
  onFeedback,
  onOpenArtifact,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Exclude any legacy welcome message boilerplate so it is never displayed in the message stream
  const displayedMessages = (messages || []).filter(
    (m) =>
      m.id !== "welcome-msg-1" &&
      !m.content?.includes("Here are some of the things you can do with NOVA AI")
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      {displayedMessages.map((message, index) => (
        <MessageItem
          key={message.id || index}
          message={message}
          isStreaming={isStreaming && index === displayedMessages.length - 1}
          onRegenerate={index === displayedMessages.length - 1 ? onRegenerate : undefined}
          onEdit={(newContent) => onEditMessage(message.id, newContent)}
          onFeedback={(feedback) => onFeedback(message.id, feedback)}
          onOpenArtifact={onOpenArtifact}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
};
