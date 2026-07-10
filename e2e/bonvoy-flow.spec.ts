import { expect, test, type Page } from "@playwright/test";
import * as XLSX from "xlsx";

const COLLECTOR_URL = "https://script.google.com/macros/s/test/exec";

const HEADER_A = [
  "",
  "거래일자",
  "영업상품코드",
  "매출전표번호",
  "가맹점번호",
  "해외가맹점번호",
  "원매출금액",
  "포인트종류상세",
  "취소전표여부",
];

const HEADER_B = [
  "",
  "매입일자",
  "할부개월",
  "카드번호",
  "가맹점명",
  "해외가맹점명",
  "포인트적립대상금액",
  "포인트적립금액",
  "집계작업일자",
];

type Transaction = [
  number,
  string,
  string,
  number,
  string,
  number,
  "Y" | "N",
];

const TRANSACTIONS: Transaction[] = [
  [1, "VISA해외사용일시불", "COURTYARD BY MARRIOTT", 234068, "L2", 702, "N"],
  [2, "VISA해외사용일시불", "HOTEL 55 CHICAGO", 209755, "L2", 629, "N"],
  [3, "VISA해외사용일시불", "SAMMAEBONG CO LTD", 600000, "L2", 1800, "N"],
  [4, "VISA해외사용일시불", "JW MARRIOTT SEOUL", 500000, "L5", 2500, "N"],
  [5, "VISA해외사용일시불", "SHERATON GRAND", 410000, "L2", 1230, "Y"],
];

function workbookPayload(
  name = "sample.xlsx",
  matrix: unknown[][] = statementMatrix()
) {
  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  const data = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return {
    name,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(data),
  };
}

function statementMatrix(): unknown[][] {
  const rows: unknown[][] = [HEADER_A, HEADER_B];
  for (const [sequence, domestic, overseas, amount, grade, points, canceled] of
    TRANSACTIONS) {
    rows.push([
      String(sequence),
      46123 + sequence,
      "52001",
      `slip-${sequence}`,
      "merchant-id",
      "overseas-id",
      amount,
      grade,
      canceled,
    ]);
    rows.push([
      "",
      46125 + sequence,
      "0",
      "1234-5678-9012-3456",
      domestic,
      overseas,
      amount,
      points,
      46170,
    ]);
  }
  return rows;
}

async function upload(page: Page, payload = workbookPayload()) {
  await page.locator('input[type="file"]').setInputFiles(payload);
  await expect(page.getByText("분석이 완료되었습니다.")).toBeVisible();
}

async function expectSummaryCard(page: Page, label: string, value: string) {
  const summary = page.getByRole("region", { name: "분석 요약" });
  const card = summary.getByText(label, { exact: true }).locator("..");
  await expect(card.getByText(value, { exact: true })).toBeVisible();
}

