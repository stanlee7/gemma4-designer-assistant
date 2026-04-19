import { useState, useCallback, useEffect } from "react";

export interface ChatSession {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
  pdfContext: string | null;
  pdfFileName: string | null;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "ai-designer-chat-history";

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn("localStorage save failed:", e);
  }
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      setActiveId(loaded[0].id);
    }
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId) || null;

  const createSession = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: "새 대화",
      messages: [
        {
          role: "assistant",
          content:
            "안녕하세요! 저는 AI 디자이너 커리어 어시스턴트입니다.\n포트폴리오 리뷰, 이력서 피드백, 면접 준비 등 무엇이든 도와드릴게요!",
        },
      ],
      pdfContext: null,
      pdfFileName: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveId(newSession.id);
    saveSessions(updated);
    return newSession.id;
  }, [sessions]);

  const updateSession = useCallback(
    (id: string, patch: Partial<ChatSession>) => {
      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== id) return s;
          const merged = { ...s, ...patch, updatedAt: Date.now() };
          // Auto-generate title from first user message
          if (
            merged.title === "새 대화" &&
            merged.messages.length >= 2
          ) {
            const firstUser = merged.messages.find((m) => m.role === "user");
            if (firstUser) {
              merged.title =
                firstUser.content.length > 30
                  ? firstUser.content.slice(0, 30) + "..."
                  : firstUser.content;
            }
          }
          return merged;
        });
        saveSessions(updated);
        return updated;
      });
    },
    []
  );

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        saveSessions(updated);
        return updated;
      });
      if (activeId === id) {
        setSessions((prev) => {
          if (prev.length > 0) setActiveId(prev[0].id);
          else setActiveId(null);
          return prev;
        });
      }
    },
    [activeId]
  );

  const switchSession = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  return {
    sessions,
    activeSession,
    activeId,
    createSession,
    updateSession,
    deleteSession,
    switchSession,
  };
}
