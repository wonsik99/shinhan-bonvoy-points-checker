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
  // Keep a low-confidence hotel-like name for the needs_review include flow.
  [2, "VISA해외사용일시불", "ISTANBUL BOUTIQUE HOTEL", 209755, "L2", 629, "N"],
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

function statementMatrix(transactions = TRANSACTIONS): unknown[][] {
  const rows: unknown[][] = [HEADER_A, HEADER_B];
  for (const [sequence, domestic, overseas, amount, grade, points, canceled] of
    transactions) {
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

test("treats unmapped L4/L5 as normal and submits aliases only after consent", async ({
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

  const transactions: Transaction[] = [
    [1, "유한회사 오로라비즈니스", "", 180000, "L4", 900, "N"],
    [
      2,
      "VISA해외사용일시불",
      "QINGDAOQINGMAO TEST CO LTD",
      220000,
      "L5",
      1100,
      "N",
    ],
  ];

  await page.goto("/");
  await upload(
    page,
    workbookPayload(
      "grade-confirmed.xlsx",
      statementMatrix(transactions)
    )
  );

  await expectSummaryCard(page, "전체 거래", "2건");
  await expectSummaryCard(page, "Marriott 추정", "2건");
  await expectSummaryCard(page, "정상 적립", "2건");
  await expectSummaryCard(page, "적립 누락 의심", "0건");
  await expectSummaryCard(page, "확인 필요", "0건");
  await expectSummaryCard(page, "예상 추가 포인트", "0P");
  await expect(
    page.getByText("추가로 확인할 미분류 거래가 없습니다.")
  ).toBeVisible();

  await page
    .getByRole("button", { name: "정상 적립 2건 펼치기" })
    .click();
  await expect(
    page.getByText(
      "명세서 L4 등급으로 메리어트 특별적립 확인 · 가맹점명은 DB 미등록"
    )
  ).toBeVisible();
  await expect(
    page.getByText(
      "명세서 L5 등급으로 메리어트 특별적립 확인 · 가맹점명은 DB 미등록"
    )
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "유한회사 오로라비즈니스 가맹점명을 서비스 개선 제보에 포함",
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "유한회사 오로라비즈니스 가맹점명 제보 취소",
    })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText(
      "서비스 개선 제보 1건 · 문의 보내기 전에 익명으로 보낼 수 있어요"
    )
  ).toBeVisible();
  expect(collectorBodies).toHaveLength(0);
  expect(mutationRequests).toHaveLength(0);

  await page
    .getByRole("button", { name: "문의 보내기 단계로 이동" })
    .click();
  await expect(
    page.getByRole("heading", { name: "문의에 담을 항목이 없어요" })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "내 판단으로 서비스 돕기 (1건)" })
    .click();

  await expect.poll(() => collectorBodies.length).toBe(1);
  expect(mutationRequests).toEqual([COLLECTOR_URL]);
  expect(collectorBodies[0]).toMatchObject({
    merchant_raw_name: "유한회사 오로라비즈니스",
    normalized_merchant_name: null,
    user_action: "include",
    detected_status: "ok_l5",
    detected_confidence: "none",
    point_type: "L4",
  });
  const serialized = JSON.stringify(collectorBodies[0]);
  expect(serialized).not.toContain("180000");
  expect(serialized).not.toContain("grade-confirmed.xlsx");
});

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
  await expectSummaryCard(page, "Marriott 추정", "3건");
  await expectSummaryCard(page, "정상 적립", "1건");
  await expectSummaryCard(page, "적립 누락 의심", "1건");
  await expectSummaryCard(page, "확인 필요", "1건");
  await expectSummaryCard(page, "예상 추가 포인트", "468P");
  await expect(
    page.getByRole("button", { name: "결과 확인·판정 단계로 이동" })
  ).toHaveAttribute("aria-current", "step");
  await expect(
    page.getByRole("region", { name: "신한카드 문의 문구" })
  ).toHaveCount(0);
  expect(collectorBodies).toHaveLength(0);
  expect(mutationRequests).toHaveLength(0);

  await page
    .getByRole("button", {
      name: "COURTYARD BY MARRIOTT 거래를 문의에서 제외",
    })
    .click();
  await expectSummaryCard(page, "예상 추가 포인트", "0P");
  // Full judgment-submission card lives on step 3; step 2 only shows a thin reminder.
  await expect(page.getByRole("region", { name: "판단 제보" })).toHaveCount(0);
  await expect(
    page.getByText(
      "서비스 개선 제보 1건 · 문의 보내기 전에 익명으로 보낼 수 있어요"
    )
  ).toBeVisible();

  await page.getByRole("button", { name: "문의 보내기 단계로 이동" }).click();
  await expect(
    page.getByRole("heading", { name: "문의에 담을 항목이 없어요" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "문구 복사" })).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "문의 보내기 채널" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "내 판단으로 서비스 돕기 (1건)" })
  ).toBeVisible();
  expect(collectorBodies).toHaveLength(0);
  await page.getByRole("button", { name: "이전" }).click();

  await page
    .getByRole("button", {
      name: "COURTYARD BY MARRIOTT 거래를 문의에 다시 포함",
    })
    .click();
  await expectSummaryCard(page, "예상 추가 포인트", "468P");
  await expect(
    page.getByRole("button", {
      name: "COURTYARD BY MARRIOTT 거래를 문의에서 제외",
    })
  ).toBeVisible();

  const reviewGroup = page.getByRole("group", {
    name: "ISTANBUL BOUTIQUE HOTEL 거래 문의 반영",
  });
  await reviewGroup.getByRole("button", { name: "문의에 포함" }).click();
  await expectSummaryCard(page, "예상 추가 포인트", "888P");
  expect(collectorBodies).toHaveLength(0);
  expect(mutationRequests).toHaveLength(0);

  const allTransactionsToggle = page.getByRole("button", {
    name: "미분류 거래 1건 펼치기",
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
  expect(collectorBodies).toHaveLength(0);

  await page
    .getByRole("button", {
      name: "SAMMAEBONG CO LTD 거래의 메리어트 표시 해제",
    })
    .click();
  await expectSummaryCard(page, "예상 추가 포인트", "888P");

  await page.getByRole("button", { name: "문의 문구 만들기" }).click();
  await expect(
    page.getByRole("button", { name: "문의 보내기 단계로 이동" })
  ).toHaveAttribute("aria-current", "step");
  await expect(
    page.getByRole("region", { name: "신한카드 문의 문구" })
  ).toContainText("COURTYARD BY MARRIOTT");
  await expect(
    page.getByRole("region", { name: "신한카드 문의 문구" })
  ).toContainText("ISTANBUL BOUTIQUE HOTEL");

  const sendRegion = page.getByRole("region", { name: "문의 보내기 채널" });
  await expect(sendRegion.getByRole("link", { name: /1:1 문의/ })).toBeVisible();
  await expect(
    sendRegion.getByRole("link", { name: /1544-7000/ })
  ).toBeVisible();
  await expect(
    sendRegion.getByRole("button", { name: "다른 앱으로 공유" })
  ).toBeVisible();

  await expect(page.getByText(/임시 익명 ID만/)).toBeVisible();
  await page
    .getByRole("button", { name: "내 판단으로 서비스 돕기 (1건)" })
    .click();
  await expect.poll(() => collectorBodies.length).toBe(1);
  expect(mutationRequests).toEqual([COLLECTOR_URL]);
  expect(collectorBodies[0]).toMatchObject({
    merchant_raw_name: "ISTANBUL BOUTIQUE HOTEL",
    user_action: "include",
  });
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
  await expect(
    page.getByRole("button", { name: "도와주셔서 감사합니다" })
  ).toBeDisabled();

  await page.getByRole("button", { name: "이전" }).click();
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

  const toggle = page.getByRole("button", { name: "미분류 거래 1건 펼치기" });
  await expect(toggle).toHaveAttribute("aria-controls", "all-transactions-content");
  await toggle.click();
  await expect(
    page
      .getByRole("region", { name: "전체 거래" })
      .locator("article:visible")
  ).toHaveCount(1);
  await expect(
    page
      .getByRole("region", { name: "전체 거래" })
      .getByText("COURTYARD BY MARRIOTT", { exact: true })
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("region", { name: "전체 거래" })
      .getByText("JW MARRIOTT SEOUL", { exact: true })
  ).toHaveCount(0);
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
  await page.getByRole("button", { name: "원클릭 제보 보내기" }).click();
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
    page.getByRole("button", { name: "원클릭 제보 보내기" })
  ).toBeVisible();
  await page.getByRole("button", { name: "원클릭 제보 보내기" }).click();
  await expect.poll(() => reports.length).toBe(2);
  expect(reports[0].diagnostic).not.toBe(reports[1].diagnostic);
});