test("uploads locally and keeps feedback local until explicit submission", async ({
  page,
}) => {
  const collectorBodies: Record<string, unknown>[] = [];
  const mutationRequests: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      mutationRequests.push(request.url());
    }
  });
  await page.route(`${COLLECTOR_URL}**`, async (route) => {
    collectorBodies.push(JSON.parse(route.request().postData() ?? "{}"));
    await route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/");
  await upload(page);

  await expectSummaryCard(page, "전체 거래", "5건");
  await expectSummaryCard(page, "Marriott 계열 추정", "3건");
  await expectSummaryCard(page, "정상 적립", "1건");
  await expectSummaryCard(page, "적립 누락 의심", "1건");
  await expectSummaryCard(page, "확인 필요", "1건");
  await expectSummaryCard(page, "예상 추가 포인트", "468P");
  await expect(
    page.getByRole("region", { name: "신한카드 문의 문구" })
  ).toContainText("COURTYARD BY MARRIOTT");
  expect(collectorBodies).toHaveLength(0);
  expect(mutationRequests).toHaveLength(0);

  await page
    .getByRole("button", {
      name: "COURTYARD BY MARRIOTT 거래를 문의에서 제외",
    })
    .click();
  await expectSummaryCard(page, "예상 추가 포인트", "0P");
  await expect(page.getByText("누락 의심 거래가 있거나 확인 필요 거래를 포함하면")).toBeVisible();

  await page
    .getByRole("button", {
      name: "COURTYARD BY MARRIOTT 거래를 문의에 다시 포함",
    })
    .click();
  await expectSummaryCard(page, "예상 추가 포인트", "468P");

  const reviewGroup = page.getByRole("group", {
    name: "HOTEL 55 CHICAGO 거래 문의 반영",
  });
  await reviewGroup.getByRole("button", { name: "문의에 포함" }).click();
  await expectSummaryCard(page, "예상 추가 포인트", "888P");
  await expect(
    page.getByRole("region", { name: "신한카드 문의 문구" })
  ).toContainText("HOTEL 55 CHICAGO");
  await expect(page.getByText(/임시 익명 ID만 전송되고/)).toBeVisible();
  expect(collectorBodies).toHaveLength(0);
  expect(mutationRequests).toHaveLength(0);

  await page
    .getByRole("button", { name: "내 판단으로 서비스 돕기 (2건)" })
    .click();
  await expect.poll(() => collectorBodies.length).toBe(2);
  expect(mutationRequests).toEqual([COLLECTOR_URL, COLLECTOR_URL]);
  for (const body of collectorBodies) {
    expect(Object.keys(body).sort()).toEqual(
      [
        "anonymous_session_id",
        "detected_confidence",
        "detected_status",
        "merchant_raw_name",
        "normalized_merchant_name",
        "point_type",
        "type",
        "user_action",
      ].sort()
    );
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("234068");
    expect(serialized).not.toContain("209755");
    expect(serialized).not.toContain("3456");
    expect(serialized).not.toContain("sample.xlsx");
  }

  const allTransactionsToggle = page.getByRole("button", {
    name: "전체 거래 5건 펼치기",
  });
  await expect(allTransactionsToggle).toHaveAttribute("aria-expanded", "false");
  await allTransactionsToggle.click();
  await expect(
    page.locator('[aria-controls="all-transactions-content"]')
  ).toHaveAttribute("aria-expanded", "true");

  await page
    .getByRole("button", {
      name: "SAMMAEBONG CO LTD 거래를 메리어트로 표시",
    })
    .click();
  await expectSummaryCard(page, "예상 추가 포인트", "2,088P");
  await expect(
    page.getByRole("region", { name: "신한카드 문의 문구" })
  ).toContainText("SAMMAEBONG CO LTD");
  expect(collectorBodies).toHaveLength(2);

  await page
    .getByRole("button", {
      name: "SAMMAEBONG CO LTD 거래의 메리어트 표시 해제",
    })
    .click();
  await expectSummaryCard(page, "예상 추가 포인트", "888P");

  await page.getByRole("button", { name: "다른 파일 업로드" }).click();
  await expect(page.getByText("엑셀 파일은 어디서 받나요?")).toBeVisible();
  await upload(page, workbookPayload("sample.xlsx"));
  await expectSummaryCard(page, "전체 거래", "5건");
});

test("renders responsive cards without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await upload(page);

  await expect(page.locator("table:visible")).toHaveCount(0);
  await expect(
    page
      .getByRole("region", { name: "적립 누락 의심 거래" })
      .locator("article:visible")
  ).toHaveCount(1);
  await expect(
    page
      .getByRole("region", { name: "확인 필요 거래" })
      .locator("article:visible")
  ).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
  ).toBe(true);

  const toggle = page.getByRole("button", { name: "전체 거래 5건 펼치기" });
  await expect(toggle).toHaveAttribute("aria-controls", "all-transactions-content");
  await toggle.click();
  await expect(
    page
      .getByRole("region", { name: "전체 거래" })
      .locator("article:visible")
  ).toHaveCount(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
  ).toBe(true);
});

test("resets parse-report state for each new diagnostic", async ({ page }) => {
  const reports: Record<string, unknown>[] = [];
  await page.route(`${COLLECTOR_URL}**`, async (route) => {
    reports.push(JSON.parse(route.request().postData() ?? "{}"));
    await route.fulfill({ status: 204, body: "" });
  });
  await page.goto("/");

  await page.locator('input[type="file"]').setInputFiles(
    workbookPayload("wrong-one.xlsx", [
      ["항목", "값"],
      ["a", "b"],
    ])
  );
  await expect(page.getByText("파일을 분석하지 못했습니다.")).toBeVisible();
  await page.getByRole("button", { name: "📨 원클릭 제보 보내기" }).click();
  await expect(page.getByRole("button", { name: /제보 완료/ })).toBeVisible();
  await expect.poll(() => reports.length).toBe(1);

  await page.locator('input[type="file"]').setInputFiles({
    name: "wrong.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("not excel"),
  });
  await expect(page.getByText(/xlsx 또는 xls 형식/)).toBeVisible();
  await expect(page.getByRole("button", { name: /원클릭 제보/ })).toHaveCount(0);

  await page.locator('input[type="file"]').setInputFiles(
    workbookPayload("wrong-two.xlsx", [
      ["포인트종류 9", "금액 8"],
      ["c", "d"],
    ])
  );
  await expect(
    page.getByRole("button", { name: "📨 원클릭 제보 보내기" })
  ).toBeVisible();
  await page.getByRole("button", { name: "📨 원클릭 제보 보내기" }).click();
  await expect.poll(() => reports.length).toBe(2);
  expect(reports[0].diagnostic).not.toBe(reports[1].diagnostic);
});
