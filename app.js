const $ = (id) => document.getElementById(id);
const WORKER_PROXY_URL = "https://mts-make-proxy.dasztemborski.workers.dev/";

function checkedLabels(ids, labels) {
  return ids.filter((id) => $(id).checked).map((id) => labels[id]);
}

function getChannels() {
  return checkedLabels(
    ["channel_www", "channel_facebook", "channel_instagram", "channel_stories", "channel_newsletter", "channel_canva", "channel_inne"],
    {
      channel_www: "strona www",
      channel_facebook: "Facebook",
      channel_instagram: "Instagram",
      channel_stories: "Stories",
      channel_newsletter: "newsletter",
      channel_canva: "Canva / grafika",
      channel_inne: "inne"
    }
  );
}

function getTones() {
  return checkedLabels(
    [
      "tone_newsowy",
      "tone_humanizacja",
      "tone_spokojnie_emocjonalny",
      "tone_premium",
      "tone_szybki_komunikat",
      "tone_reporterski",
      "tone_marketingowy",
      "tone_socialowy",
      "tone_bez_patetyzmu",
      "tone_klubowy"
    ],
    {
      tone_newsowy: "newsowy",
      tone_humanizacja: "humanizacja",
      tone_spokojnie_emocjonalny: "spokojnie emocjonalny",
      tone_premium: "premium",
      tone_szybki_komunikat: "szybki komunikat",
      tone_reporterski: "reporterski",
      tone_marketingowy: "mocny marketingowo",
      tone_socialowy: "lekki socialowy",
      tone_bez_patetyzmu: "bez przesadnego patosu",
      tone_klubowy: "język klubowy MTS Żory"
    }
  );
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

function getSourceLinks() {
  return ["source_url_1", "source_url_2", "source_url_3"]
    .map((id) => $(id).value.trim())
    .filter(Boolean);
}

function getGraphicFormats() {
  return checkedLabels(
    ["graphic_www", "graphic_social", "graphic_square", "graphic_story"],
    {
      graphic_www: "grafika na stronę klubową / hero article — 1280 × 720 px",
      graphic_social: "post Facebook / Instagram — 1080 × 1350 px",
      graphic_square: "kwadrat social media — 1080 × 1080 px",
      graphic_story: "relacja Instagram/Facebook — 1080 × 1920 px"
    }
  );
}

function buildPrompt() {
  const title = $("title").value.trim() || "[DO UZUPEŁNIENIA]";
  const facts = $("facts").value.trim() || "[DO UZUPEŁNIENIA]";
  const people = $("people").value.trim() || "[DO UZUPEŁNIENIA]";
  const notes = $("notes").value.trim() || "[DO UZUPEŁNIENIA]";
  const sourceNotes = $("source_notes").value.trim() || "[DO UZUPEŁNIENIA]";
  const deadline = $("date").value || "[DO UZUPEŁNIENIA]";
  const channels = getChannels().join(", ") || "[DO UZUPEŁNIENIA]";
  const languages = getLanguagesLabel();
  const tones = getTones();
  const sourceLinks = getSourceLinks();
  const needJson = $("need_json").checked ? "tak" : "nie";
  const graphicPrompt = $("graphic_prompt").checked ? "tak" : "nie";
  const graphicJson = $("graphic_json").checked ? "tak" : "nie";
  const graphicFormats = getGraphicFormats();
  const graphicText = $("graphic_text").value.trim() || "[DO UZUPEŁNIENIA]";
  const graphicStyle = $("graphic_style").value;
  const graphicRefs = $("graphic_refs").value.trim() || "[DO UZUPEŁNIENIA]";
  const prompt = [
    "Jesteś asystentem treści dla MTS Żory.",
    "Przygotuj uporządkowany brief i finalny prompt do Custom GPT.",
    "Zachowaj naturalny, polski styl bez sztucznego tonu AI.",
    "Jeśli brakuje danych, oznacz je jako [DO UZUPEŁNIENIA] i nie zgaduj faktów.",
    "Zwróć wynik jako draft wymagający akceptacji.",
    "Status: draft.",
    "requires_approval: true.",
    `Typ materiału: ${getMaterialTypeLabel()}.`,
    `Kanały publikacji: ${channels}.`,
    `Język: ${languages}.`,
    `Ton komunikacji: ${tones.length ? tones.join(" + ") : "[DO UZUPEŁNIENIA]"}.`,
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
    `- Najważniejsze fakty: ${facts}.`,
    `- Osoby / zawodniczki / drużyny: ${people}.`,
    `- Deadline: ${deadline}.`,
    `- Dodatkowe wymagania: ${notes}.`,
    `- Dodatkowe źródła / notatki do źródeł: ${sourceNotes}.`
  ];

  if (sourceLinks.length) {
    prompt.push("", "Linki źródłowe:");
    sourceLinks.forEach((link, index) => {
      prompt.push(`- Link ${index + 1}: ${link}`);
    });
  }

  if ($("graphic_prompt").checked || $("graphic_json").checked || graphicFormats.length || $("graphic_text").value.trim() || $("graphic_refs").value.trim()) {
    prompt.push(
      "",
      "ZADANIE GRAFICZNE:",
      `- Potrzebuję promptu do grafiki: ${graphicPrompt}.`,
      `- Potrzebuję JSON/specyfikacji grafiki: ${graphicJson}.`,
      `- Format(y): ${graphicFormats.length ? graphicFormats.join(" | ") : "[DO UZUPEŁNIENIA]"}.`,
      `- Tekst na grafice: ${graphicText}.`,
      `- Styl grafiki: ${graphicStyle}.`,
      `- Zdjęcia / materiały referencyjne: ${graphicRefs}.`,
      "- Przygotuj osobny prompt do grafiki na stronę klubową i osobny prompt do social media.",
      "- Zachowaj spójność stylistyczną między formatami, ale dopasuj kompozycję do rozmiaru.",
      "- Jeśli podano zdjęcia referencyjne, trzymaj twarze, stroje, logotypy i detale zgodnie z referencjami.",
      "- W grafice nie wymyślaj detali, których nie ma w źródłach.",
      "- Jeśli JSON/specyfikacja jest potrzebna, opisz format, rozmiar, cel grafiki, tekst na grafice, styl, elementy obowiązkowe, elementy zakazane, źródła/referencje oraz warianty: www, social, story."
    );
  }

  prompt.push(
    "",
    "Jeśli zwracasz treść, przygotuj ją gotową do użycia w Custom GPT.",
    "Jeśli zwracasz JSON, przygotuj go w sposób uporządkowany i zgodny z briefem."
  );

  return prompt.join("\n");
}

function buildArchivePayload() {
  const people = $("people").value.split(",").map((s) => s.trim()).filter(Boolean);
  const ptbr = $("lang_ptbr").checked;
  const briefText = $("facts").value || "[DO UZUPEŁNIENIA]";
  const briefTitle = $("title").value || "[DO UZUPEŁNIENIA]";
  const sourceLinks = getSourceLinks();
  const tones = getTones();
  const graphicFormats = getGraphicFormats();
  const graphicEnabled = $("graphic_prompt").checked || $("graphic_json").checked || graphicFormats.length > 0 || $("graphic_text").value.trim() || $("graphic_refs").value.trim();
  return {
    project: "MTS Żory",
    workflow_type: $("workflow_type").value,
    status: "draft",
    requires_approval: true,
    source: {
      type: "manual",
      url: sourceLinks[0] || "",
      title: briefTitle,
      source_notes: [$("source_notes").value.trim() || briefText].filter(Boolean).join("\n")
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
      graphic_text: $("graphic_text").value.trim() || "",
      newsletter_teaser: "",
      email_subject: "",
      email_body: "",
      notes: $("notes").value || "[DO UZUPEŁNIENIA]"
    },
    language_versions: {
      pl: { facebook_post: "", instagram_post: "", story_1: "", story_2: "", graphic_text: $("graphic_text").value.trim() || "" },
      pt_br: { facebook_post: "", instagram_post: "", story_1: "", story_2: "", graphic_text: $("graphic_text").value.trim() || "" }
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
      mobile_first: true,
      tones,
      source_links: sourceLinks,
      graphic: graphicEnabled ? {
        prompt_needed: $("graphic_prompt").checked,
        json_needed: $("graphic_json").checked,
        formats: graphicFormats,
        text: $("graphic_text").value.trim() || "",
        style: $("graphic_style").value,
        references: $("graphic_refs").value.trim() || ""
      } : {}
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
    "source_url_1",
    "source_url_2",
    "source_url_3",
    "source_notes",
    "facts",
    "people",
    "date",
    "notes",
    "webhook_url",
    "graphic_text",
    "graphic_refs"
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
    "need_json",
    "graphic_prompt",
    "graphic_json",
    "graphic_www",
    "graphic_social",
    "graphic_square",
    "graphic_story",
    "tone_newsowy",
    "tone_humanizacja",
    "tone_spokojnie_emocjonalny",
    "tone_premium",
    "tone_szybki_komunikat",
    "tone_reporterski",
    "tone_marketingowy",
    "tone_socialowy",
    "tone_bez_patetyzmu",
    "tone_klubowy"
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
