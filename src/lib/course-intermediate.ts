// Intermediate Course — auto-generated from coursi-ai-level2-3-enhanced.html
import type { QuizQuestion } from "./course-content-types";

export interface IntermediateChapter {
  id: number;
  title: string;
  content: string;
  quiz: QuizQuestion[];
}

export const INTERMEDIATE_CHAPTERS: IntermediateChapter[] = [
  {
    id: 0,
    title: "الأتمتة الذكية: Zapier و Make",
    content: `
<div class="intro-box"><p>اربط تطبيقاتك ببعضها ودع الذكاء الاصطناعي يعمل نيابة عنك</p></div>
<h3>لماذا الأتمتة؟</h3>
<p>تخيل أن رسالة بريد إلكتروني جديدة تصل، فيتم تلخيصها تلقائياً، وإرسال ملخصها إلى فريقك على تطبيق تيليجرام، دون أن تلمس شيئاً. هذا بالضبط ما تفعله أدوات الأتمتة.</p>
<p>الفكرة الأساسية: أنت تحدد «عندما يحدث كذا، افعل كذا»، والأداة تنفذ ذلك تلقائياً في كل مرة، على مدار الساعة.</p>
<h3>كيف تبني أول أتمتة</h3>
<p>كل أتمتة تتكون من ثلاثة أجزاء بسيطة:</p>
<p>المُشغّل (Trigger): الحدث الذي يبدأ العملية، مثل وصول رسالة جديدة.</p>
<p>الشرط (Filter): تصفية اختيارية، مثل تنفيذ الأتمتة فقط إذا كانت الرسالة من عميل معين.</p>
<p>الإجراء (Action): ما يحدث بعد ذلك، مثل إرسال إشعار أو حفظ البيانات في جدول.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">حدث جديد (بريد، نموذج، طلب)</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">تحليل بالذكاء الاصطناعي</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">تنفيذ إجراء تلقائي</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">إشعار أو حفظ النتيجة</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">Zapier</div><div class="tool-desc">يربط أكثر من ٦٠٠٠ تطبيق ببعضها بخطوات بسيطة بدون كود.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Make</div><div class="tool-desc">مشابه لـ Zapier لكنه يمنحك تحكماً بصرياً أعمق في مسار العملية.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">n8n</div><div class="tool-desc">أداة أتمتة مفتوحة المصدر لمن يريد تحكماً كاملاً وتكلفة أقل مع النمو.</div><span class="badge badge-free">مجاني</span></div><div class="tool-card"><div class="tool-name">IFTTT</div><div class="tool-desc">مناسبة للأتمتة البسيطة اليومية بين التطبيقات الشخصية.</div><span class="badge badge-partial">جزئياً مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> جرّب بنفسك</div><p>افتح Zapier، واختر مُشغّلاً بسيطاً مثل «رسالة بريد جديدة تحتوي على كلمة معينة»، واجعل الإجراء هو «إرسال رسالة إلى تيليجرام». لا حاجة لتفعيلها فعلياً، فقط تدرّب على بناء الخطوات.</p></div>
`,
    quiz: [
    {
      question: "ما هو «المُشغّل» في أي أتمتة؟",
      options: ["الإجراء النهائي","الحدث الذي يبدأ العملية","اسم التطبيق","كلفة الاشتراك"],
      correct: 1,
      feedback: "المُشغّل هو الحدث الذي يبدأ سلسلة الأتمتة، مثل وصول بريد جديد أو تعبئة نموذج.",
    },
    {
      question: "أي أداة مفتوحة المصدر ومناسبة لمن يريد تحكماً كاملاً؟",
      options: ["Zapier","IFTTT","n8n","Notion"],
      correct: 2,
      feedback: "n8n مفتوحة المصدر ويمكن استضافتها ذاتياً، ما يمنح تحكماً أكبر وتكلفة أقل مع الاستخدام الكبير.",
    }
    ],
  },
  {
    id: 1,
    title: "بناء روبوتات الدردشة بدون برمجة",
    content: `
<div class="intro-box"><p>صمّم مساعداً ذكياً يرد على عملائك أو زوار موقعك على مدار الساعة</p></div>
<h3>ما الذي يجعل الشات بوت مفيداً؟</h3>
<p>الشات بوت الجيد ليس مجرد رد آلي جامد، بل نظام يفهم سؤال المستخدم، ويرجع إلى مصدر معلومات محدد (مثل الأسئلة الشائعة لديك)، ويرد بأسلوب طبيعي.</p>
<p>أهم فرق بين شات بوت بدائي وآخر احترافي هو مصدر المعرفة الذي يعتمد عليه — كلما كان أدق وأحدث، كانت الإجابات أفضل.</p>
<h3>خطوات البناء</h3>
<p>حدّد الهدف: هل هو خدمة عملاء، أم مساعد مبيعات، أم مساعد داخلي للموظفين؟</p>
<p>اجمع مصدر المعرفة: ملف أسئلة شائعة، أو صفحات موقعك، أو مستندات الشركة.</p>
<p>اربط المصدر بالأداة، واختبر الإجابات على أسئلة حقيقية قبل النشر.</p>
<p>أضف زر تحويل إلى إنسان في حال لم يستطع الروبوت الإجابة.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">سؤال المستخدم</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">البحث في مصدر المعرفة</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">صياغة إجابة طبيعية</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">تحويل لموظف عند الحاجة</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">Voiceflow</div><div class="tool-desc">لبناء شات بوت متعدد الخطوات بواجهة سحب وإفلات.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Chatbase</div><div class="tool-desc">يحوّل مستنداتك مباشرة إلى شات بوت مدرّب على محتواك خلال دقائق.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Intercom</div><div class="tool-desc">حل متكامل لخدمة العملاء يجمع بين الشات بوت والدردشة المباشرة.</div><span class="badge badge-paid">مدفوع</span></div><div class="tool-card"><div class="tool-name">Tidio</div><div class="tool-desc">خيار بسيط وسريع لأصحاب المتاجر الإلكترونية الصغيرة.</div><span class="badge badge-partial">جزئياً مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> جرّب بنفسك</div><p>اكتب قائمة من ٥ أسئلة شائعة يسألها عملاؤك فعلاً، وحاول تخيل كيف يجب أن يرد عليها شات بوت جيد بأسلوب ودود ومختصر.</p></div>
`,
    quiz: [
    {
      question: "ما أهم عنصر يحدد جودة إجابات الشات بوت؟",
      options: ["لون الواجهة","مصدر المعرفة الذي يعتمد عليه","سرعة الإنترنت","اسم الشركة"],
      correct: 1,
      feedback: "جودة مصدر المعرفة (الأسئلة الشائعة، المستندات) هي ما يحدد دقة إجابات الروبوت.",
    },
    {
      question: "لماذا يجب إضافة زر «التحويل إلى إنسان»؟",
      options: ["لتزيين الواجهة فقط","لأن الروبوت لا يفهم أي شيء أبداً","لمعالجة الحالات التي يعجز فيها الروبوت عن الإجابة","لزيادة تكلفة الأداة"],
      correct: 2,
      feedback: "مهما كان الروبوت ذكياً، هناك حالات استثنائية يجب أن تصل فيها للموظف البشري مباشرة.",
    }
    ],
  },
  {
    id: 2,
    title: "تحليل البيانات باستخدام الذكاء الاصطناعي",
    content: `
<div class="intro-box"><p>حوّل الأرقام والجداول إلى قرارات واضحة خلال دقائق</p></div>
<h3>لماذا تحتاج لهذه المهارة؟</h3>
<p>أغلب أصحاب الأعمال يملكون بيانات (مبيعات، زوار الموقع، تعليقات العملاء) لكنهم لا يستغلونها لأن تحليلها يبدو معقداً. الذكاء الاصطناعي اليوم يستطيع قراءة ملف إكسل وإخراج تحليل واضح خلال ثوانٍ.</p>
<h3>كيف تستخدمه عملياً</h3>
<p>ارفع ملف البيانات (إكسل أو CSV) إلى الأداة.</p>
<p>اطلب أسئلة محددة: «ما هو أكثر منتج مبيعاً هذا الشهر؟» بدلاً من «حلل البيانات» بشكل عام.</p>
<p>اطلب رسماً بيانياً يوضح الاتجاه بدلاً من جدول أرقام فقط.</p>
<p>تحقق دائماً من الأرقام المهمة يدوياً قبل اتخاذ قرار كبير بناءً عليها.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">رفع ملف البيانات</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">سؤال محدد وواضح</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">تحليل واستخراج الأنماط</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">رسم بياني وتوصية</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">ChatGPT (وضع تحليل البيانات)</div><div class="tool-desc">يقرأ ملفات إكسل و CSV مباشرة وينشئ رسوماً بيانية وتحليلات.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Julius AI</div><div class="tool-desc">أداة متخصصة في تحليل البيانات والإجابة عليها بلغة طبيعية.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Google Sheets + Gemini</div><div class="tool-desc">تحليل مباشر داخل جداول جوجل دون الحاجة لأداة خارجية.</div><span class="badge badge-free">مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> جرّب بنفسك</div><p>إن كان لديك أي ملف بيانات بسيط (حتى قائمة مصاريف شهرية)، ارفعه لأي أداة ذكاء اصطناعي واسألها: ما هو أعلى بند إنفاق هذا الشهر؟ ولاحظ سرعة ودقة الإجابة.</p></div>
`,
    quiz: [
    {
      question: "ما هي أفضل طريقة لطرح سؤال على أداة تحليل البيانات؟",
      options: ["سؤال عام مثل «حلل البيانات»","سؤال محدد مثل «ما أكثر منتج مبيعاً هذا الشهر؟»","عدم طرح أي سؤال","إرسال الملف بدون أي نص"],
      correct: 1,
      feedback: "الأسئلة المحددة تعطي نتائج أدق وأكثر فائدة من الطلبات العامة.",
    },
    {
      question: "ماذا يجب أن تفعل قبل اتخاذ قرار كبير بناءً على تحليل الذكاء الاصطناعي؟",
      options: ["تنفيذ القرار فوراً","تجاهل النتيجة","التحقق من الأرقام المهمة يدوياً","حذف الملف"],
      correct: 2,
      feedback: "الذكاء الاصطناعي قد يخطئ أحياناً، لذلك التحقق اليدوي من الأرقام الحساسة خطوة أساسية.",
    }
    ],
  },
  {
    id: 3,
    title: "التسويق الرقمي بالذكاء الاصطناعي",
    content: `
<div class="intro-box"><p>خطط حملاتك، واكتب إعلاناتك، وحلل نتائجك بمساعدة الذكاء الاصطناعي</p></div>
<h3>أين يساعدك الذكاء الاصطناعي في التسويق؟</h3>
<p>كتابة نصوص إعلانية بعدة أساليب لاختيار الأفضل.</p>
<p>توليد أفكار محتوى لأسبوع كامل خلال دقائق.</p>
<p>تحليل أداء الحملات واقتراح تحسينات.</p>
<p>إنشاء صور وفيديوهات إعلانية بدون مصور أو مصمم.</p>
<h3>صياغة أمر إعلاني فعّال</h3>
<p>أعطِ الأداة: الجمهور المستهدف، الميزة الأساسية للمنتج، ولهجة الحملة (رسمية أو ودودة).</p>
<p>اطلب ٣ نسخ مختلفة من نفس الإعلان لاختبارها ومقارنة أدائها.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">تحديد الجمهور والهدف</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">توليد نصوص وصور متعددة</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">اختيار الأنسب واختباره</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">تحليل النتائج وتحسينها</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">ChatGPT</div><div class="tool-desc">لكتابة نصوص إعلانية وخطط محتوى بسرعة.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Canva Magic Studio</div><div class="tool-desc">لتصميم صور وفيديوهات إعلانية جاهزة للنشر.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">AdCreative.ai</div><div class="tool-desc">متخصصة في توليد تصاميم إعلانية مُختبرة لتحسين نسبة النقر.</div><span class="badge badge-paid">مدفوع</span></div><div class="tool-card"><div class="tool-name">Meta Advantage+</div><div class="tool-desc">ميزة داخل إعلانات ميتا تستخدم الذكاء الاصطناعي لتحسين استهداف الحملة تلقائياً.</div><span class="badge badge-free">مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> جرّب بنفسك</div><p>اختر منتجاً أو خدمة تعرفها جيداً، واطلب من أي أداة ذكاء اصطناعي كتابة ٣ نسخ مختلفة من إعلان قصير له، بلهجات مختلفة (رسمية، ودودة، مباشرة).</p></div>
`,
    quiz: [
    {
      question: "لماذا يُفضّل طلب عدة نسخ من نفس الإعلان؟",
      options: ["لإضاعة الوقت","لاختبار أيها يحقق أداء أفضل","لأن الأداة تطلب ذلك","لا فائدة من ذلك"],
      correct: 1,
      feedback: "اختبار عدة نسخ (A/B Testing) يساعدك على معرفة أي أسلوب يحقق نتائج أفضل فعلياً.",
    },
    {
      question: "ما هي الميزة الأساسية لأداة مثل AdCreative.ai؟",
      options: ["كتابة الأكواد البرمجية","توليد تصاميم إعلانية مُختبرة لتحسين النقر","إدارة المخزون","حجز الفنادق"],
      correct: 1,
      feedback: "AdCreative.ai متخصصة في توليد تصاميم إعلانية مبنية على بيانات لتحسين معدل التفاعل.",
    }
    ],
  },
  {
    id: 4,
    title: "إنتاج المحتوى بالجملة",
    content: `
<div class="intro-box"><p>أنشئ عشرات المنشورات والمقالات بجودة ثابتة دون أن تكتب كل كلمة بنفسك</p></div>
<h3>فكرة الإنتاج بالجملة</h3>
<p>بدلاً من كتابة منشور واحد كل مرة، يمكنك إعداد «قالب أساسي» يحدد أسلوبك ونبرتك، ثم استخدامه لإنتاج عشرات القطع من المحتوى بنفس الجودة، وتخصيص كل واحدة بسرعة.</p>
<p>المفتاح هنا هو الاتساق: نفس الأسلوب، نفس الهيكل، محتوى مختلف.</p>
<h3>خطوات عملية</h3>
<p>حدد ١٠-٢٠ فكرة رئيسية لمحتوى الشهر.</p>
<p>أنشئ قالب أمر واحد قوي يحدد الأسلوب والطول والجمهور.</p>
<p>استخدم نفس القالب مع كل فكرة لإنتاج المسودات دفعة واحدة.</p>
<p>راجع وعدّل يدوياً قبل النشر — لا تنشر أي شيء دون مراجعة بشرية.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">١٠-٢٠ فكرة محتوى</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">قالب أمر ثابت</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">إنتاج دفعة مسودات</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">مراجعة بشرية ونشر</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">ChatGPT / Claude</div><div class="tool-desc">لإنتاج مسودات متعددة بنفس الأسلوب باستخدام قالب أمر واحد.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Notion AI</div><div class="tool-desc">لتنظيم وإنتاج المحتوى داخل مساحة عمل واحدة.</div><span class="badge badge-paid">مدفوع</span></div><div class="tool-card"><div class="tool-name">Buffer / Later</div><div class="tool-desc">لجدولة نشر كل المحتوى المُنتَج على مدار الشهر دفعة واحدة.</div><span class="badge badge-partial">جزئياً مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> جرّب بنفسك</div><p>اكتب قالب أمر واحد يصف أسلوبك (اللهجة، الطول، الجمهور)، ثم استخدمه مع ٣ أفكار مختلفة، ولاحظ مدى التشابه في الأسلوب رغم اختلاف المواضيع.</p></div>
`,
    quiz: [
    {
      question: "ما هو المفتاح الأساسي في إنتاج المحتوى بالجملة؟",
      options: ["السرعة فقط","الاتساق في الأسلوب مع اختلاف المحتوى","عدد الكلمات","استخدام لغة إنجليزية فقط"],
      correct: 1,
      feedback: "الهدف هو الحفاظ على نفس الأسلوب والهيكل بينما يختلف المحتوى نفسه من قطعة لأخرى.",
    },
    {
      question: "ما الخطوة التي لا يجب تخطيها أبداً قبل النشر؟",
      options: ["الجدولة","المراجعة البشرية","الترجمة","التصميم"],
      correct: 1,
      feedback: "مهما كانت جودة الذكاء الاصطناعي، المراجعة البشرية قبل النشر ضرورية لتفادي الأخطاء.",
    }
    ],
  },
  {
    id: 5,
    title: "العمل الحر بالذكاء الاصطناعي",
    content: `
<div class="intro-box"><p>حوّل مهاراتك الجديدة إلى مصدر دخل حقيقي كمستقل</p></div>
<h3>ما الخدمات التي يمكنك تقديمها الآن؟</h3>
<p>بعد إتقان ما سبق، أصبح لديك مهارات مطلوبة فعلياً في السوق: كتابة محتوى بالذكاء الاصطناعي، بناء أتمتة بسيطة للشركات الصغيرة، إعداد شات بوت لموقع عميل، أو تحليل بيانات بسيطة لمتجر إلكتروني.</p>
<h3>كيف تبدأ فعلياً</h3>
<p>حدد خدمة واحدة تبدأ بها بدلاً من عرض كل شيء دفعة واحدة.</p>
<p>أنشئ ٢-٣ نماذج أعمال (Portfolio) حتى لو كانت تدريبية في البداية.</p>
<p>سجّل حساباً في منصة عمل حر وابدأ بعروض أسعار واضحة ومحددة.</p>
<p>اطلب تقييمات من أول عملائك — فهي أهم أداة تسويق لك لاحقاً.</p>
<div class="flow-wrap"><div class="block-title"><span class="block-ic">⚡</span> المخطط التفاعلي</div><p class="flow-caption">تدفق العملية من البداية إلى النتيجة النهائية.</p><div class="flow-diagram"><div class="flow-node" data-flow-node="0"><div class="flow-ic">1</div><div class="flow-title-s">اختيار خدمة واحدة</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.0s"></span></div><div class="flow-node" data-flow-node="1"><div class="flow-ic">2</div><div class="flow-title-s">بناء نماذج أعمال</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.3s"></span></div><div class="flow-node" data-flow-node="2"><div class="flow-ic">3</div><div class="flow-title-s">عرض أسعار واضح</div></div><div class="flow-arrow"><span class="flow-arrow-dot" style="animation-delay:0.6s"></span></div><div class="flow-node" data-flow-node="3"><div class="flow-ic">4</div><div class="flow-title-s">عملاء وتقييمات</div></div></div></div>
<div class="block-title"><span class="block-ic">🛠</span> أدوات مقترحة</div><div class="tools-grid"><div class="tool-card"><div class="tool-name">Upwork / Fiverr</div><div class="tool-desc">منصات عالمية لعرض خدماتك المرتبطة بالذكاء الاصطناعي وإيجاد عملاء.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">مستقل (Mostaql)</div><div class="tool-desc">منصة عربية للعمل الحر مناسبة للسوق الخليجي والعربي.</div><span class="badge badge-partial">جزئياً مجاني</span></div><div class="tool-card"><div class="tool-name">Notion</div><div class="tool-desc">لتنظيم عروضك وعملائك ومتابعة مشاريعك كمستقل.</div><span class="badge badge-partial">جزئياً مجاني</span></div></div>
<div class="exercise-box"><div class="block-title"><span class="block-ic">🎯</span> جرّب بنفسك</div><p>اكتب وصفاً لخدمة واحدة فقط يمكنك تقديمها الآن (مثال: «إعداد شات بوت بسيط لصفحة إنستغرام تجارية») في ٣-٤ جمل واضحة، كأنها عرض حقيقي لعميل.</p></div>
`,
    quiz: [
    {
      question: "لماذا يُنصح بالبدء بخدمة واحدة فقط؟",
      options: ["لأنها الطريقة الوحيدة القانونية","لتقديم قيمة واضحة ومركزة بدلاً من التشتت","لأنها أرخص","لا يوجد سبب محدد"],
      correct: 1,
      feedback: "التركيز على خدمة واحدة يجعل عرضك أوضح للعميل ويسهّل عليك إتقانها بسرعة.",
    },
    {
      question: "ما أهم أداة تسويق لمستقل جديد؟",
      options: ["الإعلانات المدفوعة الكبيرة","تقييمات العملاء الأوائل","عدد المتابعين","اسم النطاق"],
      correct: 1,
      feedback: "التقييمات الحقيقية من أول عملائك تبني الثقة وتجذب عملاء جدد أسرع من أي إعلان.",
    }
    ],
  }
];
