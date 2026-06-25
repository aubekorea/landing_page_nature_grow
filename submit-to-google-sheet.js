const GOOGLE_SCRIPT_URL = "여기에_구글_APPS_SCRIPT_WEB_APP_URL을_넣어주세요";

const consultForm = document.querySelector("[data-google-sheet-form]");

function getPhoneValue(form) {
  const prefix = form.elements["phone-prefix"]?.value.trim() || "010";
  const middle = form.elements["phone-middle"]?.value.trim() || "";
  const last = form.elements["phone-last"]?.value.trim() || "";
  return [prefix, middle, last].filter(Boolean).join("-");
}

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

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("여기에_")) {
      alert("구글 Apps Script Web App URL을 submit-to-google-sheet.js에 입력해주세요.");
      return;
    }

    const submitButton = consultForm.querySelector("button[type='submit']");
    const originalText = submitButton.textContent;
    const formData = new FormData(consultForm);

    formData.set("phone", getPhoneValue(consultForm));
    formData.set("privacy", "동의");
    formData.set("page_url", window.location.href);
    formData.set("user_agent", navigator.userAgent);
    formData.set("submitted_at_client", new Date().toISOString());

    submitButton.disabled = true;
    submitButton.textContent = "전송 중입니다";

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });

      alert("상담 신청이 접수되었습니다.");
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
