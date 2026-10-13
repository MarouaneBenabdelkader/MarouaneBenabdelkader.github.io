import type { T } from "./types";

/** What a step does, shown as a colour and in the legend. */
export type StageKind = "io" | "ai" | "logic" | "data" | "app";
/** One box in a pipeline diagram. `tools` names the tech used at that step. */
export type Stage = { kind: StageKind; label: T; detail: T; tools?: string };
/** A diagram is a sequence of steps; a step with several stages runs them side by side. */
export type Diagram = Stage[][];

export const diagrams: Record<string, Diagram> = {
  "parenting-ai-orientation": [
    [
      { kind: "io", label: { en: "127 documents", fr: "127 documents" }, detail: { en: "PDF, Word, slides, scans", fr: "PDF, Word, slides, scans" } },
    ],
    [
      { kind: "logic", label: { en: "Extract & OCR", fr: "Extraction & OCR" }, detail: { en: "Layout-aware parsing", fr: "Analyse de mise en page" }, tools: "MinerU" },
    ],
    [
      { kind: "ai", label: { en: "Chunk & embed", fr: "Découpage & embeddings" }, detail: { en: "Heading context kept per chunk", fr: "Contexte des titres conservé" }, tools: "OpenAI embeddings" },
    ],
    [
      { kind: "data", label: { en: "Vector store", fr: "Base vectorielle" }, detail: { en: "Thematic collections", fr: "Collections thématiques" }, tools: "Supabase pgvector" },
    ],
    [
      { kind: "ai", label: { en: "Orientation agent", fr: "Agent d'orientation" }, detail: { en: "3 branches, rule-based score", fr: "3 branches, score par règles" }, tools: "Express, GPT-5 nano" },
      { kind: "ai", label: { en: "RAG expert", fr: "Expert RAG" }, detail: { en: "Cited answers + confidence", fr: "Réponses sourcées + confiance" }, tools: "n8n AI Agent" },
    ],
    [
      { kind: "app", label: { en: "Web app", fr: "Application web" }, detail: { en: "Roles, Stripe, partner codes", fr: "Rôles, Stripe, codes partenaires" }, tools: "React, Supabase Auth" },
    ],
  ],
  "technical-spec-generator": [
    [
      { kind: "app", label: { en: "Chat request", fr: "Demande en chat" }, detail: { en: "General or generation mode", fr: "Mode général ou génération" }, tools: "Next.js" },
    ],
    [
      { kind: "ai", label: { en: "Manager agent", fr: "Agent Manager" }, detail: { en: "Routes mode, owns the state machine", fr: "Route le mode, pilote la machine à états" }, tools: "OpenAI tools" },
    ],
    [
      { kind: "data", label: { en: "Standards RAG", fr: "RAG sur les normes" }, detail: { en: "35 fascicules, MinerU + LangChain", fr: "35 fascicules, MinerU + LangChain" }, tools: "pgvector" },
      { kind: "data", label: { en: "Web search", fr: "Recherche web" }, detail: { en: "Fresh references", fr: "Références récentes" }, tools: "Tavily" },
    ],
    [
      { kind: "app", label: { en: "Editable outline", fr: "Sommaire éditable" }, detail: { en: "User confirms structure", fr: "L'utilisateur valide la structure" } },
    ],
    [
      { kind: "ai", label: { en: "Writer agent", fr: "Agent Writer" }, detail: { en: "1 call per chapter, in parallel, cached prefix", fr: "1 appel par chapitre, en parallèle, préfixe en cache" }, tools: "SSE progress" },
    ],
    [
      { kind: "app", label: { en: "Editor & export", fr: "Éditeur & export" }, detail: { en: "Section edits, PDF and Word", fr: "Retouches, PDF et Word" }, tools: "TipTap, XeLaTeX" },
    ],
  ],
  "b2b-prospecting-agent": [
    [
      { kind: "io", label: { en: "Request in French", fr: "Demande en français" }, detail: { en: "\"8 steel companies in Normandy\"", fr: "« 8 entreprises sidérurgiques en Normandie »" } },
    ],
    [
      { kind: "ai", label: { en: "Criteria", fr: "Critères" }, detail: { en: "Industry codes, regions, limit", fr: "Codes NAF, départements, volume" }, tools: "Mistral" },
    ],
    [
      { kind: "ai", label: { en: "Registry search loop", fr: "Boucle de recherche registre" }, detail: { en: "Relaxes a criterion when empty", fr: "Relâche un critère si vide" }, tools: "LangChain ReAct" },
    ],
    [
      { kind: "logic", label: { en: "Exclusions", fr: "Exclusions" }, detail: { en: "Existing customers removed", fr: "Clients existants retirés" }, tools: "CRM mirror" },
    ],
    [
      { kind: "logic", label: { en: "Scoring", fr: "Scoring" }, detail: { en: "Weighted arithmetic, explainable", fr: "Arithmétique pondérée, explicable" }, tools: "JSON weights" },
      { kind: "data", label: { en: "Signals", fr: "Signaux" }, detail: { en: "Growth & buying intent", fr: "Croissance & intention d'achat" }, tools: "Apollo, Tavily" },
    ],
    [
      { kind: "ai", label: { en: "Decision-makers & angle", fr: "Décideurs & angle" }, detail: { en: "Top prospects only, capped", fr: "Meilleurs prospects, plafonné" }, tools: "Unipile, Qdrant" },
    ],
  ],
  "payment-reminder-agent": [
    [
      { kind: "io", label: { en: "Aged receivables", fr: "Balance âgée" }, detail: { en: "Daily Excel export", fr: "Export Excel quotidien" } },
      { kind: "io", label: { en: "Contacts & PDFs", fr: "Contacts & PDF" }, detail: { en: "Network share", fr: "Partage réseau" } },
    ],
    [
      { kind: "logic", label: { en: "Sequence engine", fr: "Moteur de séquence" }, detail: { en: "-3, 0, +7, +21 days, business days only", fr: "J-3, J, J+7, J+21, jours ouvrés" }, tools: "Journal" },
    ],
    [
      { kind: "logic", label: { en: "Match & group", fr: "Rapprochement & regroupement" }, detail: { en: "Fuzzy client match, one email per client", fr: "Rapprochement flou, un email par client" }, tools: "RapidFuzz" },
    ],
    [
      { kind: "app", label: { en: "Validation dashboard", fr: "Tableau de bord de validation" }, detail: { en: "Review, edit, approve", fr: "Relire, modifier, approuver" }, tools: "Next.js, Supabase" },
    ],
    [
      { kind: "io", label: { en: "Send", fr: "Envoi" }, detail: { en: "Outlook mailbox", fr: "Boîte Outlook" }, tools: "Microsoft Graph" },
    ],
    [
      { kind: "io", label: { en: "Replies & payments", fr: "Réponses & paiements" }, detail: { en: "Pause on reply, stop when paid", fr: "Pause si réponse, arrêt si payé" } },
    ],
  ],
  "news-to-avatar-video": [
    [
      { kind: "io", label: { en: "5 trade media", fr: "5 médias spécialisés" }, detail: { en: "Weekly window, de-duplicated", fr: "Fenêtre hebdo, dédoublonnée" }, tools: "BeautifulSoup" },
    ],
    [
      { kind: "ai", label: { en: "Classify", fr: "Classification" }, detail: { en: "Relevance, country, audience, priority", fr: "Pertinence, pays, cible, priorité" }, tools: "GPT" },
    ],
    [
      { kind: "ai", label: { en: "Script studio", fr: "Studio de script" }, detail: { en: "Selection, TTS-safe script", fr: "Sélection, script adapté à la voix" }, tools: "GPT" },
    ],
    [
      { kind: "ai", label: { en: "Avatar video", fr: "Vidéo avatar" }, detail: { en: "Generation + SRT timings", fr: "Génération + timings SRT" }, tools: "HeyGen" },
    ],
    [
      { kind: "logic", label: { en: "Post-production", fr: "Post-production" }, detail: { en: "Karaoke subtitles, stored", fr: "Sous-titres karaoké, stockage" }, tools: "FFmpeg" },
    ],
    [
      { kind: "io", label: { en: "LinkedIn", fr: "LinkedIn" }, detail: { en: "Post + video (next)", fr: "Post + vidéo (à venir)" } },
    ],
  ],
  "maison-salah": [
    [
      { kind: "io", label: { en: "Visitor", fr: "Visiteur" }, detail: { en: "Investor abroad, FR or EN", fr: "Investisseur à l'étranger, FR ou EN" } },
    ],
    [
      { kind: "app", label: { en: "Process & services", fr: "Processus & services" }, detail: { en: "How buying works", fr: "Comment se passe l'achat" } },
      { kind: "app", label: { en: "Before / after", fr: "Avant / après" }, detail: { en: "Sliders and galleries", fr: "Curseurs et galeries" } },
      { kind: "app", label: { en: "Testimonials", fr: "Témoignages" }, detail: { en: "Clients from 4 countries", fr: "Clients de 4 pays" } },
    ],
    [
      { kind: "app", label: { en: "Consultation form", fr: "Formulaire de consultation" }, detail: { en: "Budget, project type, WhatsApp", fr: "Budget, type de projet, WhatsApp" } },
    ],
    [
      { kind: "io", label: { en: "Qualified lead", fr: "Contact qualifié" }, detail: { en: "Reply within 48 hours", fr: "Réponse sous 48 heures" } },
    ],
  ],
};
