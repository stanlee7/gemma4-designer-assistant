import { ChatSession } from "@/hooks/useChatHistory";
import styles from "./Sidebar.module.css";

interface Props {
  sessions: ChatSession[];
  activeId: string | null;
  isOpen: boolean;
  onNewChat: () => void;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function Sidebar({
  sessions,
  activeId,
  isOpen,
  onNewChat,
  onSwitch,
  onDelete,
  onClose,
}: Props) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`${styles.sidebarOverlay} ${isOpen ? styles.open : ""}`}
        onClick={onClose}
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>AI</div>
            <span>Assistant</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className={styles.newChatBtn} onClick={onNewChat}>
              + 새 대화
            </button>
            <button className={styles.closeSidebar} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className={styles.sessionList}>
          {sessions.length === 0 ? (
            <div className={styles.emptyState}>
              대화 기록이 없습니다.<br />
              새 대화를 시작해 보세요!
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`${styles.sessionItem} ${
                  s.id === activeId ? styles.sessionItemActive : ""
                }`}
                onClick={() => onSwitch(s.id)}
              >
                <span className={styles.sessionTitle}>{s.title}</span>
                <span className={styles.sessionDate}>
                  {formatDate(s.updatedAt)}
                </span>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s.id);
                  }}
                  title="삭제"
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
