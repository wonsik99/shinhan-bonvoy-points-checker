import type { AnalysisResult, UserFeedbackAction } from "@/types/transaction";

const SESSION_ID_STORAGE_KEY = "bonvoy-l5-checker-session-id";

function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return { url: url.replace(/\/$/, ""), anonKey };
}

export function isFeedbackPersistenceEnabled(): boolean {
  return getSupabaseConfig() !== null;
}

function getAnonymousSessionId(): string {
  try {
    // sessionStorage (not localStorage) so the id dies with the tab session —
    // it groups feedback within one visit without becoming a permanent
    // cross-visit browser identifier.
    const existing = window.sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return "anonymous";
  }
}

/**
 * Fire-and-forget anonymous feedback submission. Sends only the merchant name
 * and classification metadata — never amounts-by-date profiles, card numbers,
 * or the uploaded file. Silently no-ops when Supabase is not configured and
 * never blocks or breaks the UI on failure.
 */
export function submitFeedback(
  result: AnalysisResult,
  action: UserFeedbackAction
): void {
  const config = getSupabaseConfig();
  if (!config || typeof window === "undefined") {
    return;
  }

  const payload = {
    merchant_raw_name: result.merchantName,
    normalized_merchant_name: result.classification.normalizedName ?? null,
    user_action: action,
    detected_status: result.analysisStatus,
    detected_confidence: result.classification.confidence,
    point_type: result.pointType || null,
    expected_difference: result.difference ?? null,
    anonymous_session_id: getAnonymousSessionId(),
  };

  void fetch(`${config.url}/rest/v1/merchant_feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Feedback persistence is best-effort; the local UI state is the source of truth.
  });
}

/**
 * One-click anonymous parse-failure report — no login, no GitHub account.
 * Sends only the privacy-safe diagnostic (masked headers, no transaction
 * data). Returns whether the report was accepted so the UI can confirm.
 */
export async function submitParseErrorReport(
  diagnostic: string
): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config || typeof window === "undefined") {
    return false;
  }
  try {
    const res = await fetch(`${config.url}/rest/v1/parse_error_reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ diagnostic: diagnostic.slice(0, 4000) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
