import { useState, useRef, useEffect, useCallback } from "react";
import { WebWorkerMLCEngine, ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import { ChatSession } from "@/hooks/useChatHistory";
import { usePDFParser } from "@/hooks/usePDFParser";
import styles from "./ChatUI.module.css";

interface Props {
  engine: WebWorkerMLCEngine;
  session: ChatSession;
  onUpdateSession: (id: string, patch: Partial<ChatSession>) => void;
  onMenuToggle: () => void;
}

const SYSTEM_PROMPT = `당신은 '디자이너 커리어 어시스턴트'입니다.
역할: UI/UX 디자이너, 그래픽 디자이너, 브랜드 디자이너 등 디자인 분야 종사자들의 커리어 성장을 돕는 전문 AI 코치

전문 분야:
- 포트폴리오 구성 및 피드백
- 이력서/자기소개서 작성 가이드
- 디자인 면접 준비 (행동 면접, 화이트보드 챌린지 등)
- 커리어 전환 및 성장 전략
- 프리랜스 vs 정규직 비교 상담
- 디자인 트렌드 및 업계 인사이트

응답 규칙:
1. 반드시 한국어로 답변합니다.
2. 전문적이면서도 친근한 톤을 사용합니다.
3. 구체적이고 실행 가능한 조언을 제공합니다.
4. 필요한 경우 실제 사례나 데이터를 들어 설명합니다.
5. 답변은 구조적으로 정리합니다 (번호 매기기, 소제목 등).
6. PDF 첨부 문서가 있으면 해당 내용을 분석하여 맞춤 피드백을 제공합니다.`;

export default function ChatUI({
  engine,
  session,
  onUpdateSession,
  onMenuToggle,
}: Props) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parsePDF, isParsing, fileName: parsingFileName } = usePDFParser();

  const messages = session.messages;

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const triggerAIResponse = async (
    messagesWithPlaceholder: ChatSession["messages"],
    overridePdfContext?: string | null,
    overridePdfFileName?: string | null
  ) => {
    setIsGenerating(true);

    try {
      // Build context messages
      const contextMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
      ];

      const activePdfContext = overridePdfContext !== undefined ? overridePdfContext : session.pdfContext;
      const activePdfFileName = overridePdfFileName !== undefined ? overridePdfFileName : session.pdfFileName;

      // Add PDF context if available
      if (activePdfContext && activePdfFileName) {
        contextMessages.push({
          role: "system",
          content: `[첨부 문서 내용 - "${activePdfFileName}"]\n\n${activePdfContext.slice(0, 4000)}`,
        } as ChatCompletionMessageParam);
      }

      // Filter out the last placeholder message to get actual history
      const historyToPass = messagesWithPlaceholder.slice(0, -1);
      
      // Filter out the hardcoded welcome message, as LLM chat templates expect the first message to be from 'user' or 'system'
      const validHistory = historyToPass.filter((m, i) => !(i === 0 && m.role === "assistant"));
      const historySlice = validHistory.slice(-10);

      contextMessages.push(
        ...historySlice.map((m) => ({ role: m.role, content: m.content } as ChatCompletionMessageParam))
      );

      const completion = await engine.chat.completions.create({
        stream: true,
        messages: contextMessages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
      });

      let reply = "";
      for await (const chunk of completion) {
        reply += chunk.choices[0]?.delta?.content || "";
        onUpdateSession(session.id, {
          messages: [
            ...messagesWithPlaceholder.slice(0, -1),
            { role: "assistant", content: reply },
          ],
        });
      }
    } catch (err) {
      console.error(err);
      onUpdateSession(session.id, {
        messages: [
          ...messagesWithPlaceholder.slice(0, -1),
          {
            role: "assistant",
            content:
              "⚠️ 응답 생성 중 오류가 발생했습니다. 브라우저 메모리가 부족하거나 모델에 문제가 생겼을 수 있습니다. 페이지를 새로고침 해주세요.",
          },
        ],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("PDF 파일만 업로드 가능합니다.");
      return;
    }

    try {
      const text = await parsePDF(file);
      
      const autoPrompt = `방금 업로드한 "${file.name}" 문서의 내용을 바탕으로 다음 5가지 항목(가독성, 어필도, 오탈자, 구성력, 개선점)을 진단하고 각각 10점 만점으로 점수를 매겨서 요약 리포트를 작성해주세요.`;

      const newMessages: ChatSession["messages"] = [
        ...messages,
        { role: "user", content: autoPrompt },
        { role: "assistant", content: "" },
      ];

      onUpdateSession(session.id, {
        pdfContext: text,
        pdfFileName: file.name,
        messages: newMessages,
      });

      await triggerAIResponse(newMessages, text, file.name);

    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF 처리 실패");
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePDF = () => {
    onUpdateSession(session.id, { pdfContext: null, pdfFileName: null });
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg = input.trim();
    setInput("");

    const newMessages: ChatSession["messages"] = [
      ...messages,
      { role: "user", content: userMsg },
      { role: "assistant", content: "" },
    ];

    onUpdateSession(session.id, { messages: newMessages });
    await triggerAIResponse(newMessages);
  };

  return (
    <div className={styles.chatContainer}>
      <header className={styles.header}>
        <button className={styles.menuBtn} onClick={onMenuToggle}>
          ☰
        </button>
        <div className={styles.headerTitle}>AI Designer Assistant</div>
        <span className={styles.modelBadge}>Gemma 3 · 4B</span>
      </header>

      <div className={styles.messagesArea} ref={scrollRef}>
        {messages.map((m, idx) => (
          <div key={idx} className={`${styles.message} ${styles[m.role]}`}>
            <div className={styles.bubble}>{m.content}</div>
          </div>
        ))}
      </div>

      {/* PDF context chip */}
      {session.pdfFileName && (
        <div className={styles.pdfChip}>
          <span className={styles.pdfChipIcon}>📄</span>
          <span className={styles.pdfChipName}>{session.pdfFileName}</span>
          <button className={styles.pdfChipRemove} onClick={removePDF}>
            ✕
          </button>
        </div>
      )}

      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <button
            className={`${styles.attachBtn} ${isParsing ? styles.attachBtnParsing : ""}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing || isGenerating}
            title="PDF 파일 첨부"
          >
            📎
          </button>
          <input
            type="text"
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                handleSend();
              }
            }}
            placeholder={
              isParsing ? "PDF 분석 중..." : "메시지를 입력하세요..."
            }
            disabled={isGenerating || isParsing}
          />
          <button
            className={styles.sendButton}
            onClick={handleSend}
            disabled={!input.trim() || isGenerating || isParsing}
          >
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
