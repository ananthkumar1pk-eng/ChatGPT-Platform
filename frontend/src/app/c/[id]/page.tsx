import React from "react";
import { ConversationClient } from "@/components/chat/ConversationClient";

export function generateStaticParams() {
  return [{ id: "default" }];
}

export default function ConversationPage() {
  return <ConversationClient />;
}

