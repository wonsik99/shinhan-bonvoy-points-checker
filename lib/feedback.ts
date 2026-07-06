import type { AnalysisResult, UserFeedbackAction } from "@/types/transaction";

const SESSION_ID_STORAGE_KEY = "bonvoy-l5-checker-session-id";

/**
 * Google Apps Script web-app URL that appends submissions to a Google Sheet.
 * See google-apps-script/Code.gs for the collector and setup instructions.
 */
function getEndpoint(): string | null {
  const url = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
  return url ? url : null;
}

export function isFeedbackPersistenceEnabled(): boolean {
  return getEndpoint() !== null;
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
 * POSTs to the Apps Script collector. Uses text/plain + mode:"no-cors" so the
 * browser sends a CORS-safelisted "simple request" — Apps Script can't answer
 * a preflight, so an application/json body would fail. The response is opaque;
 * a resolved promise means the request left the browser (good enough for
 * fire-and-forget), a rejection means a network-level failure.
 */
function post(payload: Record<string, unknown>): Promise<Response> {
  const endpoint = getEndpoint();
  if (!endpoint) {
    return Promise.reject(new Error("collector disabled"));
  }
  return fetch(endpoint, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
}

/**
 * Fire-and-forget anonymous feedback submission. Sends only the merchant name
 * and classification metadata — never amounts-by-date profiles, card numbers,
 * or the uploaded file. Silently no-ops when the collector is not configured
 * and never blocks or breaks the UI on failure.
 */
export function submitFeedback(
  result: AnalysisResult,
  action: UserFeedbackAction
): void {
  if (!getEndpoint() || typeof window === "undefined") {
    return;
  }

  void post({
    type: "feedback",
    merchant_raw_name: result.merchantName,
    normalized_merchant_name: result.classification.normalizedName ?? null,
    user_action: action,
    detected_status: result.analysisStatus,
    detected_confidence: result.classification.confidence,
    point_type: result.pointType || null,
    expected_difference: result.difference ?? null,
    anonymous_session_id: getAnonymousSessionId(),
  }).catch(() => {
    // Best-effort; the local UI state is the source of truth.
  });
}

/**
 * One-click anonymous parse-failure report — no login, no GitHub account.
 * Sends only the privacy-safe diagnostic (masked headers, no transaction
 * data). Returns true if the request was dispatched (opaque response), false
 * on network failure or when the collector is disabled.
 */
export async function submitParseErrorReport(
  diagnostic: string
): Promise<boolean> {
  if (!getEndpoint() || typeof window === "undefined") {
    return false;
  }
  try {
    await post({ type: "parse_error", diagnostic: diagnostic.slice(0, 4000) });
    return true;
  } catch {
    return false;
  }
}
