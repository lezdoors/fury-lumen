export const LOCALES = ["en", "fr", "es", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  es: "ES",
  ar: "AR",
};

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  ar: "العربية",
};

/** Arabic mirrors the whole interface. Every layout rule uses logical
 *  properties, so this attribute is all the flip needs. */
export const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(["ar"]);

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Best match for a browser's preferred languages, falling back to English. */
export function resolveLocale(candidates: readonly string[]): Locale {
  for (const candidate of candidates) {
    const base = candidate.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return "en";
}

/**
 * Costs stay in USD because that is what the provider bills, but the number
 * itself is formatted for the reader. ar-MA uses Western digits, which is what
 * Moroccan users expect for money.
 */
export function formatMoney(value: number, locale: Locale) {
  const tag = locale === "ar" ? "ar-MA" : locale;
  try {
    return new Intl.NumberFormat(tag, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      numberingSystem: "latn",
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export interface Dictionary {
  navResults: string;
  navModels: string;
  spent: string;
  idle: string;
  generatingCount: (count: number) => string;
  badge: string;
  headlineTop: string;
  headlineLead: string;
  headlineAccent: string;
  promptLabel: string;
  promptPlaceholder: string;
  referenceTitle: string;
  referenceAria: string;
  noModel: string;
  sending: string;
  generateAria: (cost: string) => string;
  inProgress: string;
  queuedAt: (position: number) => string;
  generating: string;
  resultsTitle: string;
  resultsMeta: (count: number, spent: string) => string;
  resultsEmpty: string;
  cardFailed: string;
  cardGenerating: string;
  videoTag: string;
  download: string;
  keep: string;
  kept: string;
  close: string;
  modelEyebrow: string;
  modelTitle: string;
  aspectRatio: string;
  duration: string;
  seconds: (value: number) => string;
  unavailable: string;
  costNote: (cost: string) => string;
  language: string;
}

const en: Dictionary = {
  navResults: "Results",
  navModels: "Models",
  spent: "Spent",
  idle: "Idle",
  generatingCount: (n) => `${n} generating`,
  badge: "Pay per generation — no subscription",
  headlineTop: "Make anything.",
  headlineLead: "Pay only for",
  headlineAccent: "what you make",
  promptLabel: "Describe what to generate",
  promptPlaceholder: "Describe what you want to create…",
  referenceTitle: "Reference image — not wired yet",
  referenceAria: "Add a reference image",
  noModel: "No model",
  sending: "Sending…",
  generateAria: (cost) => `Generate for ${cost}`,
  inProgress: "In progress",
  queuedAt: (p) => `queued ${p}`,
  generating: "generating",
  resultsTitle: "Your generations",
  resultsMeta: (n, spent) => `${n} total · ${spent} spent`,
  resultsEmpty: "Nothing yet. Describe something above and press",
  cardFailed: "Failed",
  cardGenerating: "Generating…",
  videoTag: "VIDEO",
  download: "Download",
  keep: "☆ Keep",
  kept: "★ Kept",
  close: "Close",
  modelEyebrow: "MODEL",
  modelTitle: "What should make it",
  aspectRatio: "Aspect ratio",
  duration: "Duration",
  seconds: (v) => `${v} seconds`,
  unavailable: "unavailable",
  costNote: (cost) => `Estimated cost is ${cost} per generation. Final billing is the provider's.`,
  language: "Language",
};

const fr: Dictionary = {
  navResults: "Résultats",
  navModels: "Modèles",
  spent: "Dépensé",
  idle: "Inactif",
  generatingCount: (n) => `${n} en cours`,
  badge: "Paiement à la génération — sans abonnement",
  headlineTop: "Créez ce que vous voulez.",
  headlineLead: "Ne payez que",
  headlineAccent: "ce que vous créez",
  promptLabel: "Décrivez ce qu'il faut générer",
  promptPlaceholder: "Décrivez ce que vous voulez créer…",
  referenceTitle: "Image de référence — pas encore active",
  referenceAria: "Ajouter une image de référence",
  noModel: "Aucun modèle",
  sending: "Envoi…",
  generateAria: (cost) => `Générer pour ${cost}`,
  inProgress: "En cours",
  queuedAt: (p) => `en file ${p}`,
  generating: "génération",
  resultsTitle: "Vos générations",
  resultsMeta: (n, spent) => `${n} au total · ${spent} dépensés`,
  resultsEmpty: "Rien pour l'instant. Décrivez quelque chose ci-dessus puis appuyez sur",
  cardFailed: "Échec",
  cardGenerating: "Génération…",
  videoTag: "VIDÉO",
  download: "Télécharger",
  keep: "☆ Garder",
  kept: "★ Gardé",
  close: "Fermer",
  modelEyebrow: "MODÈLE",
  modelTitle: "Qui doit le créer",
  aspectRatio: "Format",
  duration: "Durée",
  seconds: (v) => `${v} secondes`,
  unavailable: "indisponible",
  costNote: (cost) =>
    `Coût estimé : ${cost} par génération. La facturation finale est celle du fournisseur.`,
  language: "Langue",
};

const es: Dictionary = {
  navResults: "Resultados",
  navModels: "Modelos",
  spent: "Gastado",
  idle: "Inactivo",
  generatingCount: (n) => `${n} generando`,
  badge: "Pago por generación — sin suscripción",
  headlineTop: "Crea lo que quieras.",
  headlineLead: "Paga solo por",
  headlineAccent: "lo que creas",
  promptLabel: "Describe qué generar",
  promptPlaceholder: "Describe lo que quieres crear…",
  referenceTitle: "Imagen de referencia — aún no disponible",
  referenceAria: "Añadir una imagen de referencia",
  noModel: "Sin modelo",
  sending: "Enviando…",
  generateAria: (cost) => `Generar por ${cost}`,
  inProgress: "En curso",
  queuedAt: (p) => `en cola ${p}`,
  generating: "generando",
  resultsTitle: "Tus generaciones",
  resultsMeta: (n, spent) => `${n} en total · ${spent} gastados`,
  resultsEmpty: "Nada todavía. Describe algo arriba y pulsa",
  cardFailed: "Fallido",
  cardGenerating: "Generando…",
  videoTag: "VÍDEO",
  download: "Descargar",
  keep: "☆ Guardar",
  kept: "★ Guardado",
  close: "Cerrar",
  modelEyebrow: "MODELO",
  modelTitle: "Qué debe crearlo",
  aspectRatio: "Formato",
  duration: "Duración",
  seconds: (v) => `${v} segundos`,
  unavailable: "no disponible",
  costNote: (cost) =>
    `Coste estimado: ${cost} por generación. La facturación final es la del proveedor.`,
  language: "Idioma",
};

const ar: Dictionary = {
  navResults: "النتائج",
  navModels: "النماذج",
  spent: "أُنفق",
  idle: "خامل",
  generatingCount: (n) => `${n} قيد التوليد`,
  badge: "الدفع لكل عملية توليد — بدون اشتراك",
  headlineTop: "أنشئ أي شيء.",
  headlineLead: "ادفع فقط مقابل",
  headlineAccent: "ما تنشئه",
  promptLabel: "صف ما تريد توليده",
  promptPlaceholder: "صف ما تريد إنشاءه…",
  referenceTitle: "صورة مرجعية — غير مفعّلة بعد",
  referenceAria: "إضافة صورة مرجعية",
  noModel: "لا يوجد نموذج",
  sending: "جارٍ الإرسال…",
  generateAria: (cost) => `توليد مقابل ${cost}`,
  inProgress: "قيد التنفيذ",
  queuedAt: (p) => `في الانتظار ${p}`,
  generating: "قيد التوليد",
  resultsTitle: "أعمالك",
  resultsMeta: (n, spent) => `${n} إجمالاً · ${spent} أُنفقت`,
  resultsEmpty: "لا شيء بعد. صف شيئاً في الأعلى ثم اضغط",
  cardFailed: "فشل",
  cardGenerating: "جارٍ التوليد…",
  videoTag: "فيديو",
  download: "تنزيل",
  keep: "☆ حفظ",
  kept: "★ محفوظ",
  close: "إغلاق",
  modelEyebrow: "النموذج",
  modelTitle: "ما الذي سينشئه",
  aspectRatio: "نسبة العرض",
  duration: "المدة",
  seconds: (v) => `${v} ثوانٍ`,
  unavailable: "غير متاح",
  costNote: (cost) => `التكلفة التقديرية ${cost} لكل عملية توليد. الفوترة النهائية من المزوّد.`,
  language: "اللغة",
};

export const DICTIONARIES: Record<Locale, Dictionary> = { en, fr, es, ar };
