import type { T } from "./types";

/** Strings for the 3D book at /[lang]/book/. Project content itself comes from projects.ts. */
export const book = {
  metaTitle: { en: "The book", fr: "Le livre" },
  metaDescription: {
    en: "Six freelance projects in AI and web development, presented as a 3D book you can leaf through.",
    fr: "Six projets freelance en IA et développement web, présentés dans un livre 3D à feuilleter.",
  },
  loading: { en: "Opening the book…", fr: "Ouverture du livre…" },
  hintOpen: { en: "Click the cover to open the book", fr: "Cliquez sur la couverture pour ouvrir le livre" },
  hintTurn: {
    en: "Click a page, swipe or use the arrow keys to turn",
    fr: "Cliquez sur une page, glissez ou utilisez les flèches pour tourner",
  },
  prev: { en: "Previous page", fr: "Page précédente" },
  next: { en: "Next page", fr: "Page suivante" },
  noWebgl: {
    en: "Your browser can't show the 3D book, so here is its table of contents.",
    fr: "Votre navigateur ne peut pas afficher le livre 3D, voici donc son sommaire.",
  },
  contents: { en: "Contents", fr: "Sommaire" },
  coverCaption: { en: "Portfolio, selected work", fr: "Portfolio, projets choisis" },
  aboutCaption: { en: "About me and contents", fr: "À propos et sommaire" },
  contactCaption: { en: "Get in touch", fr: "Me contacter" },
  coverSubtitle: { en: "AI engineer & full stack developer", fr: "Ingénieur IA & développeur full stack" },
  backTitle: { en: "Let's build something together", fr: "Construisons quelque chose ensemble" },
  directClient: { en: "Direct client", fr: "Client direct" },
  classic: { en: "Prefer a classic page? See the full portfolio", fr: "Vous préférez une page classique ? Voir le portfolio complet" },
  chapter: { en: "Chapter", fr: "Chapitre" },
  challengeLabel: { en: "The challenge", fr: "Le défi" },
  howLabel: { en: "How it works", fr: "Comment ça marche" },
  resultLabel: { en: "Where it stands", fr: "Où en est le projet" },
  foreword: {
    en: "This book gathers six projects built for real clients in 2025 and 2026: AI agents, knowledge assistants, automations and websites. Each chapter tells what the client needed, how the system works and where it stands today.",
    fr: "Ce livre réunit six projets réalisés pour de vrais clients en 2025 et 2026 : agents IA, assistants documentaires, automatisations et sites web. Chaque chapitre raconte le besoin du client, le fonctionnement du système et où il en est aujourd'hui.",
  },
} satisfies Record<string, T>;

export type Chapter = { headline: T; hook: T; how: [T, T, T]; result: T };

