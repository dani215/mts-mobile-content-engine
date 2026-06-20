const $ = (id) => document.getElementById(id);

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
  const url = $("webhook_url").value;
  if (!url) {
    $("status").textContent = "Dodaj webhook URL.";
    return;
  }
  if (!confirm("Wysłać brief do Make?")) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: $("output").value
    });
    $("status").textContent = `Wysłano. Status: ${res.status}`;
  } catch (e) {
    $("status").textContent = "Błąd wysyłki.";
  }
};
