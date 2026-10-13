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
      en: "A conversational diagnostic that routes parents, managers and perinatal professionals to the right training module, plus a premium AI expert grounded in ~14,700 pages of proprietary course material.",
      fr: "Un diagnostic conversationnel qui oriente parents, managers et professionnels de la périnatalité vers le bon module de formation, et un expert IA premium ancré dans ~14 700 pages de contenus propriétaires.",
    },
    stack: ["React", "Express", "OpenAI", "n8n AI Agent", "Supabase pgvector", "MinerU", "Stripe"],
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
        en: "Free diagnostic: the agent first places the user in one of three audiences (parents, managers and HR, perinatal professionals), then runs a branch-specific question flow with suggestion buttons or free-text answers, and recommends a training module.",
        fr: "Diagnostic gratuit : l'agent classe d'abord l'utilisateur parmi trois publics (parents, managers et RH, professionnels de la périnatalité), puis déroule un parcours de questions propre à chaque branche, avec boutons de suggestion ou réponse libre, et recommande un module de formation.",
      },
      {
        en: "Ingestion pipeline: OCR and layout extraction with MinerU, hierarchy-aware chunking (H1 > H2 > H3 context), OpenAI embeddings stored in Supabase pgvector, split into thematic collections.",
        fr: "Pipeline d'ingestion : OCR et extraction de mise en page avec MinerU, découpage tenant compte de la hiérarchie (contexte H1 > H2 > H3), embeddings OpenAI stockés dans Supabase pgvector, répartis en collections thématiques.",
      },
      {
        en: "Premium tier: a RAG expert built on n8n's AI Agent (LangChain-based) with conversation memory; it answers only from the corpus, cites document and collection, and returns a confidence level (high / medium / low / off-topic).",
        fr: "Offre premium : un expert RAG construit sur l'agent IA de n8n (basé sur LangChain) avec mémoire de conversation ; il répond uniquement à partir du corpus, cite document et collection, et renvoie un niveau de confiance (haute / moyenne / faible / hors sujet).",
      },
      {
        en: "Full stack web app: React frontend and Express API on Vercel, Supabase auth with row-level security, roles (free, premium, B2B, admin), Stripe subscriptions, partner codes that unlock premium for B2B employees, and an admin dashboard for codes and users.",
        fr: "Application web full stack : frontend React et API Express sur Vercel, authentification Supabase avec sécurité au niveau des lignes, rôles (gratuit, premium, B2B, admin), abonnements Stripe, codes partenaires qui débloquent le premium pour les salariés B2B, et tableau de bord admin pour les codes et les utilisateurs.",
      },
    ],
    decisions: [
      {
        title: { en: "Scoring stays deterministic", fr: "Un scoring déterministe" },
        body: {
          en: "A small model only picks the user's branch, constrained to a JSON-schema enum, and an evaluator reads free-text answers; the score itself comes from typed rules, so the same answers always lead to the same recommendation.",
          fr: "Un petit modèle choisit uniquement la branche de l'utilisateur, contraint par une énumération JSON Schema, et un évaluateur lit les réponses libres ; le score vient de règles typées, donc les mêmes réponses mènent toujours à la même recommandation.",
        },
      },
      {
        title: { en: "From workflow nodes to typed services", fr: "Des nœuds de workflow aux services typés" },
        body: {
          en: "The diagnostic began as an n8n workflow. I moved it into TypeScript services (branch selector, evaluator, rules, scoring) so the logic is versioned, reviewable and runs on cheap nano models.",
          fr: "Le diagnostic a commencé comme un workflow n8n. Je l'ai migré vers des services TypeScript (sélecteur de branche, évaluateur, règles, scoring) pour que la logique soit versionnée, relisible et tourne sur des modèles nano peu coûteux.",
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
      en: "Built and deployed: diagnostic agent, premium RAG expert over 127 documents (~14,700 pages), payments, B2B access and admin tools.",
      fr: "Réalisé et déployé : agent de diagnostic, expert RAG premium sur 127 documents (~14 700 pages), paiements, accès B2B et outils d'administration.",
    },
  },
  {
    slug: "technical-spec-generator",
    kind: "codito",
    title: {
      en: "AI assistant & technical-spec generator (30+ pages) for landscape and civil engineers",
      fr: "Assistant IA & générateur de CCTP (30 pages et plus) pour paysagistes et ingénieurs VRD",
    },
    sector: { en: "Landscape architecture & civil engineering", fr: "Paysage & ingénierie VRD" },
    summary: {
      en: "A chat app that answers questions on French public-works standards and drafts full technical specification documents (CCTP) chapter by chapter, with a live editor and PDF/Word export.",
      fr: "Une application de chat qui répond aux questions sur les normes des marchés publics de travaux et rédige des CCTP complets chapitre par chapitre, avec éditeur en direct et export PDF/Word.",
    },
    stack: ["Next.js", "FastAPI", "OpenAI", "Supabase pgvector", "LangChain", "MinerU", "Tavily", "TipTap", "LaTeX"],
    context: {
      en: "Landscape architects, civil (VRD) engineers and urban planners write CCTP documents (technical clauses for public tenders) that run past 30 pages and must stay consistent with the CCTG standards.",
      fr: "Paysagistes, ingénieurs VRD et urbanistes rédigent des CCTP de plus de 30 pages qui doivent rester cohérents avec les normes du CCTG et des fascicules.",
    },
    problem: {
      en: "A single LLM prompt can't produce a coherent document of 30 pages or more: it truncates, drifts, and is slow and expensive. Users also need to steer the structure and edit any section afterwards.",
      fr: "Un seul prompt ne peut pas produire un document cohérent de 30 pages ou plus : il tronque, dérive, et coûte cher en temps comme en tokens. Les utilisateurs doivent aussi piloter la structure et retoucher chaque section ensuite.",
    },
    built: [
      {
        en: "Knowledge base: crawled the 35 CCTG fascicules, extracted them with MinerU, split them with LangChain's Markdown-header and recursive splitters, and embedded them into pgvector.",
        fr: "Base de connaissances : collecte des 35 fascicules du CCTG, extraction avec MinerU, découpage avec les splitters Markdown et récursif de LangChain, puis embeddings dans pgvector.",
      },
      {
        en: "General mode: a RAG assistant over the standards with web search via Tavily, rendering tables and equations natively; users can attach their own PDF, Word, Excel or scanned files (OCR).",
        fr: "Mode général : un assistant RAG sur les normes avec recherche web via Tavily et rendu natif des tableaux et équations ; l'utilisateur peut joindre ses propres PDF, Word, Excel ou documents scannés (OCR).",
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
    stack: ["Next.js", "TypeScript", "LangChain", "Mistral", "Qdrant", "SQLite", "Dolibarr", "Pappers", "Apollo", "Unipile"],
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
        en: "A nightly job mirrors the CRM, resolves company entities, recalibrates the ideal-customer profile from past deals and indexes those deals in Qdrant.",
        fr: "Un traitement nocturne réplique le CRM, résout les entités, recalibre le profil client idéal à partir de l'historique des affaires et indexe ces affaires dans Qdrant.",
      },
      {
        en: "Enrichment: growth and buying signals (Apollo, Tavily) on a shortlist, LinkedIn decision-makers via Unipile, and a short approach angle per prospect written with similar past deals from Qdrant as context.",
        fr: "Enrichissement : signaux de croissance et d'achat (Apollo, Tavily) sur une présélection, décideurs LinkedIn via Unipile, et un angle d'approche court par prospect, rédigé avec des affaires passées similaires tirées de Qdrant.",
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
        title: { en: "Pinned by golden files", fr: "Verrouillé par des fichiers de référence" },
        body: {
          en: "Scoring, exclusions, entity resolution and the nightly run are checked against golden-file snapshots and the numbered acceptance criteria of the specification.",
          fr: "Scoring, exclusions, résolution d'entités et traitement nocturne sont vérifiés contre des instantanés de référence et les critères d'acceptation numérotés du cahier des charges.",
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
    stack: ["Python", "Next.js", "Supabase", "Microsoft Graph", "RapidFuzz", "SQLite", "pytest"],
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
        en: "A Next.js validation dashboard where the finance team reviews, edits and approves each email. The agent's SQLite journal is mirrored to Supabase after every run, so the web app reads a replica. Client replies pause the sequence; auto-replies are ignored.",
        fr: "Un tableau de bord Next.js où la direction financière relit, modifie et approuve chaque email. Le journal SQLite de l'agent est répliqué dans Supabase après chaque exécution, et l'application web lit cette copie. Une réponse client met la séquence en pause ; les réponses automatiques sont ignorées.",
      },
      {
        en: "Optional LLM rewording of each email, off by default until GDPR sign-off: amounts, references, dates and tone must stay identical, and any failure falls back to the template.",
        fr: "Reformulation optionnelle des emails par LLM, désactivée par défaut en attendant la validation RGPD : montants, références, dates et ton doivent rester identiques, et tout échec revient au modèle d'email.",
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
          en: "203 pytest tests cover sequence timing, matching, grouping, blocking rules, PDF checks, the Supabase sync and reply detection.",
          fr: "203 tests pytest couvrent le calendrier de séquence, le rapprochement, le regroupement, les règles de blocage, la vérification des PDF, la synchronisation Supabase et la détection des réponses.",
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
    stack: ["Python", "FastAPI", "BeautifulSoup", "React", "OpenAI", "HeyGen", "FFmpeg", "Supabase"],
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
        en: "GPT classification of each article in parallel batches (relevant to solar, concerns France, audience, relevance score) to set priority automatically.",
        fr: "Classification GPT de chaque article par lots parallèles (photovoltaïque, concerne la France, cible, score de pertinence) pour fixer la priorité automatiquement.",
      },
      {
        en: "Script studio: pick and reorder articles, generate a structured news script, re-prompt, track tokens and save to a library.",
        fr: "Studio de script : sélection et réordonnancement des articles, génération d'un script structuré, reprompt, suivi des tokens et bibliothèque de scripts.",
      },
      {
        en: "Video production with HeyGen, then FFmpeg post-processing that burns karaoke-style subtitles and stores the result; user accounts and an admin dashboard track API usage and real video cost. The React app is served by FastAPI and auto-deployed on Render.",
        fr: "Production vidéo avec HeyGen, puis post-traitement FFmpeg qui incruste des sous-titres karaoké et stocke le résultat ; comptes utilisateurs et tableau de bord admin suivent l'usage des API et le coût réel des vidéos. L'application React est servie par FastAPI et déployée automatiquement sur Render.",
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