/** Book-specific copy for each project, written to be read on a page rather than scanned on a site. */
export const chapters: Record<string, Chapter> = {
  "parenting-ai-orientation": {
    headline: { en: "A guide that listens before it advises", fr: "Un guide qui écoute avant de conseiller" },
    hook: {
      en: "Parents, managers and perinatal professionals had a static form and a training library nobody could search.",
      fr: "Parents, managers et professionnels de la périnatalité n'avaient qu'un formulaire figé et une bibliothèque de formations introuvable.",
    },
    how: [
      {
        en: "A conversational diagnostic finds the right audience, asks the right questions and recommends a module.",
        fr: "Un diagnostic conversationnel identifie le public, pose les bonnes questions et recommande un module.",
      },
      {
        en: "127 documents, about 14,700 pages, turned into one searchable knowledge base.",
        fr: "127 documents, environ 14 700 pages, réunis dans une seule base de connaissances interrogeable.",
      },
      {
        en: "A premium expert answers only from that library, cites its sources and says when it doesn't know.",
        fr: "Un expert premium répond uniquement à partir de ce corpus, cite ses sources et sait dire quand il ne sait pas.",
      },
    ],
    result: {
      en: "Live, with payments, B2B access codes and an admin dashboard.",
      fr: "En production, avec paiements, codes d'accès B2B et tableau d'administration.",
    },
  },
  "technical-spec-generator": {
    headline: { en: "Thirty pages of specification, chapter by chapter", fr: "Trente pages de CCTP, chapitre par chapitre" },
    hook: {
      en: "Engineers write tender specifications that run past 30 pages and must follow national standards. One prompt can't write that.",
      fr: "Les ingénieurs rédigent des CCTP de plus de 30 pages qui doivent respecter les fascicules du CCTG. Un seul prompt n'y arrive pas.",
    },
    how: [
      {
        en: "A RAG assistant over the 35 national standard booklets, with web search and file uploads.",
        fr: "Un assistant RAG sur les 35 fascicules du CCTG, avec recherche web et import de fichiers.",
      },
      {
        en: "A manager agent proposes the outline, then writer agents draft every chapter in parallel.",
        fr: "Un agent manager propose le plan, puis des agents rédacteurs écrivent chaque chapitre en parallèle.",
      },
      {
        en: "Any section can be edited live, rewritten with AI and exported to PDF or Word.",
        fr: "Chaque section se modifie en direct, se réécrit par IA et s'exporte en PDF ou en Word.",
      },
    ],
    result: { en: "In production on the client's own server.", fr: "En production sur le serveur du client." },
  },
  "b2b-prospecting-agent": {
    headline: { en: "Finding the next best customer", fr: "Trouver le prochain meilleur client" },
    hook: {
      en: "Sales reps spent hours across registries, the CRM and LinkedIn to find companies that look like their best clients.",
      fr: "Les commerciaux passaient des heures entre registres, CRM et LinkedIn pour trouver des entreprises proches de leurs meilleurs clients.",
    },
    how: [
      {
        en: "A request typed in plain French becomes precise searches in the company registry.",
        fr: "Une demande en français courant devient des recherches précises dans le registre des entreprises.",
      },
      {
        en: "Each prospect gets a score computed in code, never by the model, so every rank can be explained.",
        fr: "Chaque prospect reçoit un score calculé par le code, jamais par le modèle : chaque classement s'explique.",
      },
      {
        en: "Buying signals, decision-makers and an approach angle drawn from similar past deals.",
        fr: "Signaux d'achat, décideurs et angle d'approche inspiré d'affaires passées similaires.",
      },
    ],
    result: {
      en: "In production. A quote-generation agent comes next.",
      fr: "En production. Un agent de génération de devis est la prochaine étape.",
    },
  },
  "payment-reminder-agent": {
    headline: { en: "Reminders that never nag", fr: "Des relances qui ne harcèlent pas" },
    hook: {
      en: "A third of a hundred monthly invoices went overdue, and the ERP offered no API to automate the follow-up.",
      fr: "Un tiers des cent factures mensuelles passaient en retard, et l'ERP n'offrait aucune API pour automatiser le suivi.",
    },
    how: [
      {
        en: "Four reminder stages that skip weekends and public holidays, then hand over to a person.",
        fr: "Quatre étapes de relance qui évitent week-ends et jours fériés, puis passent la main à un humain.",
      },
      {
        en: "One email per client, grouping every overdue invoice with its PDF attached.",
        fr: "Un seul e-mail par client, qui regroupe toutes ses factures en retard avec leur PDF.",
      },
      {
        en: "Finance reviews and approves each email, and a paid invoice drops out instantly.",
        fr: "La comptabilité relit et valide chaque e-mail, et une facture payée disparaît aussitôt.",
      },
    ],
    result: {
      en: "Delivered with human validation. Each stage can be switched to fully automatic.",
      fr: "Livré avec validation humaine. Chaque étape peut passer en automatique.",
    },
  },
  "news-to-avatar-video": {
    headline: { en: "The week's news, presented by an avatar", fr: "L'actu de la semaine, présentée par un avatar" },
    hook: {
      en: "A solar installer wanted a weekly video brief presented by its founder, without a film crew.",
      fr: "Un installateur solaire voulait un journal vidéo hebdomadaire présenté par son fondateur, sans équipe de tournage.",
    },
    how: [
      {
        en: "Five trade media are collected every week, and each article is classified and scored.",
        fr: "Cinq médias spécialisés sont collectés chaque semaine, et chaque article est classé et noté.",
      },
      {
        en: "A script studio writes a news brief meant to be heard, not read.",
        fr: "Un studio de script rédige un journal fait pour être écouté, pas lu.",
      },
      {
        en: "An AI avatar presents it, with karaoke-style subtitles burned in.",
        fr: "Un avatar IA le présente, avec des sous-titres karaoké incrustés.",
      },
    ],
    result: {
      en: "Monitoring, scripting and video are live. LinkedIn publishing comes next.",
      fr: "Veille, script et vidéo sont en service. La publication sur LinkedIn arrive.",
    },
  },
  "maison-salah": {
    headline: { en: "Trust, built from a distance", fr: "La confiance, à distance" },
    hook: {
      en: "Foreign investors buying a riad in Marrakech must trust a team they may never meet before signing.",
      fr: "Les investisseurs étrangers qui achètent un riad à Marrakech doivent faire confiance à une équipe qu'ils ne rencontreront peut-être pas avant de signer.",
    },
    how: [
      { en: "Every page in French and English.", fr: "Chaque page en français et en anglais." },
      {
        en: "Before-and-after sliders that show real renovations.",
        fr: "Des curseurs avant/après qui montrent de vraies rénovations.",
      },
      {
        en: "A consultation form that qualifies each lead: country, project and budget.",
        fr: "Un formulaire de consultation qui qualifie chaque demande : pays, projet et budget.",
      },
    ],
    result: { en: "Live at maison-salah-marrakech.com.", fr: "En ligne sur maison-salah-marrakech.com." },
  },
};
