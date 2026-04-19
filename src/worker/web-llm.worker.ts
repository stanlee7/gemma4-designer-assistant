import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// Instantiate the handler
const handler = new WebWorkerMLCEngineHandler();

// Listen for messages from the main thread
self.addEventListener("message", (msg: MessageEvent) => {
  handler.onmessage(msg);
});
