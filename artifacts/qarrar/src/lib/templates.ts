export interface DecisionTemplate {
  id: string;
  name: string;
  icon: string;
  question: string;
  criteria: { label: string; weight: number }[];
}

export const decisionTemplates: DecisionTemplate[] = [
  {
    id: "hiring",
    name: "توظيف مرشح",
    icon: "👤",
    question: "أي مرشح يجب أن نوظف؟",
    criteria: [
      { label: "الخبرة التقنية", weight: 5 },
      { label: "التوافق الثقافي مع الفريق", weight: 4 },
      { label: "مهارات التواصل", weight: 4 },
      { label: "التكلفة (الراتب المطلوب)", weight: 3 },
      { label: "إمكانية النمو والتطور", weight: 3 },
    ],
  },
  {
    id: "vendor",
    name: "اختيار مورّد",
    icon: "🤝",
    question: "أي مورّد يجب أن نتعاقد معه؟",
    criteria: [
      { label: "السعر", weight: 5 },
      { label: "الجودة", weight: 5 },
      { label: "سرعة التوريد", weight: 4 },
      { label: "الموثوقية وسمعة السوق", weight: 4 },
      { label: "خدمة ما بعد البيع", weight: 3 },
    ],
  },
  {
    id: "purchase",
    name: "قرار شراء",
    icon: "🛒",
    question: "أي منتج/نظام يجب أن نشتري؟",
    criteria: [
      { label: "التكلفة الإجمالية", weight: 5 },
      { label: "تلبية الاحتياجات الأساسية", weight: 5 },
      { label: "سهولة الاستخدام", weight: 3 },
      { label: "الدعم الفني", weight: 3 },
      { label: "قابلية التوسع مستقبلاً", weight: 2 },
    ],
  },
  {
    id: "project",
    name: "أولوية مشروع",
    icon: "🎯",
    question: "أي مشروع يجب أن نبدأ به أولاً؟",
    criteria: [
      { label: "الأثر على العملاء", weight: 5 },
      { label: "العائد المتوقع", weight: 5 },
      { label: "الجهد والتكلفة المطلوبة", weight: 4 },
      { label: "المخاطر", weight: 3 },
      { label: "التوافق مع الاستراتيجية", weight: 4 },
    ],
  },
  {
    id: "office",
    name: "اختيار مقر / موقع",
    icon: "📍",
    question: "أي موقع يجب أن نختار؟",
    criteria: [
      { label: "التكلفة (الإيجار/الشراء)", weight: 5 },
      { label: "الموقع وسهولة الوصول", weight: 4 },
      { label: "المساحة والملاءمة", weight: 4 },
      { label: "إمكانية التوسع", weight: 2 },
    ],
  },
];
