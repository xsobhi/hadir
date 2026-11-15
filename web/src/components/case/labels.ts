// Section headings for the case study page (the content itself lives in src/content/case-study).
export const labels = {
  en: {
    certs: "Four certificates, applied", verify: "Verify on Coursera", appliedHere: "Applied here",
    ux: "User experience", problem: "The problem", personas: "Personas", goals: "Goals", frustrations: "Frustrations",
    journey: "A professor's class, stage by stage", stage: "Stage", doing: "Doing", feeling: "Feeling", opportunity: "Opportunity",
    hmw: "How might we", decisions: "Design decisions", accessibility: "Accessibility", research: "Usability study plan",
    researchGoals: "Goals", questions: "Questions", kpis: "KPIs", method: "Method", participants: "Participants",
    pm: "Project management", goal: "Project goal", scopeIn: "In scope", scopeOut: "Out of scope", deliverables: "Deliverables",
    success: "Success criteria", stakeholders: "Stakeholders", interest: "Interest", influence: "Influence",
    milestones: "Milestones", raci: "RACI", task: "Task", risks: "Risk register", risk: "Risk", likelihood: "Likelihood",
    impact: "Impact", mitigation: "Mitigation", retro: "Retrospective", wentWell: "Went well", improve: "To improve",
    ai: "The assistant", graph: "The graph", reflectionGraph: "The reflection graph", tools: "Tools", kind: "Kind",
    safeguards: "Safeguards", examples: "Try asking", openDemo: "Open the demo", status: { done: "Done", next: "Next", planned: "Planned" },
    level: { low: "Low", medium: "Medium", high: "High" }, toolKind: { read: "Read", write: "Needs approval", reflection: "Reflection" },
    source: "Source and docs are in the project repository.", backHome: "Hadir",
  },
  ar: {
    certs: "أربع شهادات، مطبَّقة", verify: "التحقق على Coursera", appliedHere: "أين طُبّقت",
    ux: "تجربة المستخدم", problem: "المشكلة", personas: "الشخصيات", goals: "الأهداف", frustrations: "مصادر الإحباط",
    journey: "محاضرة الأستاذ مرحلةً مرحلة", stage: "المرحلة", doing: "ما يفعله", feeling: "ما يشعر به", opportunity: "الفرصة",
    hmw: "كيف يمكننا", decisions: "قرارات التصميم", accessibility: "إمكانية الوصول", research: "خطة دراسة قابلية الاستخدام",
    researchGoals: "الأهداف", questions: "الأسئلة", kpis: "المؤشرات", method: "المنهج", participants: "المشاركون",
    pm: "إدارة المشروع", goal: "هدف المشروع", scopeIn: "ضمن النطاق", scopeOut: "خارج النطاق", deliverables: "المخرجات",
    success: "معايير النجاح", stakeholders: "أصحاب المصلحة", interest: "الاهتمام", influence: "التأثير",
    milestones: "المراحل", raci: "مصفوفة RACI", task: "المهمة", risks: "سجل المخاطر", risk: "الخطر", likelihood: "الاحتمال",
    impact: "الأثر", mitigation: "المعالجة", retro: "مراجعة ختامية", wentWell: "ما نجح", improve: "ما يُحسَّن",
    ai: "المساعد", graph: "المخطط", reflectionGraph: "مخطط المراجعة الذاتية", tools: "الأدوات", kind: "النوع",
    safeguards: "الضمانات", examples: "جرّب أن تسأل", openDemo: "افتح النسخة التجريبية", status: { done: "أُنجز", next: "التالي", planned: "مخطط" },
    level: { low: "منخفض", medium: "متوسط", high: "مرتفع" }, toolKind: { read: "قراءة", write: "تحتاج موافقة", reflection: "مراجعة ذاتية" },
    source: "الشيفرة والوثائق في مستودع المشروع.", backHome: "حاضر",
  },
};
export type Labels = (typeof labels)["en"];
