/**
 * Contenu pédagogique de la feature `judo` (cf. specs/judo.md).
 *
 * Les descriptions sont écrites pour un droitier (garde droite) : inverser
 * gauche et droite pour une attaque à gauche. Progression française classique
 * ceinture blanche-jaune — à valider par le professeur du club.
 */

export type Phase = {
  /** Nom japonais du temps de la technique — assertion AC-2. */
  label: "Kuzushi" | "Tsukuri" | "Kake";
  /** Traduction courte du temps. */
  gloss: string;
  text: string;
};

export type Throw = {
  id: string;
  name: string;
  kanji: string;
  /** Prononciation approximative, écrite en sons français. */
  say: string;
  translation: string;
  family: string;
  phases: Phase[];
  safety: string;
};

export type Fall = {
  id: string;
  name: string;
  kanji: string;
  say: string;
  translation: string;
  /** Décomposition des mots-racines japonais. */
  literal: string;
  keys: string[];
};

export type Vocab = { word: string; kanji: string; meaning: string };

export type Question = {
  id: string;
  prompt: string;
  answer: string;
  /** Ordre fixe : les tests d'acceptation en dépendent (cf. Hors-scope). */
  options: string[];
};

export const THROWS: Throw[] = [
  {
    id: "o-goshi",
    name: "O-goshi",
    kanji: "大腰",
    say: "ô-go-chi",
    translation: "grande hanche",
    family: "koshi-waza — techniques de hanche",
    phases: [
      {
        label: "Kuzushi",
        gloss: "déséquilibre",
        text: "Tire sa manche vers le haut pour l'amener sur la pointe des pieds, déséquilibré vers l'avant.",
      },
      {
        label: "Tsukuri",
        gloss: "placement",
        text: "Pivote en lui tournant le dos, passe ton bras droit autour de sa taille, genoux fléchis : ta hanche se glisse sous la sienne.",
      },
      {
        label: "Kake",
        gloss: "projection",
        text: "Tends les jambes pour le soulever et tourne les épaules : il roule sur ta hanche et tombe devant toi.",
      },
    ],
    safety: "Ta hanche doit être plus basse que la sienne, sinon il ne décolle pas. Garde sa manche jusqu'au bout : c'est toi qui accompagnes sa chute.",
  },
  {
    id: "ippon-seoi-nage",
    name: "Ippon-seoi-nage",
    kanji: "一本背負投",
    say: "ip-pon sé-o-i na-gué",
    translation: "projection par l'épaule d'un seul côté",
    family: "te-waza — techniques de bras et d'épaule",
    phases: [
      {
        label: "Kuzushi",
        gloss: "déséquilibre",
        text: "Tire son bras vers le haut et vers l'avant, comme si tu voulais lire l'heure à son poignet.",
      },
      {
        label: "Tsukuri",
        gloss: "placement",
        text: "Pivote dos à lui, passe ton bras droit sous son aisselle, son bras bloqué contre ton épaule, dos collé au sien, genoux fléchis.",
      },
      {
        label: "Kake",
        gloss: "projection",
        text: "Détends les jambes, baisse la tête et tire son bras vers le bas-avant : il passe par-dessus ton épaule.",
      },
    ],
    safety: "Jamais de traction sur son coude tendu : on projette avec les jambes et le dos, pas avec le bras.",
  },
  {
    id: "o-soto-gari",
    name: "O-soto-gari",
    kanji: "大外刈",
    say: "ô-so-to ga-ri",
    translation: "grand fauchage extérieur",
    family: "ashi-waza — techniques de jambe",
    phases: [
      {
        label: "Kuzushi",
        gloss: "déséquilibre",
        text: "Pousse au col et tire la manche pour le renverser vers l'arrière, tout son poids sur sa jambe droite.",
      },
      {
        label: "Tsukuri",
        gloss: "placement",
        text: "Avance ton pied gauche à côté de son pied droit, ton épaule contre sa poitrine, ta jambe droite monte derrière lui.",
      },
      {
        label: "Kake",
        gloss: "projection",
        text: "Fauche sa jambe d'appui vers l'arrière avec l'arrière de ta cuisse, pendant que ton buste descend vers l'avant.",
      },
    ],
    safety: "Ne lâche pas la manche : tu le retiens pour qu'il chute à plat, en ushiro-ukemi.",
  },
];

