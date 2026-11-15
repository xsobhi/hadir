"""Sample people and courses for demo workspaces. Every pair is (Arabic, English)."""

FIRST_MALE = [
    ("أحمد", "Ahmad"), ("محمد", "Mohammed"), ("يوسف", "Yousef"), ("عمر", "Omar"), ("خالد", "Khaled"),
    ("إبراهيم", "Ibrahim"), ("حمزة", "Hamza"), ("أنس", "Anas"), ("معاذ", "Moath"), ("بلال", "Bilal"),
    ("سامي", "Sami"), ("كريم", "Karim"), ("طارق", "Tareq"), ("زيد", "Zaid"), ("مصطفى", "Mustafa"),
    ("عبد الله", "Abdullah"), ("إياد", "Iyad"), ("وسيم", "Waseem"), ("نور الدين", "Nour Eldin"), ("رامي", "Rami"),
    ("هيثم", "Haitham"), ("مؤمن", "Momen"), ("أيمن", "Ayman"), ("فادي", "Fadi"),
]

FIRST_FEMALE = [
    ("مريم", "Maryam"), ("سارة", "Sara"), ("آية", "Aya"), ("ليان", "Layan"), ("نور", "Nour"),
    ("هبة", "Heba"), ("رنا", "Rana"), ("دعاء", "Duaa"), ("أسيل", "Aseel"), ("ملك", "Malak"),
    ("جنى", "Jana"), ("روان", "Rawan"), ("ياسمين", "Yasmin"), ("شهد", "Shahd"), ("بيسان", "Bisan"),
    ("إسراء", "Israa"), ("سلمى", "Salma"), ("هالة", "Hala"), ("ريم", "Reem"), ("لمى", "Lama"),
    ("أمل", "Amal"), ("تسنيم", "Tasneem"), ("منة", "Menna"), ("دانة", "Dana"),
]

FAMILY = [
    ("الأغا", "Al-Agha"), ("أبو شمالة", "Abu Shamala"), ("الحلو", "Al-Helou"), ("أبو عودة", "Abu Odeh"),
    ("السقا", "Al-Saqqa"), ("الشوا", "Al-Shawwa"), ("حمدان", "Hamdan"), ("النجار", "Al-Najjar"),
    ("أبو سيدو", "Abu Sido"), ("الكرد", "Al-Kurd"), ("مهنا", "Muhanna"), ("عاشور", "Ashour"),
    ("الطويل", "Al-Taweel"), ("سكيك", "Skaik"), ("الريس", "Al-Rayes"), ("أبو حصيرة", "Abu Hasira"),
    ("البطش", "Al-Batsh"), ("عياد", "Ayyad"), ("صيام", "Siam"), ("الخطيب", "Al-Khatib"),
    ("أبو ندى", "Abu Nada"), ("شعث", "Shaath"), ("زقوت", "Zaqout"), ("الجمل", "Al-Jamal"),
]

MAJORS = [
    ("علم الحاسوب", "Computer Science"), ("هندسة البرمجيات", "Software Engineering"),
    ("نظم المعلومات", "Information Systems"), ("تكنولوجيا المعلومات", "Information Technology"),
]

# days: weekday numbers with Monday = 0 (so Sunday = 6). Classes run Sunday to Thursday.
COURSES = [
    {
        "code": "CS231", "name_ar": "هياكل البيانات", "name_en": "Data Structures", "section": "1",
        "room": "B204", "days": "6,1", "start_time": "08:00", "duration_min": 90, "size": 38,
        "topics": [
            ("المصفوفات الديناميكية", "Dynamic arrays"), ("القوائم المترابطة", "Linked lists"),
            ("المكدسات", "Stacks"), ("الطوابير", "Queues"), ("التعاود", "Recursion"),
            ("تحليل التعقيد", "Complexity analysis"), ("الأشجار الثنائية", "Binary trees"),
            ("أشجار البحث الثنائية", "Binary search trees"), ("أشجار AVL", "AVL trees"),
            ("الكومة", "Heaps"), ("جداول التجزئة", "Hash tables"), ("الرسوم البيانية", "Graphs"),
        ],
    },
    {
        "code": "CS340", "name_ar": "تفاعل الإنسان مع الحاسوب", "name_en": "Human–Computer Interaction",
        "section": "2", "room": "C112", "days": "0,2", "start_time": "10:00", "duration_min": 90, "size": 30,
        "topics": [
            ("مبادئ قابلية الاستخدام", "Usability principles"), ("أبحاث المستخدمين", "User research"),
            ("الشخصيات ورحلة المستخدم", "Personas and journeys"), ("الإطارات السلكية", "Wireframing"),
            ("النماذج الأولية", "Prototyping"), ("اختبار قابلية الاستخدام", "Usability testing"),
            ("إمكانية الوصول", "Accessibility"), ("التصميم للغة العربية", "Designing for Arabic and RTL"),
            ("أنظمة التصميم", "Design systems"), ("التصميم المرئي", "Visual design"),
        ],
    },
    {
        "code": "CS365", "name_ar": "مقدمة في الذكاء الاصطناعي", "name_en": "Introduction to AI",
        "section": "1", "room": "Lab 3", "days": "1,3", "start_time": "12:30", "duration_min": 90, "size": 34,
        "topics": [
            ("الوكلاء الأذكياء", "Intelligent agents"), ("البحث غير المُوجَّه", "Uninformed search"),
            ("البحث الموجَّه وA*", "Informed search and A*"), ("مسائل القيود", "Constraint problems"),
            ("الاحتمالات", "Probability"), ("التعلم الآلي", "Machine learning basics"),
            ("الشبكات العصبية", "Neural networks"), ("النماذج اللغوية", "Language models"),
            ("وكلاء النماذج اللغوية", "LLM agents and tools"), ("أخلاقيات الذكاء الاصطناعي", "AI ethics"),
        ],
    },
]

PROFESSOR = {"name": "د. سلمى الحداد", "name_en": "Dr. Salma Al-Haddad",
             "title_ar": "أستاذ مساعد", "title_en": "Assistant Professor",
             "department_ar": "كلية تكنولوجيا المعلومات", "department_en": "Faculty of Information Technology"}
