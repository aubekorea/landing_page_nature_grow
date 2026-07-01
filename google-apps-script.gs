const SPREADSHEET_ID = "1QXypNh6uAUOBasO9tYVFbw5Ffy9BsAhQLHTafC6Us54";

const LANDING_URLS = {
  diet: "https://landing-page-nature-diet.vercel.app/",
  growth: "https://landing-page-nature-grow.vercel.app/",
};

const SHEET_CONFIG = {
  diet: { name: "다이어트상담", index: 0 },
  growth: { name: "성장상담", index: 1 },
  default: { name: "기타상담", index: 2 },
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const data = e.parameter || {};
    const landingType = getLandingType_(data);
    const sheet = getSheet_(landingType);
    ensureHeader_(sheet);

    const phonePrefix = clean_(data["phone-prefix"]) || "010";
    const phoneMiddle = clean_(data["phone-middle"]);
    const phoneLast = clean_(data["phone-last"]);
    const phone = clean_(data.phone) || [phonePrefix, phoneMiddle, phoneLast].filter(Boolean).join("-");

    sheet.appendRow([
      new Date(),
      clean_(data.program) || getProgramName_(landingType),
      clean_(data.name),
      phone,
      phonePrefix,
      phoneMiddle,
      phoneLast,
      clean_(data.privacy) || "동의",
      clean_(data.source),
      clean_(data.page_url),
      clean_(data.user_agent),
      clean_(data.submitted_at_client),
    ]);

    return json_({ result: "success", landingType });
  } catch (error) {
    return json_({ result: "error", message: error.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ result: "ready" });
}

function getLandingType_(data) {
  const program = clean_(data.program);
  const source = clean_(data.source);
  const pageUrl = clean_(data.page_url);

  if (program.includes("다이어트") || source.includes("diet")) {
    return "diet";
  }

  if (program.includes("성장") || source.includes("growth")) {
    return "growth";
  }

  if (pageUrl.startsWith(LANDING_URLS.diet)) {
    return "diet";
  }

  if (pageUrl.startsWith(LANDING_URLS.growth)) {
    return "growth";
  }

  return "default";
}

function getProgramName_(landingType) {
  if (landingType === "diet") {
    return "다이어트 프로그램";
  }

  if (landingType === "growth") {
    return "성장 프로그램";
  }

  return "미분류 프로그램";
}

function getSheet_(landingType) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const config = SHEET_CONFIG[landingType] || SHEET_CONFIG.default;
  const sheets = spreadsheet.getSheets();

  if (sheets[config.index]) {
    return sheets[config.index];
  }

  const namedSheet = spreadsheet.getSheetByName(config.name);
  if (namedSheet) {
    return namedSheet;
  }

  return spreadsheet.insertSheet(config.name, config.index);
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) {
    return;
  }

  sheet.appendRow([
    "접수일시",
    "프로그램",
    "이름",
    "연락처",
    "연락처 앞자리",
    "연락처 가운데",
    "연락처 마지막",
    "개인정보 동의",
    "유입",
    "페이지 URL",
    "브라우저",
    "클라이언트 전송시각",
  ]);
}

function clean_(value) {
  return String(value || "").trim();
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
