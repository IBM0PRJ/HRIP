import { getAIFlags } from "../../../lib/api";
import QueueClient from "./QueueClient";

export const dynamic = "force-dynamic";

export default async function AIQueuePage() {
  const flags = await getAIFlags();
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
          AI Triage Queue
        </h1>
        <p className="text-white/50 text-lg">
          Review and remediate high-confidence behavioral anomalies flagged by Qwen AI.
        </p>
      </div>
      
      <QueueClient initialFlags={flags} />
    </div>
  );
}
