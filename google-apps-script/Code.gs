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

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var type = data.type === "parse_error" ? "parse_error" : "feedback";
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
          "expected_difference",
          "session_id",
        ]);
      } else {
        sheet.appendRow(["created_at", "diagnostic"]);
      }
    }

    var now = new Date();
    if (type === "feedback") {
      sheet.appendRow([
        now,
        data.merchant_raw_name || "",
        data.normalized_merchant_name || "",
        data.user_action || "",
        data.detected_status || "",
        data.detected_confidence || "",
        data.point_type || "",
        data.expected_difference == null ? "" : data.expected_difference,
        data.anonymous_session_id || "",
      ]);
    } else {
      sheet.appendRow([now, String(data.diagnostic || "").slice(0, 4000)]);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// 브라우저에서 URL을 직접 열었을 때 배포가 살아있는지 확인용
function doGet() {
  return ContentService.createTextOutput("Bonvoy L5 Checker collector is running.");
}
