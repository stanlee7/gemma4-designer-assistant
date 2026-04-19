import { InitProgressReport } from "@mlc-ai/web-llm";
import styles from "./Onboarding.module.css";

interface Props {
  progress: InitProgressReport | null;
  onSelectModel?: (modelId: string) => void;
  selectedModel?: string | null;
}

export default function Onboarding({ progress, onSelectModel, selectedModel }: Props) {
  // If model is selected, show downloading process UI
  if (selectedModel) {
    const percentage = progress ? Math.round(progress.progress * 100) : 0;
    
    return (
      <div className={styles.onboardingContainer}>
        <div className={styles.onboardingContent}>
          <h1 className={styles.title}>AI Designer Assistant</h1>
          <p className={styles.subtitle}>
            선택된 모델을 환경에 불러오고 있습니다... ({selectedModel.includes("4b") ? "4B" : "2B"})
          </p>
          
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar} style={{ width: `${percentage}%` }}></div>
          </div>
          <p className={styles.progressText}>{progress?.text || "초기화 중..."}</p>
        </div>
      </div>
    );
  }

  // Model selection UI
  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingContent}>
        <h1 className={styles.title}>AI Designer Assistant</h1>
        <p className={styles.subtitle}>사용할 챗봇 모델 성능을 선택해주세요.</p>
        
        <div className={styles.modelSelection}>
          <div 
            className={styles.modelCard}
            onClick={() => onSelectModel?.("gemma-3-4b-it-q4f16_1-MLC")}
          >
            <span className={styles.recommendBadge}>베스트 (추천)</span>
            <div className={styles.modelTitle}>Gemma 3 - 4B 모델</div>
            <div className={styles.modelDesc}>
              뛰어난 한국어 이해력과 자연스러운 문장 생성을 제공합니다.<br/>
              (높은 VRAM 요구 / 약 2.5GB 파일 다운로드)
            </div>
          </div>
          
          <div 
            className={styles.modelCard}
            onClick={() => onSelectModel?.("gemma-2b-it-q4f32_1-MLC")}
          >
            <div className={styles.modelTitle}>Gemma - 2B (빠른 작동)</div>
            <div className={styles.modelDesc}>
              상대적으로 적은 용량으로 빠르게 구동할 수 있습니다.<br/>
              (저사양 환경 추천 / 가벼운 답변 품질)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
