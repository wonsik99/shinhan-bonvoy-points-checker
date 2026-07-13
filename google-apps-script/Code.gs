/**
 * Bonvoy L5 Checker — 익명 피드백 / 파싱 실패 제보 수집기 (Google Apps Script)
 *
 * 이 코드는 구글 시트에 붙여서 웹 앱으로 배포합니다. 배포하면 나오는 URL을
 * Vercel 환경변수 NEXT_PUBLIC_APPS_SCRIPT_URL 에 넣으면 수집이 켜집니다.
 *
 * 설치 방법:
 *  1. drive.google.com → 새로 만들기 → Google 스프레드시트 (빈 시트)
 *  2. 상단 메뉴 → 확장 프로그램 → Apps Script
 *  3. 기본 코드(function myFunction…)를 전부 지우고 이 파일 내용을 붙여넣기 → 저장(디스크 아이콘)
 *  4. 오른쪽 위 "배포" → "새 배포" → 유형 선택(톱니바퀴) → "웹 앱"
 *  5. 설명: 아무거나 / 실행 계정: "나" / 액세스 권한: "모든 사용자(Anyone)"  ← 로그인 없이 받으려면 필수
 *  6. "배포" → 권한 검토/승인 (본인 구글 계정)
 *  7. 나오는 "웹 앱 URL" (https://script.google.com/macros/s/AKfyc...../exec) 복사
 *  8. 그 URL을 Vercel 프로젝트 환경변수 NEXT_PUBLIC_APPS_SCRIPT_URL 에 저장 후 재배포
 *
 * 코드를 수정하면 반드시 "배포 관리 → 편집(연필) → 새 버전 → 배포"로 재배포해야 반영됩니다.
 * 수집되는 값: 가맹점명, 판정 결과, 사용자 액션, 마스킹된 진단 텍스트 뿐입니다.
 * 업로드 파일·금액 상세·카드번호는 절대 전송되지 않습니다.
 */

var MAX_TEXT_CELL_LENGTH = 4000;
var MAX_BODY_BYTES = 8192;
var MAX_FEEDBACK_FIELD_LENGTH = 256;
var MAX_SESSION_ID_LENGTH = 128;
var MAX_DAILY_WRITES = 500;
var DEDUPE_TTL_SECONDS = 21600;
var COLLECTOR_PAUSED_PROPERTY = "COLLECTOR_PAUSED";
var DAILY_WRITES_PREFIX = "COLLECTOR_WRITES_";
var DEDUPE_CACHE_PREFIX = "COLLECTOR_DEDUPE_";
var FORMULA_PREFIX_RE = /^[\t\r\n ]*[=+\-@]/;

// 수집기는 기본적으로 계속 켜져 있습니다. 긴급 중단이 필요할 때만
// Apps Script 프로젝트 설정의 스크립트 속성에 COLLECTOR_PAUSED=true를
// 넣고, 재개할 때 속성을 삭제하거나 false로 바꿉니다.
// 일일 한도는 정상 사용량을 관찰한 뒤 이 상수를 조정해 새 버전으로 배포합니다.

var FEEDBACK_KEYS = [
  "type",
  "merchant_raw_name",
  "normalized_merchant_name",
  "user_action",
  "detected_status",
  "detected_confidence",
  "point_type",
  "anonymous_session_id",
];
var PARSE_ERROR_KEYS = ["type", "diagnostic"];
var FEEDBACK_ACTIONS = ["include", "exclude", "unsure"];
var DETECTED_STATUSES = [
  "ok_l5",
  "missing_suspected",
  "needs_review",
  "not_marriott",
  "canceled",
  "user_designated",
];
var DETECTED_CONFIDENCES = ["certain", "high", "medium", "low", "none"];

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, expectedKeys) {
  var actualKeys = Object.keys(value);
  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }
  for (var i = 0; i < expectedKeys.length; i++) {
    if (actualKeys.indexOf(expectedKeys[i]) < 0) {
      return false;
    }
  }
  return true;
}

function isBoundedString(value, maxLength, allowEmpty) {
  return (
    typeof value === "string" &&
    value.length <= maxLength &&
    (allowEmpty || value.length > 0)
  );
}

function isNullableBoundedString(value, maxLength) {
  return value === null || isBoundedString(value, maxLength, true);
}

function isOneOf(value, allowed) {
  return allowed.indexOf(value) >= 0;
}

function readRequestBody(event) {
  if (
    !event ||
    !event.postData ||
    typeof event.postData.contents !== "string"
  ) {
    throw new Error("request body required");
  }
  var body = event.postData.contents;
  if (Utilities.newBlob(body).getBytes().length > MAX_BODY_BYTES) {
    throw new Error("request body too large");
  }
  return body;
}

function validateFeedbackPayload(data) {
  if (!hasExactKeys(data, FEEDBACK_KEYS)) {
    throw new Error("invalid feedback fields");
  }
  if (!isBoundedString(data.merchant_raw_name, MAX_FEEDBACK_FIELD_LENGTH, false)) {
    throw new Error("invalid merchant name");
  }
  if (
    !isNullableBoundedString(
      data.normalized_merchant_name,
      MAX_FEEDBACK_FIELD_LENGTH
    )
  ) {
    throw new Error("invalid normalized name");
  }
  if (!isOneOf(data.user_action, FEEDBACK_ACTIONS)) {
    throw new Error("invalid user action");
  }
  if (!isOneOf(data.detected_status, DETECTED_STATUSES)) {
    throw new Error("invalid detected status");
  }
  if (!isOneOf(data.detected_confidence, DETECTED_CONFIDENCES)) {
    throw new Error("invalid detected confidence");
  }
  if (!isNullableBoundedString(data.point_type, 32)) {
    throw new Error("invalid point type");
  }
  if (!isBoundedString(data.anonymous_session_id, MAX_SESSION_ID_LENGTH, false)) {
    throw new Error("invalid session id");
  }
}

