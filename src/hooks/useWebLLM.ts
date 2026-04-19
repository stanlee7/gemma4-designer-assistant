import { useState, useEffect, useRef } from "react";
import { CreateWebWorkerMLCEngine, InitProgressReport, WebWorkerMLCEngine } from "@mlc-ai/web-llm";

export function useWebLLM(modelId: string | null) {
  const [engine, setEngine] = useState<WebWorkerMLCEngine | null>(null);
  const [progress, setProgress] = useState<InitProgressReport | null>(null);
  const [isReady, setIsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // If no model is selected yet, do not instantiate
    if (!modelId) return;

    // Prevent double instantiations in React strict mode for the same model
    if (workerRef.current) return;
    
    // We only want to instantiate the worker in the browser environment
    if (typeof window === "undefined") return;

    const initEngine = async () => {
      try {
        workerRef.current = new Worker(
          new URL("../worker/web-llm.worker.ts", import.meta.url),
          { type: "module" }
        );
        
        const newEngine = await CreateWebWorkerMLCEngine(
          workerRef.current,
          modelId,
          {
            initProgressCallback: (progressReport: InitProgressReport) => {
              setProgress(progressReport);
              if (progressReport.progress === 1) {
                setIsReady(true);
              }
            }
          }
        );
        
        setEngine(newEngine);
      } catch (err) {
        console.error("Failed to initialize WebLLM engine:", err);
      }
    };
    
    initEngine();
  }, [modelId]);

  return { engine, progress, isReady };
}
