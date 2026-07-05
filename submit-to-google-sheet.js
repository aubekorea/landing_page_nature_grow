const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwohzXMaxwtedKRexU9Xy7GvIOBfKOy-WkiZvVf5CqnW_-SBhfaS2Uj00m5lH4gY1bCSA/exec";
const META_PIXEL_ID = "1422774046363286";
const META_CONTENT_NAME = "nature_grow_landing";

const consultForm = document.querySelector("[data-google-sheet-form]");
const submitNotice = document.querySelector(".submit-notice");
const submitNoticeClose = document.querySelector(".submit-notice-close");
let submitNoticeTimer;

function getPhoneValue(form) {
  const prefix = form.elements["phone-prefix"]?.value.trim() || "010";
  const middle = form.elements["phone-middle"]?.value.trim() || "";
  const last = form.elements["phone-last"]?.value.trim() || "";
  return [prefix, middle, last].filter(Boolean).join("-");
}

function getCookieValue(name) {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
}

function createMetaEventId() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${META_CONTENT_NAME}.${Date.now()}.${randomPart}`;
}

function showSubmitNotice() {
  if (!submitNotice) {
    alert("접수되었습니다.");
    return;
  }

  window.clearTimeout(submitNoticeTimer);
  submitNotice.hidden = false;
  requestAnimationFrame(() => submitNotice.classList.add("is-visible"));
  submitNoticeTimer = window.setTimeout(hideSubmitNotice, 2400);
}

function hideSubmitNotice() {
  if (!submitNotice) {
    return;
  }

  submitNotice.classList.remove("is-visible");
  window.setTimeout(() => {
    if (!submitNotice.classList.contains("is-visible")) {
      submitNotice.hidden = true;
    }
  }, 180);
}

function trackLeadEvent(eventId) {
  if (typeof window.fbq === "function") {
    window.fbq("track", "Lead", {
      content_name: META_CONTENT_NAME,
    }, {
      eventID: eventId,
    });
    console.info("Meta Pixel Lead event sent.", META_PIXEL_ID);
    return;
  }

  console.warn("Meta Pixel fbq is not ready. Lead event was not sent.", META_PIXEL_ID);
}

submitNoticeClose?.addEventListener("click", hideSubmitNotice);
submitNotice?.addEventListener("click", (event) => {
  if (event.target === submitNotice) {
    hideSubmitNotice();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideSubmitNotice();
  }
});

if (consultForm) {
  consultForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!consultForm.checkValidity()) {
      consultForm.reportValidity();
      return;
    }

    if (!consultForm.elements.privacy.checked) {
      alert("개인정보 수집·이용 동의가 필요합니다.");
      return;
    }

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("여기에_구글")) {
      alert("submit-to-google-sheet.js에 Google Apps Script Web App URL을 입력해주세요.");
      return;
    }

    const submitButton = consultForm.querySelector("button[type='submit']");
    const originalText = submitButton.textContent;
    const formData = new FormData(consultForm);
    const metaEventId = createMetaEventId();

    formData.set("phone", getPhoneValue(consultForm));
    formData.delete("phone-prefix");
    formData.delete("phone-middle");
    formData.delete("phone-last");
    formData.set("contact_time", consultForm.elements.contact_time?.value || "");
    formData.set("privacy", "동의");
    formData.set("page_url", window.location.href);
    formData.set("user_agent", navigator.userAgent);
    formData.set("submitted_at_client", new Date().toISOString());
    formData.set("meta_event_id", metaEventId);
    formData.set("meta_content_name", META_CONTENT_NAME);
    formData.set("fbp", getCookieValue("_fbp"));
    formData.set("fbc", getCookieValue("_fbc"));

    submitButton.disabled = true;
    submitButton.textContent = "전송 중입니다";

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });

      trackLeadEvent(metaEventId);
      showSubmitNotice();
      consultForm.reset();
      consultForm.elements["phone-prefix"].value = "010";
    } catch (error) {
      alert("전송 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}
