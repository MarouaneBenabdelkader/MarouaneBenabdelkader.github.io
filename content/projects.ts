import type { Project } from "./types";

// Codito Ergo Sum clients are anonymized by sector: no client, product or person names here.
export const projects: Project[] = [
  {
    slug: "parenting-ai-orientation",
    kind: "codito",
    title: {
      en: "AI orientation agent & RAG expert for a parenting-wellbeing platform",
      fr: "Agent d'orientation IA & expert RAG pour une plateforme de bien-être parental",
    },
    sector: { en: "Parenting & workplace wellbeing", fr: "Parentalité & bien-être au travail" },
    summary: {
      en: "A conversational scoring agent that routes parents to the right training module, plus a premium AI expert grounded in ~14,700 pages of proprietary course material.",
      fr: "Un agent conversationnel de scoring qui oriente les parents vers le bon module de formation, et un expert IA premium ancré dans ~14 700 pages de contenus propriétaires.",
    },
    stack: ["n8n", "OpenAI", "Supabase pgvector", "MinerU OCR", "React", "Stripe"],
    context: {
      en: "The client sells parenting and wellbeing programs to individuals and, through employers, to their staff. Its static orientation form converted poorly and its large training library was invisible to members.",
      fr: "Le client propose des programmes de parentalité et de bien-être aux particuliers et, via les employeurs, à leurs salariés. Son formulaire d'orientation statique convertissait mal et sa vaste bibliothèque de formations restait invisible pour les membres.",
    },
    problem: {
      en: "Replace the form with an engaging agent that still produces a reliable score, and make 127 heterogeneous documents (PDF, Word, PowerPoint, scanned images) answerable, with sources, for paying members.",
      fr: "Remplacer le formulaire par un agent engageant qui produise malgré tout un score fiable, et rendre interrogeables, avec leurs sources, 127 documents hétérogènes (PDF, Word, PowerPoint, images scannées) pour les membres payants.",
    },
    built: [
      {
        en: "Free tier: a 10-question orientation agent with suggestion buttons or free-text answers; free text is analysed for sentiment and keywords and folded into the score, then the agent recommends a training module.",
        fr: "Offre gratuite : un agent d'orientation en 10 questions, avec boutons de suggestion ou réponse libre ; le texte libre est analysé (sentiment, mots-clés) et intégré au score, puis l'agent recommande un module de formation.",
      },
      {
        en: "Ingestion pipeline: OCR and layout extraction with MinerU, hierarchy-aware chunking (H1 > H2 > H3 context), OpenAI embeddings stored in Supabase pgvector, split into thematic collections.",
        fr: "Pipeline d'ingestion : OCR et extraction de mise en page avec MinerU, découpage tenant compte de la hiérarchie (contexte H1 > H2 > H3), embeddings OpenAI stockés dans Supabase pgvector, répartis en collections thématiques.",
      },
      {
        en: "Premium tier: a RAG expert orchestrated in n8n that answers only from the corpus, cites document and collection, and returns a confidence level (high / medium / low / off-topic).",
        fr: "Offre premium : un expert RAG orchestré dans n8n qui répond uniquement à partir du corpus, cite document et collection, et renvoie un niveau de confiance (haute / moyenne / faible / hors sujet).",
      },
      {
        en: "Freemium access: Stripe paywall for individuals and partner codes that unlock premium for employees of B2B customers.",
        fr: "Accès freemium : paywall Stripe pour les particuliers et codes partenaires qui débloquent le premium pour les salariés des entreprises clientes.",
      },
    ],
    decisions: [
      {
        title: { en: "Scoring stays deterministic", fr: "Un scoring déterministe" },
        body: {
          en: "The LLM interprets free-text answers into signals, but the score itself is computed by code, so the same answers always lead to the same recommendation.",
          fr: "Le LLM interprète les réponses libres en signaux, mais le score est calculé par du code : les mêmes réponses mènent toujours à la même recommandation.",
        },
      },
      {
        title: { en: "Separate pipeline for images", fr: "Un pipeline dédié aux images" },
        body: {
          en: "Scanned diagrams and slides go through OCR, cleaning and short chunks tagged as OCR-sourced, so noisy text doesn't drown out the long-form course material.",
          fr: "Schémas scannés et slides passent par OCR, nettoyage et découpage court avec une métadonnée d'origine OCR, pour que ce texte bruité n'écrase pas les contenus de fond.",
        },
      },
      {
        title: { en: "Answers must cite or abstain", fr: "Citer ou s'abstenir" },
        body: {
          en: "A structured output schema forces sources and a confidence level on every answer; out-of-scope questions are explicitly flagged instead of improvised.",
          fr: "Un schéma de sortie structuré impose des sources et un niveau de confiance à chaque réponse ; les questions hors périmètre sont signalées au lieu d'être improvisées.",
        },
      },
    ],
    status: {
      en: "Built: orientation agent and RAG expert over 127 documents (~14,700 pages).",
      fr: "Réalisé : agent d'orientation et expert RAG sur 127 documents (~14 700 pages).",
    },
  },
  {
    slug: "technical-spec-generator",
    kind: "codito",
    title: {
      en: "AI assistant & 30-page technical-spec generator for landscape and civil engineers",
      fr: "Assistant IA & générateur de CCTP de 30 pages pour paysagistes et ingénieurs VRD",
    },
    sector: { en: "Landscape architecture & civil engineering", fr: "Paysage & ingénierie VRD" },
    summary: {
      en: "A chat app that answers questions on French public-works standards and drafts full technical specification documents (CCTP) chapter by chapter, with a live editor and PDF/Word export.",
      fr: "Une application de chat qui répond aux questions sur les normes des marchés publics de travaux et rédige des CCTP complets chapitre par chapitre, avec éditeur en direct et export PDF/Word.",
    },
    stack: ["Next.js", "FastAPI", "OpenAI", "Supabase pgvector", "Tavily", "TipTap", "LaTeX"],
    context: {
      en: "Landscape architects, civil (VRD) engineers and urban planners write CCTP documents (technical clauses for public tenders) that run past 30 pages and must stay consistent with the CCTG standards.",
      fr: "Paysagistes, ingénieurs VRD et urbanistes rédigent des CCTP de plus de 30 pages qui doivent rester cohérents avec les normes du CCTG et des fascicules.",
    },
    problem: {
      en: "A single LLM prompt can't produce a coherent 30-page document: it truncates, drifts, and is slow and expensive. Users also need to steer the structure and edit any section afterwards.",
      fr: "Un seul prompt ne peut pas produire un document cohérent de 30 pages : il tronque, dérive, et coûte cher en temps comme en tokens. Les utilisateurs doivent aussi piloter la structure et retoucher chaque section ensuite.",
    },
    built: [
      {
        en: "General mode: a RAG assistant over the standards corpus (pgvector) with web search via Tavily, rendering tables and equations natively.",
        fr: "Mode général : un assistant RAG sur le corpus de normes (pgvector) avec recherche web via Tavily, et rendu natif des tableaux et équations.",
      },
      {
        en: "Generation mode: a Manager agent runs discovery questions, proposes an editable table of contents, then a Writer agent generates every chapter in parallel.",
        fr: "Mode génération : un agent Manager mène les questions de cadrage, propose un sommaire éditable, puis un agent Writer génère tous les chapitres en parallèle.",
      },
      {
        en: "Split-view workspace: chat on the left, a Notion-style TipTap editor on the right, with live progress over Server-Sent Events.",
        fr: "Espace de travail en vue partagée : chat à gauche, éditeur TipTap façon Notion à droite, progression en direct via Server-Sent Events.",
      },
      {
        en: "Targeted AI rewrites of a single section, manual edits, and export to PDF (XeLaTeX) and Word (python-docx).",
        fr: "Réécriture IA ciblée d'une section, édition manuelle, et export PDF (XeLaTeX) et Word (python-docx).",
      },
    ],
    decisions: [
      {
        title: { en: "A persisted state machine", fr: "Une machine à états persistée" },
        body: {
          en: "INIT → DISCOVERY → STRUCTURE_PROPOSED → GENERATING → POST_GENERATION lives on the conversation row, so a reload or a crash never loses where the user was. Off-topic questions are delegated to general mode transparently.",
          fr: "INIT → DISCOVERY → STRUCTURE_PROPOSED → GENERATING → POST_GENERATION est stocké sur la conversation : un rechargement ou un crash ne perd jamais l'étape en cours. Les questions hors sujet sont déléguées au mode général de façon transparente.",
        },
      },
      {
        title: { en: "One LLM call per chapter, cached prefix", fr: "Un appel LLM par chapitre, préfixe en cache" },
        body: {
          en: "Chapters are generated in parallel behind a semaphore, and every call shares an identical system prefix so provider-side prompt caching cuts latency and cost.",
          fr: "Les chapitres sont générés en parallèle derrière un sémaphore, et chaque appel partage un préfixe système identique pour profiter du cache de prompt du fournisseur et réduire latence et coût.",
        },
      },
      {
        title: { en: "RAG only where it pays", fr: "Du RAG seulement là où il sert" },
        body: {
          en: "Retrieval is pre-fetched in parallel only for technical chapters; administrative chapters skip it.",
          fr: "La recherche documentaire est préchargée en parallèle uniquement pour les chapitres techniques ; les chapitres administratifs s'en passent.",
        },
      },
      {
        title: { en: "Export that never fails", fr: "Un export qui n'échoue jamais" },
        body: {
          en: "Generated Markdown is sanitised before XeLaTeX; if compilation still fails, a pure-Python PDF fallback takes over.",
          fr: "Le Markdown généré est assaini avant XeLaTeX ; si la compilation échoue malgré tout, un rendu PDF en Python pur prend le relais.",
        },
      },
    ],
    status: {
      en: "In production on the client's server.",
      fr: "En production sur le serveur du client.",
    },
  },
  {
    slug: "b2b-prospecting-agent",
    kind: "codito",
    title: {
      en: "Agentic B2B prospecting engine for an engineering firm",
      fr: "Moteur de prospection B2B agentique pour un bureau d'ingénierie",
    },
    sector: { en: "Industrial engineering", fr: "Ingénierie industrielle" },
    summary: {
      en: "Sales reps type a request in plain French and get ranked prospect companies, each with an explainable score, buying signals, decision-makers and a suggested approach angle.",
      fr: "Les commerciaux formulent une demande en français et obtiennent des entreprises prospects classées, chacune avec un score explicable, des signaux d'achat, les décideurs et un angle d'approche.",
    },
    stack: ["Next.js", "TypeScript", "LangChain", "Mistral", "Qdrant", "SQLite", "Pappers", "Apollo", "Unipile"],
    context: {
      en: "An engineering firm wanted its sales team to find companies that look like its best customers, without hours of manual searching across registries, CRMs and LinkedIn.",
      fr: "Un bureau d'ingénierie voulait que son équipe commerciale trouve des entreprises ressemblant à ses meilleurs clients, sans des heures de recherche manuelle entre registres, CRM et LinkedIn.",
    },
    problem: {
      en: "Turn a vague request into precise registry queries, exclude existing customers, and rank results in a way a salesperson can trust and audit, all while keeping paid API quotas under control.",
      fr: "Transformer une demande floue en requêtes précises sur le registre des entreprises, exclure les clients existants et classer les résultats d'une façon auditable et digne de confiance, tout en maîtrisant les quotas d'API payantes.",
    },
    built: [
      {
        en: "Criteria extraction: Mistral reads the request into industry codes, regions and a limit, validated against a sector table.",
        fr: "Extraction des critères : Mistral traduit la demande en codes NAF, départements et volume, validés contre une table de secteurs.",
      },
      {
        en: "A LangChain ReAct loop queries the company registry and decides which criterion to relax when nothing comes back, with a fixed fallback ladder.",
        fr: "Une boucle ReAct LangChain interroge le registre des entreprises et décide quel critère relâcher quand rien ne remonte, avec une échelle de repli fixe.",
      },
      {
        en: "Nightly CRM sync, entity resolution and calibration that derives the ideal-customer profile from past deals, indexed in Qdrant.",
        fr: "Synchronisation nocturne du CRM, résolution d'entités et calibration qui déduit le profil client idéal à partir de l'historique des affaires, indexé dans Qdrant.",
      },
      {
        en: "Enrichment: growth and buying signals (Apollo, Tavily) on a shortlist, LinkedIn decision-makers via Unipile, and a short approach angle per prospect.",
        fr: "Enrichissement : signaux de croissance et d'achat (Apollo, Tavily) sur une présélection, décideurs LinkedIn via Unipile, et un angle d'approche court par prospect.",
      },
      {
        en: "Admin console: versioned system prompt, live-editable scoring weights, and a one-click probe of every external API.",
        fr: "Console d'administration : prompt système versionné, pondérations de scoring modifiables à chaud et test de toutes les API externes en un clic.",
      },
    ],
    decisions: [
      {
        title: { en: "Scoring is arithmetic, never the model", fr: "Le score est arithmétique, jamais le modèle" },
        body: {
          en: "Sector, geography, size, age, revenue, growth, deal history and signals are weighted in code from a JSON config, so every score is explainable and reproducible.",
          fr: "Secteur, géographie, taille, ancienneté, chiffre d'affaires, croissance, historique et signaux sont pondérés par du code à partir d'une config JSON : chaque score est explicable et reproductible.",
        },
      },
      {
        title: { en: "Hard limits are code, not prompts", fr: "Les limites sont du code, pas des prompts" },
        body: {
          en: "The LinkedIn lookup cap and the rule that an approach text never names an existing customer are enforced outside the LLM.",
          fr: "Le plafond de recherches LinkedIn et la règle selon laquelle un angle d'approche ne cite jamais un client existant sont appliqués hors du LLM.",
        },
      },
      {
        title: { en: "Test data can never pass as real", fr: "Une donnée de test ne passe jamais pour réelle" },
        body: {
          en: "A fixtures mode avoids spending registry credits in development; fixture results are labelled in the UI and production refuses to boot with fixtures on.",
          fr: "Un mode fixtures évite de consommer des crédits en développement ; ces résultats sont étiquetés dans l'interface et la production refuse de démarrer avec ce mode activé.",
        },
      },
      {
        title: { en: "No native build step", fr: "Aucune compilation native" },
        body: {
          en: "SQLite comes from Node's built-in node:sqlite, so installs never need a C++ toolchain on the client's machines.",
          fr: "SQLite provient du module natif node:sqlite de Node : l'installation ne requiert jamais de chaîne de compilation C++ sur les machines du client.",
        },
      },
    ],
    status: {
      en: "Prospecting agent in production; a quote-generation agent is planned next.",
      fr: "Agent de prospection en production ; un agent de génération de devis est prévu ensuite.",
    },
  },
  {
    slug: "payment-reminder-agent",
    kind: "codito",
    title: {
      en: "Automated payment-reminder agent for a construction group",
      fr: "Agent de relance automatisée des impayés pour un groupe du BTP",
    },
    sector: { en: "Construction (BTP)", fr: "BTP" },
    summary: {
      en: "Every business day the agent reads the aged-receivables spreadsheet, decides which invoices to chase, and prepares one consolidated, graduated reminder per client with the invoice PDFs attached.",
      fr: "Chaque jour ouvré, l'agent lit la balance âgée, décide quelles factures relancer et prépare une relance graduée et consolidée par client, factures PDF jointes.",
    },
    stack: ["Python", "FastAPI", "Next.js", "Microsoft Graph", "RapidFuzz", "SQLite", "pytest"],
    context: {
      en: "A multi-entity construction group issues about a hundred invoices a month and a third go overdue. Reminders were manual, late and untracked, and the ERP and accounting software expose no API.",
      fr: "Un groupe du BTP à plusieurs entités émet une centaine de factures par mois, dont un tiers passe en retard. Les relances étaient manuelles, tardives et non suivies, et l'ERP comme le logiciel comptable n'offrent aucune API.",
    },
    problem: {
      en: "Automate a reliable reminder sequence from plain Excel exports and a network share, without ever spamming a client, double-sending, or chasing an invoice that was just paid.",
      fr: "Automatiser une séquence de relance fiable à partir de simples exports Excel et d'un partage réseau, sans jamais harceler un client, envoyer deux fois ou relancer une facture tout juste payée.",
    },
    built: [
      {
        en: "A four-stage sequence (3 days before due date, due date, +7, +21) that skips weekends and French public holidays and hands over to a human after the last stage.",
        fr: "Une séquence en quatre temps (J-3, échéance, J+7, J+21) qui ignore week-ends et jours fériés, puis passe la main à un humain après la dernière étape.",
      },
      {
        en: "Fuzzy matching of client names to the contacts file (RapidFuzz, 90% threshold) with an editable override table.",
        fr: "Rapprochement approximatif des noms clients avec le fichier contacts (RapidFuzz, seuil de 90 %) et une table de correspondances éditable.",
      },
      {
        en: "One email per client grouping all overdue invoices, PDFs resolved from the share and verified, sent through Microsoft Graph.",
        fr: "Un email par client regroupant toutes ses factures en retard, PDF retrouvés sur le partage et vérifiés, envoyés via Microsoft Graph.",
      },
      {
        en: "A validation dashboard where the finance team reviews, edits and approves each email; client replies pause the sequence and auto-replies are ignored.",
        fr: "Un tableau de bord de validation où la direction financière relit, modifie et approuve chaque email ; une réponse client met la séquence en pause, les réponses automatiques sont ignorées.",
      },
    ],
    decisions: [
      {
        title: { en: "Paid = the row disappears", fr: "Payé = la ligne disparaît" },
        body: {
          en: "With no API to ask, the source of truth is the daily spreadsheet: an invoice missing from it is closed. The client's file is never modified; all state lives in a separate journal.",
          fr: "Sans API à interroger, la source de vérité est le fichier du jour : une facture qui en disparaît est soldée. Le fichier du client n'est jamais modifié ; tout l'état vit dans un journal séparé.",
        },
      },
      {
        title: { en: "Idempotent by design", fr: "Idempotent par conception" },
        body: {
          en: "Re-running a day never double-sends, a client never gets two emails within 24 hours, and pending drafts are withdrawn and regenerated if an amount changes before approval.",
          fr: "Relancer une journée n'envoie jamais deux fois, un client ne reçoit jamais deux emails en moins de 24 heures, et un brouillon en attente est retiré puis régénéré si un montant change avant validation.",
        },
      },
      {
        title: { en: "Human in the loop first", fr: "L'humain d'abord" },
        body: {
          en: "The agent starts in validation mode; the pre-litigation stage always requires approval, even in full-auto mode. Suspicious due dates in the source block the reminder and raise an alert.",
          fr: "L'agent démarre en mode validation ; l'étape pré-contentieuse exige toujours une approbation, même en mode automatique. Une échéance aberrante dans la source bloque la relance et déclenche une alerte.",
        },
      },
      {
        title: { en: "Tested business rules", fr: "Des règles métier testées" },
        body: {
          en: "Sequence timing, matching, grouping, blocking rules and reply detection are each covered by a pytest suite.",
          fr: "Calendrier de séquence, rapprochement, regroupement, règles de blocage et détection des réponses sont chacun couverts par une suite pytest.",
        },
      },
    ],
    status: {
      en: "Delivered with a human-validation workflow; full automation can be switched on per stage.",
      fr: "Livré avec un circuit de validation humaine ; l'automatisation complète s'active étape par étape.",
    },
  },
  {
    slug: "news-to-avatar-video",
    kind: "codito",
    title: {
      en: "News-to-avatar-video pipeline for a solar energy company",
      fr: "Pipeline de veille vers vidéo avatar pour une entreprise du solaire",
    },
    sector: { en: "Solar energy", fr: "Énergie solaire" },
    summary: {
      en: "Weekly industry news is scraped, classified and turned into a short spoken script, then into a subtitled AI-avatar video ready for LinkedIn.",
      fr: "L'actualité hebdomadaire du secteur est collectée, classée et transformée en script oral court, puis en vidéo avatar IA sous-titrée prête pour LinkedIn.",
    },
    stack: ["Python", "FastAPI", "React", "OpenAI", "HeyGen", "FFmpeg", "Supabase"],
    context: {
      en: "A solar installer wanted a weekly video news brief presented by an AI avatar of its founder, to build an audience on LinkedIn without a film crew.",
      fr: "Un installateur solaire voulait un journal vidéo hebdomadaire présenté par un avatar IA de son fondateur, pour développer son audience LinkedIn sans équipe de tournage.",
    },
    problem: {
      en: "Go from dozens of articles across several trade media to a 3–4 minute video whose script reads naturally aloud and whose subtitles stay in sync.",
      fr: "Passer de dizaines d'articles issus de plusieurs médias spécialisés à une vidéo de 3–4 minutes dont le script sonne naturel à l'oral et dont les sous-titres restent synchronisés.",
    },
    built: [
      {
        en: "Scrapers for five trade media with a Monday-to-today window, URL de-duplication and per-source run tracking.",
        fr: "Scrapers pour cinq médias spécialisés avec une fenêtre du lundi au jour courant, dédoublonnage par URL et suivi des exécutions par source.",
      },
      {
        en: "GPT classification of each article (relevant to solar, concerns France, audience, relevance score) to set priority automatically.",
        fr: "Classification GPT de chaque article (photovoltaïque, concerne la France, cible, score de pertinence) pour fixer la priorité automatiquement.",
      },
      {
        en: "Script studio: pick and reorder articles, generate a structured news script, re-prompt, track tokens and save to a library.",
        fr: "Studio de script : sélection et réordonnancement des articles, génération d'un script structuré, reprompt, suivi des tokens et bibliothèque de scripts.",
      },
      {
        en: "Video production with HeyGen, then FFmpeg post-processing that burns karaoke-style subtitles and stores the result; admin dashboard tracks API usage and real video cost.",
        fr: "Production vidéo avec HeyGen, puis post-traitement FFmpeg qui incruste des sous-titres karaoké et stocke le résultat ; un tableau de bord admin suit l'usage des API et le coût réel des vidéos.",
      },
    ],
    decisions: [
      {
        title: { en: "Write for the ear, not the eye", fr: "Écrire pour l'oreille" },
        body: {
          en: "The script prompt bans symbols and markdown, spells out numbers, units and acronyms, and follows a fixed news-brief structure, because text-to-speech mispronounces everything else.",
          fr: "Le prompt de script proscrit symboles et markdown, écrit en toutes lettres nombres, unités et sigles, et suit une structure de brève fixe, car la synthèse vocale écorche tout le reste.",
        },
      },
      {
        title: { en: "Subtitles from the provider's timings", fr: "Des sous-titres calés sur la source" },
        body: {
          en: "Subtitle timings come from HeyGen's SRT, auto-corrected for drift, and are rendered with the ASS filter for exact audio sync.",
          fr: "Les temps des sous-titres proviennent du SRT de HeyGen, corrigés automatiquement en cas de dérive, et rendus avec le filtre ASS pour une synchronisation exacte.",
        },
      },
      {
        title: { en: "Never depend on expiring URLs", fr: "Ne jamais dépendre d'URL qui expirent" },
        body: {
          en: "Generated videos are copied to our own storage right away, because provider links expire.",
          fr: "Les vidéos générées sont copiées immédiatement dans notre stockage, car les liens du fournisseur expirent.",
        },
      },
    ],
    status: {
      en: "Monitoring, scripting and video phases live; LinkedIn auto-publishing is next.",
      fr: "Veille, script et vidéo en service ; la publication automatique sur LinkedIn est la prochaine étape.",
    },
  },
  {
    slug: "maison-salah",
    kind: "direct",
    title: {
      en: "Maison Salah: bilingual website for a Marrakech real-estate consultancy",
      fr: "Maison Salah : site bilingue pour un cabinet immobilier à Marrakech",
    },
    sector: { en: "Real estate & renovation", fr: "Immobilier & rénovation" },
    summary: {
      en: "A fast, bilingual showcase site that walks foreign investors through buying and renovating a riad in Marrakech and turns visits into qualified consultation requests.",
      fr: "Un site vitrine rapide et bilingue qui accompagne les investisseurs étrangers dans l'achat et la rénovation d'un riad à Marrakech, et transforme les visites en demandes de consultation qualifiées.",
    },
    stack: ["Next.js", "React", "i18n"],
    context: {
      en: "A consultancy that helps foreign buyers acquire and renovate riads, villas and land in Marrakech, covering legal paperwork, technical inspections, budgeting and works.",
      fr: "Un cabinet qui accompagne des acheteurs étrangers dans l'acquisition et la rénovation de riads, villas et terrains à Marrakech : démarches juridiques, expertise technique, budget et travaux.",
    },
    problem: {
      en: "Earn the trust of investors in France, Switzerland and the UK from a distance: show real results, explain the process clearly in two languages, and collect enough detail to qualify each lead.",
      fr: "Gagner à distance la confiance d'investisseurs en France, en Suisse et au Royaume-Uni : montrer de vrais résultats, expliquer clairement le processus en deux langues et recueillir assez d'informations pour qualifier chaque contact.",
    },
    built: [
      {
        en: "French and English versions with a language switch.",
        fr: "Versions française et anglaise avec sélecteur de langue.",
      },
      {
        en: "Interactive before/after sliders and photo galleries for each renovation project.",
        fr: "Curseurs avant/après interactifs et galeries photo pour chaque projet de rénovation.",
      },
      {
        en: "A step-by-step process section, five service areas and client testimonials.",
        fr: "Une section processus étape par étape, cinq domaines de services et des témoignages clients.",
      },
      {
        en: "A qualifying consultation form (country, project type, budget range, WhatsApp) plus direct WhatsApp, email and Instagram contact.",
        fr: "Un formulaire de consultation qualifiant (pays, type de projet, budget, WhatsApp) et un contact direct par WhatsApp, email et Instagram.",
      },
    ],
    decisions: [
      {
        title: { en: "Show, don't tell", fr: "Montrer plutôt que dire" },
        body: {
          en: "Before/after comparisons carry the sales pitch: for a remote buyer, visible transformations are more convincing than any copy.",
          fr: "Les comparaisons avant/après portent l'argumentaire : pour un acheteur à distance, une transformation visible convainc plus que n'importe quel texte.",
        },
      },
      {
        title: { en: "Optimised images", fr: "Des images optimisées" },
        body: {
          en: "Dozens of high-resolution photos are served through Next.js image optimisation so the galleries stay fast on mobile.",
          fr: "Des dizaines de photos haute résolution passent par l'optimisation d'images de Next.js pour que les galeries restent rapides sur mobile.",
        },
      },
      {
        title: { en: "Qualify leads at the form", fr: "Qualifier dès le formulaire" },
        body: {
          en: "Asking for budget range and project type up front lets the consultancy prioritise serious requests and reply within 48 hours.",
          fr: "Demander la fourchette de budget et le type de projet dès le départ permet de prioriser les demandes sérieuses et de répondre sous 48 heures.",
        },
      },
    ],
    status: { en: "Live.", fr: "En ligne." },
    link: "https://www.maison-salah-marrakech.com/en",
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
