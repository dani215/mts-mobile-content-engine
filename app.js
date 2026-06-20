const $ = (id) => document.getElementById(id);
const WORKER_PROXY_URL = "https://mts-make-proxy.dasztemborski.workers.dev/";

function buildPayload() {
  const people = $("people").value.split(",").map((s) => s.trim()).filter(Boolean);
  const ptbr = $("ptbr").checked;
  return {
    project: "MTS Żory",
    workflow_type: $("workflow_type").value,
    status: "draft",
    requires_approval: true,
    source: {
      type: "manual",
      url: $("source_url").value,
      title: $("title").value || "[DO UZUPEŁNIENIA]",
      source_notes: $("facts").value || "[DO UZUPEŁNIENIA]"
    },
    content: {
      title: $("title").value || "[DO UZUPEŁNIENIA]",
      lead: "",
      article: $("facts").value || "[DO UZUPEŁNIENIA]",
      facebook_post: "",
      instagram_post: "",
      story_1: "",
      story_2: "",
      story_3: "",
      graphic_text: "",
      newsletter_teaser: "",
      email_subject: "",
      email_body: "",
      notes: $("notes").value || "[DO UZUPEŁNIENIA]"
    },
    language_versions: {
      pl: { facebook_post: "", instagram_post: "", story_1: "", story_2: "", graphic_text: "" },
      pt_br: { facebook_post: "", instagram_post: "", story_1: "", story_2: "", graphic_text: "" }
    },
    metadata: {
      hashtags: ["#MTSŻory", "#MiastoOgnia", "#wdrodzeposukces"],
      people,
      teams: [],
      competition: "",
      season: "2026/2027",
      date: $("date").value || "[DO UZUPEŁNIENIA]",
      created_by: "MTS Mobile Content Engine",
      approval_owner: "Daniel",
      priority: "normal",
      languages: ptbr ? ["pl", "pt_br"] : ["pl"],
      translation_mode: ptbr ? "cultural_adaptation" : "none",
      mobile_first: true
    },
    missing_data: []
  };
}

function render() {
  $("output").value = JSON.stringify(buildPayload(), null, 2);
  $("status").textContent = "JSON gotowy.";
}

$("generate").onclick = render;

$("copy").onclick = async () => {
  render();
  await navigator.clipboard.writeText($("output").value);
  $("status").textContent = "Skopiowano JSON.";
};

$("clear").onclick = () => {
  ["title", "source_url", "facts", "people", "date", "notes", "webhook_url"].forEach((id) => ($(id).value = ""));
  $("ptbr").checked = false;
  $("status").textContent = "Wyczyszczono formularz.";
  $("output").value = "";
};

$("send").onclick = async () => {
  render();
  const makeWebhookUrl = $("webhook_url").value.trim();
  if (!makeWebhookUrl) {
    $("status").textContent = "Dodaj webhook URL.";
    return;
  }
  if (!confirm("Wysłać brief do Make?")) return;
  try {
    const res = await fetch(WORKER_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        make_webhook_url: makeWebhookUrl,
        payload: buildPayload()
      })
    });
    const text = await res.text();
    let message = text;
    try {
      const data = JSON.parse(text);
      message = data.message || data.error || text;
    } catch (e) {
      message = text || `Status: ${res.status}`;
    }
    if (res.ok) {
      $("status").textContent = message || "Wysłano poprawnie.";
    } else {
      $("status").textContent = message || "Wysyłka nie powiodła się.";
    }
  } catch (e) {
    $("status").textContent = "Błąd wysyłki przez Worker.";
  }
};
