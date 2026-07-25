// Advanced Course — auto-generated from coursi-ai-level2-3-enhanced.html
import type { QuizQuestion } from "./course-content-types";

export interface AdvancedChapter {
  id: number;
  title: string;
  content: string;
  quiz: QuizQuestion[];
}

export const ADVANCED_CHAPTERS: AdvancedChapter[] = [
  {
    id: 0,
    title: "هندسة الأوامر المتقدمة",
    content: `
<div class="intro-box"><p>تحكّم دقيق في مخرجات الذكاء الاصطناعي عبر تقنيات احترافية</p></div>
<h3>لماذا تحتاج مستوى متقدم من الأوامر؟</h3>
<p>في المستوى الأول تعلمت كتابة أمر واضح. الآن الهدف مختلف: تحكّم دقيق في الشكل، الطول، الأسلوب، وحتى طريقة تفكير النموذج قبل أن يجيب.</p>
<p>هذا الفرق هو ما يميز محترفاً يحصل على نتائج ثابتة وعالية الجودة، عن مستخدم يعيد المحاولة عشرات المرات.</p>
<h3>تقنيات أساسية</h3>
<p>التفكير خطوة بخطوة: اطلب من النموذج أن يشرح تفكيره قبل الإجابة النهائية، فتقل الأخطاء المنطقية.</p>
<p>الأمثلة داخل الأمر (Few-shot): أعطِ مثالاً أو مثالين على الشكل المطلوب قبل طلب النتيجة الفعلية.</p>
<p>الأدوار: اطلب من النموذج أن «يتصرف كخبير في كذا»، فهذا يغيّر أسلوب ونوعية الإجابة فعلياً.</p>
<p>التقييد بصيغة محددة: اطلب الناتج كجدول أو قائمة مرقمة أو JSON عندما تحتاج نتيجة قابلة للاستخدام مباشرة في نظام آخر.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">تحديد الدور والسياق</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">إضافة أمثلة توضيحية</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">طلب التفكير خطوة بخطوة</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">تحديد صيغة الناتج النهائي</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">Claude</div><div class="tool-desc">قوي جداً في اتباع تعليمات معقدة ومتعددة الخطوات بدقة.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">ChatGPT</div><div class="tool-desc">مرن في التبديل بين الأدوار والأساليب المختلفة بسرعة.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">PromptPerfect</div><div class="tool-desc">أداة متخصصة في تحسين صياغة أوامرك تلقائياً.</div><span class="badge badge-partial">جزئياً مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> جرّب بنفسك</div><p>خذ أمراً بسيطاً كنت تستخدمه من قبل، وأعد كتابته بإضافة: دور محدد للنموذج، مثال واحد على الشكل المطلوب، وطلب التفكير خطوة بخطوة. قارن جودة النتيجة بالسابقة.</p></div>
`,
    quiz: [
    {
      question: "ما فائدة تقنية «التفكير خطوة بخطوة»؟",
      options: ["تسريع الإجابة فقط","تقليل الأخطاء المنطقية في الإجابة النهائية","تقليل طول الإجابة","لا فائدة فعلية"],
      correct: 1,
      feedback: "عندما يشرح النموذج تفكيره أولاً، يقل احتمال الوصول لنتيجة نهائية خاطئة.",
    },
    {
      question: "متى يُفضّل تحديد صيغة الناتج مثل JSON؟",
      options: ["عندما تريد نصاً أدبياً حراً","عندما ستستخدم الناتج مباشرة داخل نظام أو تطبيق آخر","لا داعي لذلك أبداً","فقط في الأسئلة الرياضية"],
      correct: 1,
      feedback: "تحديد صيغة دقيقة مثل JSON يجعل الناتج قابلاً للقراءة والمعالجة مباشرة من أي برنامج.",
    }
    ],
  },
  {
    id: 1,
    title: "بناء التطبيقات بدون كود: Lovable و Bolt",
    content: `
<div class="intro-box"><p>حوّل فكرتك إلى تطبيق فعلي يعمل، بدون كتابة سطر برمجة واحد</p></div>
<h3>كيف تغيرت البرمجة اليوم؟</h3>
<p>أدوات مثل Lovable و Bolt تسمح لك بوصف التطبيق الذي تريده بجملة عربية أو إنجليزية واضحة، فتقوم ببناء الواجهة والوظائف الأساسية له تلقائياً.</p>
<p>هذا لا يعني أنك لا تحتاج للتفكير الهندسي، لكنه يعني أن الفكرة أصبحت أهم من إتقان لغة برمجة معينة.</p>
<h3>من الفكرة إلى تطبيق يعمل</h3>
<p>اكتب وصفاً دقيقاً لما يفعله التطبيق، ولمن هو موجّه.</p>
<p>ابنِ الصفحة الأولى فقط أولاً، وتأكد من عملها قبل إضافة ميزات أخرى.</p>
<p>اربط قاعدة بيانات (مثل Supabase) عندما تحتاج لحفظ بيانات المستخدمين.</p>
<p>اختبر التطبيق بنفسك كأنك مستخدم حقيقي قبل مشاركته مع أي شخص آخر.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">وصف الفكرة بوضوح</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">بناء أول صفحة تعمل</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">ربط قاعدة البيانات</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">اختبار ونشر تدريجي</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">Lovable</div><div class="tool-desc">لبناء تطبيقات ويب كاملة بوصف نصي، مع واجهات جاهزة الاستخدام.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Bolt.new</div><div class="tool-desc">بيئة بناء سريعة تنشئ كوداً حقيقياً يمكنك تعديله لاحقاً.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Supabase</div><div class="tool-desc">قاعدة بيانات وخدمة خلفية جاهزة تربطها بسهولة بتطبيقك.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Replit</div><div class="tool-desc">بيئة تطوير وتشغيل فورية للمشاريع الصغيرة والتجريبية.</div><span class="badge badge-partial">جزئياً مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> جرّب بنفسك</div><p>اكتب وصفاً من ٣-٤ جمل لتطبيق بسيط يحل مشكلة تواجهها فعلاً (مثال: تطبيق لتتبع مصاريفك اليومية)، بصيغة تصلح لإعطائها لأداة مثل Lovable.</p></div>
`,
    quiz: [
    {
      question: "ما الذي يُفضّل بناؤه أولاً عند إنشاء تطبيق جديد؟",
      options: ["كل الميزات دفعة واحدة","الصفحة الأولى فقط، والتأكد من عملها","قاعدة البيانات فقط","التصميم النهائي المثالي"],
      correct: 1,
      feedback: "البدء بصفحة واحدة تعمل بشكل صحيح يقلل الأخطاء ويسهّل إضافة الميزات تدريجياً.",
    },
    {
      question: "متى تحتاج لربط قاعدة بيانات مثل Supabase؟",
      options: ["عندما تريد فقط عرض نص ثابت","عندما تحتاج لحفظ بيانات المستخدمين والتفاعل معها لاحقاً","دائماً بدون استثناء","لا حاجة لها أبداً في التطبيقات الحديثة"],
      correct: 1,
      feedback: "قاعدة البيانات ضرورية عندما يحتاج تطبيقك لتذكّر بيانات المستخدمين بين الزيارات المختلفة.",
    }
    ],
  },
  {
    id: 2,
    title: "الوكلاء الذكيون المستقلون",
    content: `
<div class="intro-box"><p>أنظمة تنفذ سلسلة مهام كاملة من تلقاء نفسها دون تدخل بشري في كل خطوة</p></div>
<h3>ما الفرق بين شات بوت ووكيل ذكي؟</h3>
<p>الشات بوت يرد على سؤال واحد في كل مرة. الوكيل الذكي (AI Agent) يستطيع تنفيذ سلسلة خطوات متعددة بنفسه: يبحث، يقارن، يتخذ قراراً، وينفذ إجراءً، دون أن تطلب منه كل خطوة على حدة.</p>
<h3>أين يُستخدم عملياً</h3>
<p>وكيل يراقب المخزون ويرسل طلب توريد تلقائياً عند انخفاضه عن حد معين.</p>
<p>وكيل يبحث عن أسعار المنافسين يومياً ويرسل لك تقريراً مختصراً.</p>
<p>وكيل يتابع رسائل العملاء غير المجابة ويرسل تذكيراً للفريق المسؤول.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">استلام هدف عام</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">تخطيط خطوات التنفيذ</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">تنفيذ كل خطوة تلقائياً</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">تقرير أو إجراء نهائي</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">n8n + Claude/GPT API</div><div class="tool-desc">لبناء وكيل مخصص يربط عدة خطوات وقرارات تلقائية.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Zapier Agents</div><div class="tool-desc">وكلاء جاهزون داخل Zapier لمهام محددة ومتكررة.</div><span class="badge badge-paid">مدفوع</span></div><div class="tool-card"><div class="tool-name">Relevance AI</div><div class="tool-desc">منصة متخصصة في بناء وكلاء ذكيين متعددي الخطوات بدون كود.</div><span class="badge badge-partial">جزئياً مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> جرّب بنفسك</div><p>اختر مهمة متكررة في عملك تتطلب أكثر من خطوة (مثال: مراجعة الرسائل الجديدة ثم تصنيفها ثم الرد الأولي)، واكتب الخطوات الثلاث أو الأربع التي يجب أن ينفذها وكيل ذكي لأدائها بدلاً منك.</p></div>
`,
    quiz: [
    {
      question: "ما الفرق الجوهري بين الشات بوت والوكيل الذكي؟",
      options: ["لا يوجد فرق حقيقي","الوكيل ينفذ سلسلة خطوات وقرارات دون تدخل في كل خطوة","الشات بوت أسرع دائماً","الوكيل يعمل فقط على الهاتف"],
      correct: 1,
      feedback: "الوكيل الذكي يخطط وينفذ عدة خطوات متتالية باتخاذ قرارات بينها، بينما الشات بوت يرد على سؤال واحد فقط.",
    },
    {
      question: "أي مثال يوضح استخداماً عملياً لوكيل ذكي؟",
      options: ["كتابة قصيدة واحدة عند الطلب","مراقبة المخزون وإرسال طلب توريد تلقائياً عند انخفاضه","ترجمة كلمة واحدة","تغيير لون خلفية موقع"],
      correct: 1,
      feedback: "هذا مثال حقيقي على وكيل يراقب حالة مستمرة (المخزون) ويتخذ إجراءً تلقائياً عند تحقق شرط معين.",
    }
    ],
  },
  {
    id: 3,
    title: "بناء منتجات مدعومة بالذكاء الاصطناعي",
    content: `
<div class="intro-box"><p>من فكرة إلى منتج حقيقي يستخدمه أشخاص آخرون</p></div>
<h3>الفرق بين أداة شخصية ومنتج</h3>
<p>أداة شخصية تخدمك أنت فقط. المنتج يخدم آخرين، وله مستخدمون، ونظام دفع، وتحسين مستمر بناءً على ملاحظاتهم.</p>
<p>أغلب المنتجات الناجحة المبنية على الذكاء الاصطناعي اليوم لا تخترع نموذجاً جديداً، بل تحل مشكلة محددة جداً لفئة محددة جداً من الناس.</p>
<h3>خطوات إطلاق منتج بسيط</h3>
<p>حدد مشكلة واحدة محددة جداً تحلها (وليس «كل شيء لكل الناس»).</p>
<p>ابنِ نسخة أولى بسيطة (MVP) بأدوات بدون كود.</p>
<p>اعرضها على ١٠-٢٠ شخصاً حقيقياً من جمهورك المستهدف قبل أي تسويق واسع.</p>
<p>استمع لملاحظاتهم وحسّن المنتج بناءً عليها قبل التوسع.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">مشكلة محددة وواضحة</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">نسخة أولى بسيطة (MVP)</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">اختبار مع مستخدمين حقيقيين</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">تحسين مستمر وتوسع</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">Lovable / Bolt</div><div class="tool-desc">لبناء النسخة الأولى من المنتج بسرعة.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Stripe</div><div class="tool-desc">لإضافة نظام دفع واشتراكات لمنتجك بسهولة.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Product Hunt</div><div class="tool-desc">منصة عالمية لعرض منتجك الجديد أمام أول جمهور مهتم بالتقنية.</div><span class="badge badge-free">مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> جرّب بنفسك</div><p>اكتب جملة واحدة تصف مشكلة محددة جداً يواجهها نوع معين من الناس، ويمكن للذكاء الاصطناعي حلها. مثال: «أصحاب المطاعم الصغيرة يقضون وقتاً طويلاً في الرد على استفسارات الحجز المتكررة».</p></div>
`,
    quiz: [
    {
      question: "ما الخطأ الشائع عند إطلاق منتج جديد؟",
      options: ["البدء بمشكلة محددة جداً","محاولة حل «كل شيء لكل الناس» من البداية","اختبار المنتج مع مستخدمين حقيقيين","بناء نسخة أولى بسيطة"],
      correct: 1,
      feedback: "المنتجات الناجحة غالباً تبدأ بحل مشكلة ضيقة ومحددة جداً، ثم تتوسع تدريجياً.",
    },
    {
      question: "لماذا تُعرض النسخة الأولى على ١٠-٢٠ شخصاً قبل التوسع؟",
      options: ["لتحقيق أرباح فورية كبيرة","للحصول على ملاحظات حقيقية تحسّن المنتج قبل الاستثمار في التوسع","لأن القانون يفرض ذلك","لا داعي لهذه الخطوة"],
      correct: 1,
      feedback: "الملاحظات المبكرة من مستخدمين حقيقيين توفر عليك بناء ميزات لا يحتاجها أحد فعلاً.",
    }
    ],
  },
  {
    id: 4,
    title: "أخلاقيات الذكاء الاصطناعي والاستخدام المسؤول",
    content: `
<div class="intro-box"><p>كيف تستخدم هذه الأدوات بثقة ودون الإضرار بك أو بعملائك</p></div>
<h3>لماذا هذا الفصل مهم لأي محترف</h3>
<p>كلما استخدمت الذكاء الاصطناعي في عملك، زادت مسؤوليتك تجاه من تخدمهم. الأخطاء الشائعة هنا ليست تقنية بل تتعلق بالثقة والشفافية والدقة.</p>
<h3>مبادئ عملية يجب اتباعها</h3>
<p>أخبر عملاءك عندما يتفاعلون مع نظام آلي وليس إنساناً، خصوصاً في خدمة العملاء.</p>
<p>لا تعتمد على إجابة الذكاء الاصطناعي وحدها في القرارات المالية أو الطبية أو القانونية دون تحقق بشري.</p>
<p>احترم خصوصية بيانات عملائك، ولا ترفعها لأي أداة لا تثق بسياسة خصوصيتها.</p>
<p>راجع أي محتوى ينشره الذكاء الاصطناعي باسمك قبل النشر، فالمسؤولية القانونية والأخلاقية تبقى عليك أنت.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">استخدام الأداة</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">تحقق بشري من الدقة</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">شفافية مع المستخدم النهائي</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">مسؤولية كاملة عن الناتج</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">لا توجد أداة محددة</div><div class="tool-desc">هذا الفصل مبادئ عمل وليس أداة تقنية — طبّقها مع كل أداة تستخدمها.</div><span class="badge badge-free">مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> جرّب بنفسك</div><p>راجع آخر محتوى أو رد استخدمت فيه الذكاء الاصطناعي في عملك، واسأل نفسك: هل كان شفافاً مع من استقبله؟ وهل تحققت من دقته قبل إرساله؟</p></div>
`,
    quiz: [
    {
      question: "من يتحمل المسؤولية القانونية عن محتوى ينشره الذكاء الاصطناعي باسم صاحب العمل؟",
      options: ["الأداة نفسها","الشركة المطورة للأداة فقط","صاحب العمل الذي استخدمها ونشرها","لا أحد يتحمل المسؤولية"],
      correct: 2,
      feedback: "مهما كانت الأداة متقدمة، المسؤولية القانونية والأخلاقية عن أي محتوى منشور تبقى على من نشره واستخدمه.",
    },
    {
      question: "ما المبدأ الصحيح عند استخدام الشات بوت في خدمة العملاء؟",
      options: ["إخفاء أنه نظام آلي عن العميل","إخبار العميل بوضوح أنه يتفاعل مع نظام آلي","تجاهل الموضوع تماماً","الادعاء بأنه إنسان دائماً"],
      correct: 1,
      feedback: "الشفافية مع المستخدم حول طبيعة النظام الذي يتفاعل معه أساس الثقة والاستخدام المسؤول.",
    }
    ],
  },
  {
    id: 5,
    title: "مشروع التخرج: إطلاق مشروعك الأول",
    content: `
<div class="intro-box"><p>طبّق كل ما تعلمته في مشروع واحد متكامل من الفكرة إلى الإطلاق</p></div>
<h3>ماذا يشمل هذا المشروع؟</h3>
<p>هذا الفصل الأخير ليس درساً جديداً، بل تطبيقاً عملياً لكل ما مررت به في المستويات الثلاثة: اختيار مشكلة حقيقية، بناء حل بسيط بأدوات بدون كود، إضافة أتمتة أو شات بوت يدعمه، واختباره مع أشخاص حقيقيين.</p>
<h3>خطوات المشروع النهائي</h3>
<p>اختر مشكلة واحدة محددة تعرفها جيداً من محيطك أو عملك.</p>
<p>ابنِ حلاً بسيطاً باستخدام أداة بدون كود (تطبيق، شات بوت، أو أتمتة).</p>
<p>أضف طبقة ذكاء اصطناعي واحدة تحسّن التجربة (تحليل، رد تلقائي، أو توصية).</p>
<p>اعرضه على ٥ أشخاص على الأقل واجمع ملاحظاتهم كتابياً.</p>
<p>وثّق ما تعلمته وما ستحسّنه في نسخة تالية.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">اختيار المشكلة</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">بناء الحل الأولي</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">إضافة طبقة ذكاء اصطناعي</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">اختبار وتوثيق النتائج</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">كل أدوات المستويات الثلاثة</div><div class="tool-desc">هذا المشروع يجمع الأدوات التي تعلمتها سابقاً في تطبيق واحد.</div><span class="badge badge-free">مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> مشروعك النهائي</div><p>اكتب خطة من فقرة واحدة تحدد فيها: المشكلة التي تحلها، الأداة أو الأدوات التي ستستخدمها، وكيف ستعرف أن مشروعك نجح. هذه الخطة هي بداية مشروعك الحقيقي بعد الكورس.</p></div>
`,
    quiz: [
    {
      question: "ما الهدف الأساسي من مشروع التخرج؟",
      options: ["حفظ معلومات جديدة فقط","تطبيق عملي شامل لكل ما تعلمته في مشروع حقيقي واحد","اجتياز اختبار نظري","لا هدف محدد"],
      correct: 1,
      feedback: "هذا الفصل مصمم ليكون تطبيقاً عملياً متكاملاً يجمع مهارات كل المستويات السابقة.",
    },
    {
      question: "لماذا يجب جمع ملاحظات من أشخاص حقيقيين قبل اعتبار المشروع مكتملاً؟",
      options: ["لأن القانون يفرض ذلك","للتأكد أن الحل يحل مشكلة فعلية وليس افتراضاً شخصياً فقط","لا داعي لذلك أبداً","فقط لزيادة عدد المستخدمين"],
      correct: 1,
      feedback: "ملاحظات المستخدمين الحقيقيين هي الطريقة الوحيدة لمعرفة إن كان الحل يحل المشكلة فعلاً أم لا.",
    }
    ],
  }
];
