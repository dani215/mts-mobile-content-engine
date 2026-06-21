const $ = (id) => document.getElementById(id);
const WORKER_PROXY_URL = "https://mts-make-proxy.dasztemborski.workers.dev/";

function getChannels() {
  const channels = [];
  if ($("channel_www").checked) channels.push("strona www");
  if ($("channel_facebook").checked) channels.push("Facebook");
  if ($("channel_instagram").checked) channels.push("Instagram");
  if ($("channel_stories").checked) channels.push("Stories");
  if ($("channel_newsletter").checked) channels.push("newsletter");
  if ($("channel_canva").checked) channels.push("Canva / grafika");
  if ($("channel_inne").checked) channels.push("inne");
  return channels;
}

function getLanguagesLabel() {
  const langs = [];
  if ($("lang_pl").checked) langs.push("polski");
  if ($("lang_ptbr").checked) langs.push("PT-BR");
  return langs.length ? langs.join(" + ") : "polski";
}

function getMaterialTypeLabel() {
  const map = {
    article_to_social: "artykuł",
    post_facebook: "post Facebook",
    post_instagram: "post Instagram",
    event_brief: "relacja",
    newsletter: "newsletter",
    graphic_brief: "brief graficzny",
    campaign_brief: "kampania",
    marketing_material: "materiał marketingowy",
    pt_br_adaptation: "wersja PT-BR"
  };
  return map[$("workflow_type").value] || "materiał";
}

function buildPrompt() {
  const title = $("title").value.trim() || "[DO UZUPEŁNIENIA]";
  const source = $("source_url").value.trim() || "[DO UZUPEŁNIENIA]";
  const facts = $("facts").value.trim() || "[DO UZUPEŁNIENIA]";
  const people = $("people").value.trim() || "[DO UZUPEŁNIENIA]";
  const notes = $("notes").value.trim() || "[DO UZUPEŁNIENIA]";
  const deadline = $("date").value || "[DO UZUPEŁNIENIA]";
  const channels = getChannels().join(", ") || "[DO UZUPEŁNIENIA]";
  const languages = getLanguagesLabel();
  const needJson = $("need_json").checked ? "tak" : "nie";
  const materialType = getMaterialTypeLabel();
  const tone = $("tone").value;
  const prompt = [
    "Jesteś asystentem treści dla MTS Żory.",
    "Przygotuj uporządkowany materiał na podstawie briefu poniżej.",
    "Zachowaj naturalny, polski, sportowy styl bez sztucznego tonu AI.",
    "Jeśli brakuje danych, oznacz je jako [DO UZUPEŁNIENIA] i nie zgaduj faktów.",
    "Zwróć wynik jako draft wymagający akceptacji.",
    "Status: draft.",
    "requires_approval: true.",
    `Typ materiału: ${materialType}.`,
    `Kanały publikacji: ${channels}.`,
    `Język: ${languages}.`,
    `Ton komunikacji: ${tone}.`,
    "Humanizacja: wymagana tam, gdzie pasuje do faktów i tonu.",
    `Czy zwrócić JSON do Make: ${needJson}.`,
    "",
    "Kontekst MTS Żory:",
    "- Klub: MTS Żory.",
    "- Nie wymyślaj zawodniczek, wyników, sponsorów, terminarzy ani linków.",
    "- Nie zakładaj automatycznej publikacji.",
    "- Jeśli materiał ma wersję PT-BR, zrób naturalną adaptację kulturową, nie tłumaczenie 1:1.",
    "",
    "Brief:",
    `- Cel materiału: ${title}.`,
    `- Link źródłowy: ${source}.`,
    `- Najważniejsze fakty: ${facts}.`,
    `- Osoby / zawodniczki / drużyny: ${people}.`,
    `- Deadline: ${deadline}.`,
    `- Dodatkowe wymagania: ${notes}.`,
    "",
    "Jeśli zwracasz treść, przygotuj ją gotową do użycia w Custom GPT.",
    "Jeśli zwracasz JSON, przygotuj go w sposób uporządkowany i zgodny z briefem."
  ];
  return prompt.join("\n");
}

function buildArchivePayload() {
  const people = $("people").value.split(",").map((s) => s.trim()).filter(Boolean);
  const ptbr = $("lang_ptbr").checked;
  const briefText = $("facts").value || "[DO UZUPEŁNIENIA]";
  const briefTitle = $("title").value || "[DO UZUPEŁNIENIA]";
  return {
    project: "MTS Żory",
    workflow_type: $("workflow_type").value,
    status: "draft",
    requires_approval: true,
    source: {
      type: "manual",
      url: $("source_url").value,
      title: briefTitle,
      source_notes: briefText
    },
    content: {
      title: briefTitle,
      lead: "Brief do promptu dla Custom GPT.",
      article: briefText,
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

function renderPrompt() {
  $("output").value = buildPrompt();
  $("status").textContent = "Prompt gotowy do skopiowania.";
}

$("generate").onclick = renderPrompt;

$("copy").onclick = async () => {
  renderPrompt();
  await navigator.clipboard.writeText($("output").value);
  $("status").textContent = "Skopiowano prompt.";
};

$("clear").onclick = () => {
  [
    "title",
    "source_url",
    "facts",
    "people",
    "date",
    "notes",
    "webhook_url"
  ].forEach((id) => ($(id).value = ""));
  [
    "channel_www",
    "channel_facebook",
    "channel_instagram",
    "channel_stories",
    "channel_newsletter",
    "channel_canva",
    "channel_inne",
    "lang_ptbr",
    "need_json"
  ].forEach((id) => ($(id).checked = false));
  $("lang_pl").checked = true;
  $("status").textContent = "Wyczyszczono formularz.";
  $("output").value = "";
};

$("send").onclick = async () => {
  const makeWebhookUrl = $("webhook_url").value.trim();
  if (!makeWebhookUrl) {
    $("status").textContent = "Dodaj webhook Make, jeśli chcesz archiwizować brief.";
    return;
  }
  if (!confirm("Wysłać brief do Make jako archiwum?")) return;
  try {
    const res = await fetch(WORKER_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        make_webhook_url: makeWebhookUrl,
        payload: buildArchivePayload()
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
    $("status").textContent = res.ok ? message || "Brief zapisany w Make." : message || "Archiwum nie zostało wysłane.";
  } catch (e) {
    $("status").textContent = "Błąd wysyłki przez Worker.";
  }
};
