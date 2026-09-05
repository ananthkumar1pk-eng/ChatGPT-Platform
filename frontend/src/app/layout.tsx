import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";

export const metadata: Metadata = {
  title: "ChatGPT Platform — Next-Gen Hosted AI Workspace",
  description: "Modern deployable multi-user ChatGPT platform powered by hosted LLMs and multi-format document RAG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-50 dark:bg-[#212121] text-slate-900 dark:text-[#ececec] min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
