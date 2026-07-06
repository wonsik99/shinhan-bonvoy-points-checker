import type { AnalysisStatus, Confidence } from "@/types/transaction";
import { confidenceLabels, statusLabels } from "@/lib/format";

const statusTones: Record<AnalysisStatus, string> = {
  ok_l5: "bg-emerald-50 text-emerald-700 border-emerald-200",
  missing_suspected: "bg-red-50 text-red-700 border-red-200",
  needs_review: "bg-amber-50 text-amber-700 border-amber-200",
  not_marriott: "bg-neutral-100 text-neutral-500 border-neutral-200",
  canceled: "bg-neutral-100 text-neutral-400 border-neutral-200 line-through",
};

export function StatusBadge({ status }: { status: AnalysisStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${statusTones[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

const confidenceTones: Record<Confidence, string> = {
  certain: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-blue-50 text-blue-600 border-blue-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-neutral-100 text-neutral-500 border-neutral-200",
  none: "bg-neutral-100 text-neutral-400 border-neutral-200",
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${confidenceTones[confidence]}`}
    >
      {confidenceLabels[confidence]}
    </span>
  );
}