function validateParseErrorPayload(data) {
  if (!hasExactKeys(data, PARSE_ERROR_KEYS)) {
    throw new Error("invalid parse error fields");
  }
  if (!isBoundedString(data.diagnostic, MAX_TEXT_CELL_LENGTH, false)) {
    throw new Error("invalid diagnostic");
  }
}

function parseAndValidate(body) {
  var data = JSON.parse(body);
  if (!isPlainObject(data)) {
    throw new Error("object body required");
  }
  if (data.type === "feedback") {
    validateFeedbackPayload(data);
  } else if (data.type === "parse_error") {
    validateParseErrorPayload(data);
  } else {
    throw new Error("unsupported request type");
  }
  return data;
}

function isCollectorPaused() {
  var paused = PropertiesService
    .getScriptProperties()
    .getProperty(COLLECTOR_PAUSED_PROPERTY);
  return String(paused || "").toLowerCase() === "true";
}

function dailyWriteKey() {
  return (
    DAILY_WRITES_PREFIX +
    Utilities.formatDate(new Date(), "UTC", "yyyy-MM-dd")
  );
}

function dedupeKey(body) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    body
  );
  return DEDUPE_CACHE_PREFIX + Utilities.base64EncodeWebSafe(digest);
}

/**
 * Serializes the admission decision and the Sheet write. The global budget is
 * intentionally shared because Apps Script does not provide a trustworthy
 * anonymous caller identity to this handler.
 */
function withAdmission(body, write) {
  if (isCollectorPaused()) {
    throw new Error("collector paused");
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    throw new Error("collector busy");
  }

  try {
    var properties = PropertiesService.getScriptProperties();
    var cache = CacheService.getScriptCache();
    var key = dedupeKey(body);
    var budgetKey = dailyWriteKey();
    if (isCollectorPaused()) {
      throw new Error("collector paused");
    }
    if (cache.get(key)) {
      return { duplicate: true };
    }

    var rawCount = properties.getProperty(budgetKey);
    var currentCount = rawCount === null ? 0 : Number(rawCount);
    if (
      !isFinite(currentCount) ||
      currentCount < 0 ||
      Math.floor(currentCount) !== currentCount
    ) {
      throw new Error("invalid write budget state");
    }
    if (currentCount >= MAX_DAILY_WRITES) {
      throw new Error("daily write budget exhausted");
    }

    // Reserve the slot before the write so concurrent requests cannot pass
    // the global budget. A failed write rolls the reservation back.
    properties.setProperty(budgetKey, String(currentCount + 1));
    try {
      write();
    } catch (error) {
      properties.setProperty(budgetKey, String(currentCount));
      throw error;
    }

    // Cache is best-effort; the durable daily budget remains the primary cap.
    try {
      cache.put(key, "1", DEDUPE_TTL_SECONDS);
    } catch (cacheError) {
      // A cache outage must not turn a successful Sheet write into a retry.
    }
    return { duplicate: false };
  } finally {
    lock.releaseLock();
  }
}

function safeSheetText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  var text = String(value).slice(0, MAX_TEXT_CELL_LENGTH);
  return FORMULA_PREFIX_RE.test(text) ? "'" + text : text;
}

function removeLegacyExpectedDifferenceColumn(sheet) {
  if (sheet.getLastRow() === 0) {
    return;
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var legacyColumn = headers.indexOf("expected_difference");
  if (legacyColumn >= 0) {
    sheet.deleteColumn(legacyColumn + 1);
  }
}

function appendSubmission(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var type = data.type;
  var sheet = ss.getSheetByName(type) || ss.insertSheet(type);

  if (sheet.getLastRow() === 0) {
    if (type === "feedback") {
      sheet.appendRow([
        "created_at",
        "merchant_raw_name",
        "normalized_name",
        "user_action",
        "detected_status",
        "detected_confidence",
        "point_type",
        "session_id",
      ]);
    } else {
      sheet.appendRow(["created_at", "diagnostic"]);
    }
  } else if (type === "feedback") {
    removeLegacyExpectedDifferenceColumn(sheet);
  }

  var now = new Date();
  if (type === "feedback") {
    sheet.appendRow([
      now,
      safeSheetText(data.merchant_raw_name),
      safeSheetText(data.normalized_merchant_name),
      safeSheetText(data.user_action),
      safeSheetText(data.detected_status),
      safeSheetText(data.detected_confidence),
      safeSheetText(data.point_type),
      safeSheetText(data.anonymous_session_id),
    ]);
  } else {
    sheet.appendRow([now, safeSheetText(data.diagnostic)]);
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = readRequestBody(e);
    var data = parseAndValidate(body);
    withAdmission(body, function () {
      appendSubmission(data);
    });
    return jsonResponse({ ok: true });
  } catch (err) {
    // Do not reflect request contents or platform details to anonymous callers.
    return jsonResponse({ ok: false, error: "request rejected" });
  }
}

// 브라우저에서 URL을 직접 열었을 때 배포가 살아있는지 확인용
function doGet() {
  return ContentService.createTextOutput("Bonvoy L5 Checker collector is running.");
}