export const FALLS: Fall[] = [
  {
    id: "ushiro-ukemi",
    name: "Ushiro-ukemi",
    kanji: "後ろ受身",
    say: "ou-chi-ro ou-ké-mi",
    translation: "chute arrière",
    literal: "ushiro (arrière) + ukemi (recevoir avec le corps)",
    keys: [
      "Menton collé à la poitrine : regarde ta ceinture, la tête ne touche jamais le tapis.",
      "Dos rond : on déroule les vertèbres, on ne s'assoit pas d'un bloc.",
      "Frappe le tapis des deux bras à plat, à 45° du corps, paumes vers le sol.",
      "Jamais de coude ni de main posés derrière soi.",
    ],
  },
  {
    id: "yoko-ukemi",
    name: "Yoko-ukemi",
    kanji: "横受身",
    say: "yo-ko ou-ké-mi",
    translation: "chute latérale",
    literal: "yoko (côté) + ukemi (recevoir avec le corps)",
    keys: [
      "Frappe d'un seul bras, celui du côté où tu tombes, paume à plat, à 45°.",
      "Menton rentré, regard vers l'épaule opposée.",
      "Jambe du dessus fléchie, pied à plat au sol ; l'autre jambe reste allongée.",
      "On arrive sur le côté du dos, jamais sur l'épaule ni sur le coude.",
    ],
  },
  {
    id: "mae-mawari-ukemi",
    name: "Mae-mawari-ukemi",
    kanji: "前回り受身",
    say: "ma-é ma-oua-ri ou-ké-mi",
    translation: "chute avant roulée",
    literal: "mae (avant) + mawari (en tournant) + ukemi (recevoir avec le corps)",
    keys: [
      "Bras avant arrondi comme une roue, main posée doigts vers l'intérieur.",
      "Roule en diagonale : de la main à l'épaule, puis vers la hanche opposée.",
      "Tête rentrée sur le côté : elle ne touche pas le tapis.",
      "Frappe le tapis de l'autre bras en arrivant sur le côté, puis relève-toi.",
    ],
  },
];

/** Mots-racines des chutes — assertion AC-5. */
export const FALL_WORDS: Vocab[] = [
  { word: "ukemi", kanji: "受身", meaning: "recevoir avec le corps → la chute" },
  { word: "mae", kanji: "前", meaning: "avant" },
  { word: "ushiro", kanji: "後ろ", meaning: "arrière" },
  { word: "yoko", kanji: "横", meaning: "côté" },
  { word: "mawari", kanji: "回り", meaning: "en tournant, roulé" },
];

/** Vocabulaire de tatami utile autour des 3 prises. */
export const EXTRA_WORDS: Vocab[] = [
  { word: "waza", kanji: "技", meaning: "technique" },
  { word: "nage", kanji: "投げ", meaning: "projection" },
  { word: "goshi / koshi", kanji: "腰", meaning: "hanche" },
  { word: "gari", kanji: "刈り", meaning: "fauchage" },
  { word: "o-", kanji: "大", meaning: "grand" },
  { word: "tori / uke", kanji: "取り / 受け", meaning: "celui qui projette / celui qui chute" },
];

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "Comment dit-on « grande hanche » ?",
    answer: "O-goshi",
    options: ["Ippon-seoi-nage", "O-goshi", "O-soto-gari"],
  },
  {
    id: "q2",
    prompt: "Quelle prise est un « grand fauchage extérieur » ?",
    answer: "O-soto-gari",
    options: ["O-soto-gari", "O-goshi", "Ippon-seoi-nage"],
  },
  {
    id: "q3",
    prompt: "Avec quelle prise uke passe-t-il par-dessus ton épaule ?",
    answer: "Ippon-seoi-nage",
    options: ["O-goshi", "O-soto-gari", "Ippon-seoi-nage"],
  },
  {
    id: "q4",
    prompt: "Comment s'appelle la chute arrière ?",
    answer: "Ushiro-ukemi",
    options: ["Yoko-ukemi", "Ushiro-ukemi", "Mae-mawari-ukemi"],
  },
  {
    id: "q5",
    prompt: "Et la chute sur le côté ?",
    answer: "Yoko-ukemi",
    options: ["Mae-mawari-ukemi", "Ushiro-ukemi", "Yoko-ukemi"],
  },
  {
    id: "q6",
    prompt: "Quelle chute est une roulade avant ?",
    answer: "Mae-mawari-ukemi",
    options: ["Mae-mawari-ukemi", "Ushiro-ukemi", "Yoko-ukemi"],
  },
];
