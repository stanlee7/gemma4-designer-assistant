"use client";

import { useState, useEffect } from "react";
import { useWebLLM } from "@/hooks/useWebLLM";
import { useChatHistory } from "@/hooks/useChatHistory";
import Onboarding from "@/components/Onboarding";
import ChatUI from "@/components/ChatUI";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const { engine, progress, isReady } = useWebLLM(selectedModel);
  const {
    sessions,
    activeSession,
    activeId,
    createSession,
    updateSession,
    deleteSession,
    switchSession,
  } = useChatHistory();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-create first session once model is ready and no sessions exist
  useEffect(() => {
    if (isReady && sessions.length === 0) {
      createSession();
    }
  }, [isReady, sessions.length, createSession]);

  if (!isReady || !engine || !selectedModel) {
    return (
      <Onboarding 
        progress={progress} 
        onSelectModel={setSelectedModel} 
        selectedModel={selectedModel} 
      />
    );
  }

  const handleNewChat = () => {
    createSession();
    setSidebarOpen(false);
  };

  const handleSwitch = (id: string) => {
    switchSession(id);
    setSidebarOpen(false);
  };

  return (
    <>
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        isOpen={sidebarOpen}
        onNewChat={handleNewChat}
        onSwitch={handleSwitch}
        onDelete={deleteSession}
        onClose={() => setSidebarOpen(false)}
      />
      {activeSession ? (
        <ChatUI
          engine={engine}
          session={activeSession}
          onUpdateSession={updateSession}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
          }}
        >
          왼쪽 사이드바에서 새 대화를 시작해 주세요.
        </div>
      )}
    </>
  );
}
