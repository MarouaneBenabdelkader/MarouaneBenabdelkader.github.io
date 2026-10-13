import type { T } from "./types";
import { logos, type LogoInfo } from "@/components/Logo";

type Job = { role: T; company: string; logo?: LogoInfo; place: string; type: T; dates: T; bullets: T[] };

export const profile = {
  name: "Marouane Benabdelkader",
  title: {
    en: "Full stack AI engineer and full stack developer: agentic systems, NLP, computer vision and web apps",
    fr: "Ingénieur IA et développeur full stack : systèmes agentiques, NLP, vision par ordinateur et applications web",
  },
  pitch: {
    en: "I design and ship agentic AI workflows, RAG assistants, computer-vision pipelines and the full stack web apps around them, then put them in production with Python, TypeScript, FastAPI, PyTorch and Azure. I also build custom apps and web apps on demand.",
    fr: "Je conçois et livre des workflows d'IA agentique, des assistants RAG, des pipelines de vision par ordinateur et les applications web full stack qui les portent, jusqu'à leur mise en production avec Python, TypeScript, FastAPI, PyTorch et Azure. Je développe aussi des applications et des applications web sur mesure, à la demande.",
  },
  location: { en: "Nice, France", fr: "Nice, France" },
  email: "benabdelkader.marouane@proton.me",
  linkedin: "https://www.linkedin.com/in/marouanebenabdelkader-8b0793258",
  github: "https://github.com/MarouaneBenabdelkader",
  cv: "/Marouane_Benabdelkader_Resume.pdf",

  experience: [
    {
      role: { en: "Full Stack AI Engineer", fr: "Ingénieur IA Full Stack" },
      company: "Amadeus",
      logo: logos.amadeus,
      place: "Villeneuve-Loubet, France",
      type: { en: "Apprenticeship", fr: "Alternance" },
      dates: { en: "Sep 2025 – Present", fr: "Sept. 2025 – Aujourd'hui" },
      bullets: [
        {
          en: "Design and build agentic AI workflows that transform internal knowledge sources into LLM-ready formats.",
          fr: "Conception de workflows d'IA agentique qui transforment les sources de connaissance internes en formats exploitables par les LLM.",
        },
        {
          en: "Develop an AI support agent for the developer community and build GitHub automation and statistics workflows.",
          fr: "Développement d'un agent de support IA pour la communauté développeurs et de workflows d'automatisation et de statistiques GitHub.",
        },
        {
          en: "Lead automation initiatives and deliver internal trainings on AI tools and best practices.",
          fr: "Pilotage d'initiatives d'automatisation et formations internes sur les outils IA et les bonnes pratiques.",
        },
      ],
    },
    {
      role: { en: "Full Stack AI Engineer", fr: "Ingénieur IA Full Stack" },
      company: "Deep2Drive",
      logo: logos.deep2drive,
      place: "Marseille, France",
      type: { en: "Fixed-term contract", fr: "CDD" },
      dates: { en: "Feb 2025 – Aug 2025", fr: "Févr. 2025 – Août 2025" },
      bullets: [
        {
          en: "Developed computer-vision models for driver monitoring: gaze estimation, object detection and behaviour analysis.",
          fr: "Développement de modèles de vision par ordinateur pour la surveillance du conducteur : estimation du regard, détection d'objets et analyse de comportement.",
        },
        {
          en: "Built video preprocessing pipelines for training and inference (Python, PyTorch, TensorFlow, OpenCV).",
          fr: "Pipelines de prétraitement vidéo pour l'entraînement et l'inférence (Python, PyTorch, TensorFlow, OpenCV).",
        },
        {
          en: "Ran and scaled training and inference workloads on Microsoft Azure Batch.",
          fr: "Exécution et passage à l'échelle des entraînements et inférences sur Microsoft Azure Batch.",
        },
      ],
    },
    {
      role: { en: "NLP Developer", fr: "Développeur NLP" },
      company: "3D Smart Factory",
      logo: logos.smartFactory,
      place: "Mohammedia, Morocco",
      type: { en: "Internship", fr: "Stage" },
      dates: { en: "Apr 2024 – Jun 2024", fr: "Avr. 2024 – Juin 2024" },
      bullets: [
        {
          en: "Built a resume analysis and ranking platform with spaCy, Elasticsearch and an SVM classifier, served via FastAPI.",
          fr: "Plateforme d'analyse et de classement de CV avec spaCy, Elasticsearch et un classifieur SVM, exposée via FastAPI.",
        },
      ],
    },
    {
      role: { en: "Backend Developer", fr: "Développeur Backend" },
      company: "INNOV DS",
      logo: logos.innovds,
      place: "Fez, Morocco",
      type: { en: "Internship", fr: "Stage" },
      dates: { en: "Apr 2023 – Jun 2023", fr: "Avr. 2023 – Juin 2023" },
      bullets: [
        {
          en: "Developed an e-commerce REST API backend with Node.js, Express.js and MongoDB.",
          fr: "Développement d'une API REST e-commerce avec Node.js, Express.js et MongoDB.",
        },
      ],
    },
  ] satisfies Job[],

  education: [
    {
      degree: { en: "Master's in Computer Science – Artificial Intelligence", fr: "Master Informatique – Intelligence Artificielle" },
      school: "Université Côte d'Azur, Nice",
      dates: "2025 – 2027",
    },
    {
      degree: { en: "Bachelor's in Computer Science (Licence 3)", fr: "Licence 3 Informatique" },
      school: "Aix-Marseille Université",
      dates: "2024 – 2025",
    },
    {
      degree: { en: "Professional Bachelor's in Big Data", fr: "Licence professionnelle Big Data" },
      school: "Université Sultan Moulay Slimane, Morocco",
      dates: "2023 – 2024",
    },
    {
      degree: { en: "DUT in Computer Science – Software Engineering", fr: "DUT Informatique – Génie logiciel" },
      school: "EST Fès, Morocco",
      dates: "2021 – 2023",
    },
  ],

  skills: [
    { group: { en: "Languages", fr: "Langages" }, items: ["Python", "TypeScript", "JavaScript", "Java", "SQL"] },
    {
      group: { en: "AI, LLM & NLP", fr: "IA, LLM & NLP" },
      items: ["Agentic AI workflows", "LLMs", "RAG", "Prompt engineering", "LangChain", "Transformers", "spaCy", "NLTK", "Information extraction"],
    },
    {
      group: { en: "ML & Computer Vision", fr: "ML & vision par ordinateur" },
      items: ["PyTorch", "TensorFlow", "Deep learning", "SVM", "OpenCV", "scikit-image", "Object detection", "Gaze estimation", "Video processing"],
    },
    {
      group: { en: "Backend & Frontend", fr: "Backend & Frontend" },
      items: ["FastAPI", "Node.js", "Express.js", "Next.js", "React", "REST APIs", "SSE", "Jakarta EE"],
    },
    {
      group: { en: "Data & Databases", fr: "Données & bases de données" },
      items: ["PostgreSQL / pgvector", "Supabase", "Qdrant", "MongoDB", "MySQL", "Elasticsearch", "Redis", "Cassandra", "HBase", "Pandas", "Power BI"],
    },
    {
      group: { en: "Cloud & DevOps", fr: "Cloud & DevOps" },
      items: ["Azure (Batch, ML, Blob Storage, DevOps)", "Docker", "GitHub Actions", "Git", "GitLab", "n8n"],
    },
    {
      group: { en: "Practices", fr: "Pratiques" },
      items: ["Agile / Scrum", "Kanban", "Unit testing", "UML", "Merise", "Technical documentation"],
    },
  ],

  swiftserve: {
    title: "SwiftServe",
    tagline: { en: "Lightweight MVC2 web framework for Java", fr: "Framework web MVC2 léger pour Java" },
    summary: {
      en: "Final-year project: a minimalist Jakarta EE framework so developers can focus on business logic instead of plumbing.",
      fr: "Projet de fin d'études : un framework Jakarta EE minimaliste pour que les développeurs se concentrent sur la logique métier plutôt que sur la plomberie.",
    },
    bullets: [
      {
        en: "Front controller that routes requests to controllers and views (MVC2).",
        fr: "Contrôleur frontal qui route les requêtes vers les contrôleurs et les vues (MVC2).",
      },
      {
        en: "Generates REST web services from models, with no repetitive boilerplate.",
        fr: "Génération automatique de services REST à partir des modèles, sans code répétitif.",
      },
    ],
    stack: ["Java", "Jakarta EE", "Docusaurus"],
    link: "https://creativityfactory.github.io/SwiftServe-docs/",
  },

  languages: {
    en: "French and English (fluent), Arabic (native)",
    fr: "Français et anglais (courant), arabe (langue maternelle)",
  },
};
