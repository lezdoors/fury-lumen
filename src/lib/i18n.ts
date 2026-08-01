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

function intl(locale: Locale, options: Intl.NumberFormatOptions) {
  const tag = locale === "ar" ? "ar-MA" : locale;
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: "USD",
    numberingSystem: "latn",
    ...options,
  });
}

/**
 * Costs stay in USD because that is what the provider bills, but the number
 * itself is formatted for the reader. ar-MA uses Western digits, which is what
 * Moroccan users expect for money.
 */
export function formatMoney(value: number, locale: Locale) {
  try {
    return intl(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Rates are quoted per second and run from $0.045 to $0.682 — rounding them to
 * cents would collapse a fifteen-fold spread into three indistinguishable
 * values, which is exactly the comparison Lumen exists to show.
 */
export function formatRate(value: number, locale: Locale) {
  try {
    return intl(locale, { minimumFractionDigits: 3, maximumFractionDigits: 4 }).format(value);
  } catch {
    return `$${value.toFixed(3)}`;
  }
}

export interface Dictionary {
  consoleSub: string;
  quote: string;
  free: string;
  flat: string;
  perSecond: string;
  noModel: string;

  spent: string;
  runs: string;
  live: string;

  rateCard: string;
  rateUnit: string;
  needsKey: string;
  takesReference: string;

  format: string;
  aspect: string;
  duration: string;
  seconds: (value: number) => string;

  promptLabel: string;
  promptPlaceholder: string;
  attach: string;
  attachAria: string;
  dropHere: string;
  uploading: string;
  removeRef: string;
  switchedForReference: (label: string) => string;
  noReferenceModel: string;

  run: string;
  confirm: string;
  armed: (cost: string) => string;
  sending: string;
  runAria: (cost: string) => string;
  shortcut: string;

  inProgress: string;
  queuedAt: (position: number) => string;
  generating: string;

  ledger: string;
  ledgerCount: (count: number, spent: string) => string;
  find: string;
  filterAll: string;
  filterVideo: string;
  filterImage: string;
  filterKept: string;
  filterFailed: string;
  empty: string;
  emptyFiltered: string;
  clearFilters: string;

  again: string;
  reuse: string;
  keep: string;
  kept: string;
  waiting: string;
  failedTag: string;
  videoTag: string;
  imageTag: string;

  download: string;
  close: string;
  previous: string;
  next: string;

  language: string;
  colophon: string;
}

const en: Dictionary = {
  consoleSub: "Pay-per-generation console",
  quote: "Quote",
  free: "No charge",
  flat: "flat",
  perSecond: "/sec",
  noModel: "No model selected",

  spent: "Spent",
  runs: "Runs",
  live: "Live",

  rateCard: "Rate card",
  rateUnit: "USD / sec",
  needsKey: "Needs a provider key",
  takesReference: "REF",

  format: "Format",
  aspect: "Aspect",
  duration: "Duration",
  seconds: (v) => `${v}s`,

  promptLabel: "Describe what to generate",
  promptPlaceholder: "Describe the shot. Drop an image here to animate it.",
  attach: "Reference frame",
  attachAria: "Attach a reference frame",
  dropHere: "Drop to attach",
  uploading: "Reading file…",
  removeRef: "Remove reference",
  switchedForReference: (label) => `Reference attached — switched to ${label}.`,
  noReferenceModel: "No image-to-video model is available with the current key.",

  run: "Run",
  confirm: "Confirm",
  armed: (cost) => `${cost} is above the confirm threshold. Press Run again to charge it.`,
  sending: "Sending…",
  runAria: (cost) => `Run this generation for ${cost}`,
  shortcut: "⌘↵",

  inProgress: "In progress",
  queuedAt: (p) => `queued · position ${p}`,
  generating: "generating",

  ledger: "Ledger",
  ledgerCount: (n, spent) => `${n} runs · ${spent}`,
  find: "Find a prompt",
  filterAll: "All",
  filterVideo: "Video",
  filterImage: "Image",
  filterKept: "Kept",
  filterFailed: "Failed",
  empty: "Nothing has been run yet. Describe something above and press ⌘↵. Proof mode renders a real clip for nothing, so the whole loop can be tried before any money moves.",
  emptyFiltered: "No run matches this filter.",
  clearFilters: "Clear",

  again: "Again",
  reuse: "Reuse",
  keep: "Keep",
  kept: "Kept",
  waiting: "Working…",
  failedTag: "Failed",
  videoTag: "VIDEO",
  imageTag: "STILL",

  download: "Download",
  close: "Close",
  previous: "Previous",
  next: "Next",

  language: "Language",
  colophon:
    "Rates are the provider's own, quoted per second of output. Lumen adds no margin and sells no credits.",
};

const fr: Dictionary = {
  consoleSub: "Console au coût par génération",
  quote: "Devis",
  free: "Sans frais",
  flat: "fixe",
  perSecond: "/sec",
  noModel: "Aucun modèle sélectionné",

  spent: "Dépensé",
  runs: "Exécutions",
  live: "En cours",

  rateCard: "Tarifs",
  rateUnit: "USD / sec",
  needsKey: "Clé fournisseur requise",
  takesReference: "RÉF",

  format: "Format",
  aspect: "Cadrage",
  duration: "Durée",
  seconds: (v) => `${v}s`,

  promptLabel: "Décrivez ce qu'il faut générer",
  promptPlaceholder: "Décrivez le plan. Déposez une image ici pour l'animer.",
  attach: "Image de référence",
  attachAria: "Joindre une image de référence",
  dropHere: "Déposez pour joindre",
  uploading: "Lecture du fichier…",
  removeRef: "Retirer la référence",
  switchedForReference: (label) => `Référence jointe — bascule vers ${label}.`,
  noReferenceModel: "Aucun modèle image-vers-vidéo n'est disponible avec la clé actuelle.",

  run: "Lancer",
  confirm: "Confirmer",
  armed: (cost) => `${cost} dépasse le seuil de confirmation. Appuyez de nouveau pour débiter.`,
  sending: "Envoi…",
  runAria: (cost) => `Lancer cette génération pour ${cost}`,
  shortcut: "⌘↵",

  inProgress: "En cours",
  queuedAt: (p) => `en file · position ${p}`,
  generating: "génération",

  ledger: "Registre",
  ledgerCount: (n, spent) => `${n} exécutions · ${spent}`,
  find: "Chercher une consigne",
  filterAll: "Tout",
  filterVideo: "Vidéo",
  filterImage: "Image",
  filterKept: "Gardés",
  filterFailed: "Échecs",
  empty: "Rien n'a encore été lancé. Décrivez quelque chose ci-dessus puis appuyez sur ⌘↵. Le mode démonstration produit un vrai clip sans frais, donc toute la boucle se teste avant le moindre débit.",
  emptyFiltered: "Aucune exécution ne correspond à ce filtre.",
  clearFilters: "Effacer",

  again: "Relancer",
  reuse: "Reprendre",
  keep: "Garder",
  kept: "Gardé",
  waiting: "En cours…",
  failedTag: "Échec",
  videoTag: "VIDÉO",
  imageTag: "IMAGE",

  download: "Télécharger",
  close: "Fermer",
  previous: "Précédent",
  next: "Suivant",

  language: "Langue",
  colophon:
    "Les tarifs sont ceux du fournisseur, à la seconde de sortie. Lumen n'ajoute aucune marge et ne vend aucun crédit.",
};

const es: Dictionary = {
  consoleSub: "Consola de pago por generación",
  quote: "Presupuesto",
  free: "Sin cargo",
  flat: "fijo",
  perSecond: "/seg",
  noModel: "Ningún modelo seleccionado",

  spent: "Gastado",
  runs: "Ejecuciones",
  live: "En curso",

  rateCard: "Tarifas",
  rateUnit: "USD / seg",
  needsKey: "Falta la clave del proveedor",
  takesReference: "REF",

  format: "Formato",
  aspect: "Encuadre",
  duration: "Duración",
  seconds: (v) => `${v}s`,

  promptLabel: "Describe qué generar",
  promptPlaceholder: "Describe el plano. Suelta una imagen aquí para animarla.",
  attach: "Imagen de referencia",
  attachAria: "Adjuntar una imagen de referencia",
  dropHere: "Suelta para adjuntar",
  uploading: "Leyendo el archivo…",
  removeRef: "Quitar la referencia",
  switchedForReference: (label) => `Referencia adjunta: se cambió a ${label}.`,
  noReferenceModel: "No hay ningún modelo de imagen a vídeo disponible con la clave actual.",

  run: "Ejecutar",
  confirm: "Confirmar",
  armed: (cost) => `${cost} supera el umbral de confirmación. Pulsa de nuevo para cobrarlo.`,
  sending: "Enviando…",
  runAria: (cost) => `Ejecutar esta generación por ${cost}`,
  shortcut: "⌘↵",

  inProgress: "En curso",
  queuedAt: (p) => `en cola · posición ${p}`,
  generating: "generando",

  ledger: "Registro",
  ledgerCount: (n, spent) => `${n} ejecuciones · ${spent}`,
  find: "Buscar una indicación",
  filterAll: "Todo",
  filterVideo: "Vídeo",
  filterImage: "Imagen",
  filterKept: "Guardados",
  filterFailed: "Fallidos",
  empty: "Todavía no se ha ejecutado nada. Describe algo arriba y pulsa ⌘↵. El modo de prueba genera un clip real sin coste, así que puedes recorrer todo el ciclo antes de mover dinero.",
  emptyFiltered: "Ninguna ejecución coincide con este filtro.",
  clearFilters: "Limpiar",

  again: "Repetir",
  reuse: "Reutilizar",
  keep: "Guardar",
  kept: "Guardado",
  waiting: "Trabajando…",
  failedTag: "Fallido",
  videoTag: "VÍDEO",
  imageTag: "IMAGEN",

  download: "Descargar",
  close: "Cerrar",
  previous: "Anterior",
  next: "Siguiente",

  language: "Idioma",
  colophon:
    "Las tarifas son las del proveedor, por segundo de salida. Lumen no añade margen ni vende créditos.",
};

const ar: Dictionary = {
  consoleSub: "لوحة الدفع لكل عملية توليد",
  quote: "التسعيرة",
  free: "بدون رسوم",
  flat: "ثابت",
  perSecond: "/ث",
  noModel: "لم يُختَر أي نموذج",

  spent: "أُنفق",
  runs: "العمليات",
  live: "جارية",

  rateCard: "قائمة الأسعار",
  rateUnit: "دولار / ثانية",
  needsKey: "يلزم مفتاح المزوّد",
  takesReference: "مرجع",

  format: "الصيغة",
  aspect: "نسبة العرض",
  duration: "المدة",
  seconds: (v) => `${v}ث`,

  promptLabel: "صف ما تريد توليده",
  promptPlaceholder: "صف اللقطة. أفلت صورة هنا لتحريكها.",
  attach: "صورة مرجعية",
  attachAria: "إرفاق صورة مرجعية",
  dropHere: "أفلت للإرفاق",
  uploading: "جارٍ قراءة الملف…",
  removeRef: "إزالة المرجع",
  switchedForReference: (label) => `أُرفقت صورة مرجعية — تم التحويل إلى ${label}.`,
  noReferenceModel: "لا يتوفر نموذج من صورة إلى فيديو بالمفتاح الحالي.",

  run: "تشغيل",
  confirm: "تأكيد",
  armed: (cost) => `${cost} يتجاوز حد التأكيد. اضغط تشغيل مرة أخرى للخصم.`,
  sending: "جارٍ الإرسال…",
  runAria: (cost) => `تشغيل هذه العملية مقابل ${cost}`,
  shortcut: "⌘↵",

  inProgress: "قيد التنفيذ",
  queuedAt: (p) => `في الانتظار · الموضع ${p}`,
  generating: "قيد التوليد",

  ledger: "السجل",
  ledgerCount: (n, spent) => `${n} عملية · ${spent}`,
  find: "ابحث في الأوامر",
  filterAll: "الكل",
  filterVideo: "فيديو",
  filterImage: "صورة",
  filterKept: "المحفوظة",
  filterFailed: "الفاشلة",
  empty: "لم تُنفَّذ أي عملية بعد. صف شيئاً في الأعلى ثم اضغط ⌘↵. يولّد وضع التجربة مقطعاً حقيقياً بلا تكلفة، فتُجرَّب الدورة كاملة قبل أي خصم.",
  emptyFiltered: "لا توجد عملية تطابق هذا المرشّح.",
  clearFilters: "مسح",

  again: "إعادة",
  reuse: "استخدام",
  keep: "حفظ",
  kept: "محفوظ",
  waiting: "جارٍ العمل…",
  failedTag: "فشل",
  videoTag: "فيديو",
  imageTag: "صورة",

  download: "تنزيل",
  close: "إغلاق",
  previous: "السابق",
  next: "التالي",

  language: "اللغة",
  colophon:
    "الأسعار هي أسعار المزوّد نفسه، لكل ثانية من الناتج. لا تضيف Lumen أي هامش ولا تبيع أي أرصدة.",
};

export const DICTIONARIES: Record<Locale, Dictionary> = { en, fr, es, ar };
