import { useState, useCallback } from "react";

/** PDF.js를 동적으로 로드하여 PDF에서 텍스트를 추출하는 훅 */
export function usePDFParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const parsePDF = useCallback(async (file: File): Promise<string> => {
    setIsParsing(true);
    setFileName(file.name);

    try {
      // Dynamic import to avoid SSR issues
      const pdfjsLib = await import("pdfjs-dist");

      // Use the bundled worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ("str" in item ? item.str : ""))
          .join(" ");
        fullText += pageText + "\n\n";
      }

      return fullText.trim();
    } catch (err) {
      console.error("PDF parsing error:", err);
      throw new Error("PDF 파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const clearFile = useCallback(() => {
    setFileName(null);
  }, []);

  return { parsePDF, isParsing, fileName, clearFile };
}
