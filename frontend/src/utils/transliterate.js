// Smart Multilingual Translation & Transliteration Engine for KSC Platform
// Translates dynamic database content between Kurdish Sorani, Arabic, and English

// 1. Comprehensive Kurdish/Arabic to English Name Dictionary
const NAME_DICTIONARY_EN = {
  // Kurdish Names
  'ئاریان': 'Arian',
  'ئاراس': 'Aras',
  'ئارام': 'Aram',
  'ئامانج': 'Amanj',
  'ئازاد': 'Azad',
  'ئاسۆ': 'Aso',
  'ئاڤان': 'Avan',
  'ئاڵا': 'Ala',
  'ئارۆ': 'Aro',
  'ئاری': 'Ari',
  'ئارمانج': 'Armanj',
  'ئەوین': 'Evin',
  'بەرهەم': 'Barham',
  'بەختیار': 'Bakhtiar',
  'بڕوا': 'Brwa',
  'باوان': 'Bawan',
  'بەیان': 'Bayan',
  'پێشەوا': 'Peshawa',
  'پشتیوان': 'Pshitiwan',
  'پەری': 'Pari',
  'پەروا': 'Parwa',
  'تەها': 'Taha',
  'چیا': 'Chya',
  'چنار': 'Chnar',
  'چنوور': 'Chnur',
  'دانا': 'Dana',
  'دیار': 'Diyar',
  'دیاری': 'Dyari',
  'دڵشاد': 'Dilshad',
  'دڵنیا': 'Dilnya',
  'دەریا': 'Darya',
  'دێکان': 'Dekan',
  'ڕەوەند': 'Rawand',
  'ڕێبین': 'Rebin',
  'ڕێبوار': 'Rebwar',
  'ڕێباز': 'Rebaz',
  'ڕێژوان': 'Rezhwan',
  'ڕۆژین': 'Rozhin',
  'ڕۆژگار': 'Rozhgar',
  'ژیر': 'Zhir',
  'ژینۆ': 'Zhino',
  'ژوان': 'Zhwan',
  'زانا': 'Zana',
  'زریان': 'Zryan',
  'سارا': 'Sara',
  'سۆران': 'Soran',
  'سۆزان': 'Sozan',
  'سۆما': 'Soma',
  'سۆزیار': 'Sozyar',
  'سۆلێن': 'Solen',
  'سایە': 'Saya',
  'سروشت': 'Srusht',
  'سروە': 'Srwa',
  'سەنگەر': 'Sangar',
  'سەردار': 'Sardar',
  'سەروەر': 'Sarwar',
  'سەهەند': 'Sahand',
  'شوان': 'Shwan',
  'شەنگ': 'Shang',
  'شیرین': 'Shirin',
  'شێنێ': 'Shene',
  'شێرزاد': 'Sherzad',
  'شاهۆ': 'Shaho',
  'شەهێن': 'Shahen',
  'شارا': 'Shara',
  'شیلان': 'Shilan',
  'شنۆ': 'Shno',
  'شنە': 'Shna',
  'فەرهاد': 'Farhad',
  'فەتاح': 'Fatah',
  'ڤیان': 'Vyan',
  'کاروان': 'Karwan',
  'کاوە': 'Kawa',
  'کامەران': 'Kamaran',
  'کۆسار': 'Kosar',
  'کانی': 'Kani',
  'گۆران': 'Goran',
  'گەشە': 'Gasha',
  'لاوێن': 'Lawen',
  'لێزان': 'Lezan',
  'لانە': 'Lana',
  'نیان': 'Nyan',
  'نازدار': 'Nazdar',
  'هێمن': 'Hemin',
  'هیوا': 'Hiwa',
  'هێرش': 'Hersh',
  'هەڤاڵ': 'Haval',
  'هەڵگورد': 'Halgurd',
  'هەندرێن': 'Handren',
  'هانا': 'Hana',
  'هێدی': 'Hedi',
  'هۆگر': 'Hogr',
  'هێژا': 'Hezha',
  'هەڵمەت': 'Halmat',
  'مەریوان': 'Mariwan',
  'میران': 'Miran',
  'تابان': 'Taban',

  // Common Islamic / Arabic Origin Names
  'محەمەد': 'Mohammed',
  'محمد': 'Mohammed',
  'ئەحمەد': 'Ahmed',
  'احمد': 'Ahmed',
  'عەلی': 'Ali',
  'علی': 'Ali',
  'حەسەن': 'Hassan',
  'حسن': 'Hassan',
  'حوسێن': 'Hussein',
  'حسین': 'Hussein',
  'عوسمان': 'Osman',
  'عثمان': 'Osman',
  'عومەر': 'Omar',
  'عمر': 'Omar',
  'ئیبراهیم': 'Ibrahim',
  'ابراهیم': 'Ibrahim',
  'إبراهيم': 'Ibrahim',
  'یوسف': 'Yousif',
  'يوسف': 'Yousif',
  'مستەفا': 'Mustafa',
  'مصطفى': 'Mustafa',
  'خالید': 'Khalid',
  'خالد': 'Khalid',
  'قادر': 'Qadir',
  'مەحموود': 'Mahmood',
  'محمود': 'Mahmood',
  'عەبدوڵڵا': 'Abdullah',
  'عەبدوڵا': 'Abdullah',
  'عبدالله': 'Abdullah',
  'عەبدولڕەحمان': 'Abdulrahman',
  'عبدالرحمن': 'Abdulrahman',
  'کەریم': 'Karim',
  'كريم': 'Karim',
  'ڕەشید': 'Rashid',
  'رشيد': 'Rashid',
  'تارق': 'Tariq',
  'طارق': 'Tariq',
  'جەمال': 'Jamal',
  'جمال': 'Jamal',
  'کەمال': 'Kamal',
  'كمال': 'Kamal',
  'جەلال': 'Jalal',
  'جلال': 'Jalal',
  'سەباح': 'Sabah',
  'صباح': 'Sabah',
  'سەلاح': 'Salah',
  'صلاح': 'Salah',
  'ئەیوب': 'Ayoub',
  'أيوب': 'Ayoub',
  'ئیدریس': 'Idris',
  'إدريس': 'Idris',
  'سەمیر': 'Samir',
  'سمير': 'Samir',
  'سامی': 'Sami',
  'یەحیا': 'Yahya',
  'يحيى': 'Yahya',
  'زەکەریا': 'Zakaria',
  'زكريا': 'Zakaria',
  'ئەنوەر': 'Anwar',
  'انور': 'Anwar',
  'مەهدی': 'Mahdi',
  'مهدي': 'Mahdi',
  'حەمید': 'Hamid',
  'حميد': 'Hamid',
  'مەجید': 'Majid',
  'مجيد': 'Majid',
  'فەوزی': 'Fawzi',
  'فوزي': 'Fawzi',
  'ئەمین': 'Amin',
  'امين': 'Amin',
  'ئەمیر': 'Amir',
  'امير': 'Amir',
  'حەکیم': 'Hakim',
  'حكيم': 'Hakim'
};

// 2. Kurdish to Arabic Names Dictionary
const NAME_DICTIONARY_AR = {
  'محەمەد': 'محمد',
  'ئەحمەد': 'أحمد',
  'عەلی': 'علي',
  'حەسەن': 'حسن',
  'حوسێن': 'حسين',
  'عوسمان': 'عثمان',
  'عومەر': 'عمر',
  'ئیبراهیم': 'إبراهيم',
  'یوسف': 'يوسف',
  'مستەفا': 'مصطفى',
  'خالید': 'خالد',
  'مەحموود': 'محمود',
  'عەبدوڵڵا': 'عبدالله',
  'عەبدوڵا': 'عبدالله',
  'عەبدولڕەحمان': 'عبدالرحمن',
  'کەریم': 'كريم',
  'ڕەشید': 'رشيد',
  'تارق': 'طارق',
  'جەمال': 'جمال',
  'کەمال': 'كمال',
  'جەلال': 'جلال',
  'سەباح': 'صباح',
  'سەلاح': 'صلاح',
  'ئەیوب': 'أيوب',
  'ئیدریس': 'إدريس',
  'سەمیر': 'سمير',
  'یەحیا': 'يحيى',
  'ئەنوەر': 'أنور',
  'مەهدی': 'مهدي',
  'حەمید': 'حميد',
  'مەجید': 'مجيد',
  'فەوزی': 'فوزي',
  'ئەمین': 'أمين',
  'ئەمیر': 'أمير',
  'حەکیم': 'حكيم',
  'تەها': 'طه'
};

// 3. Fallback Kurdish character-by-character phonetic transliteration to Latin
function transliterateKurdishWordToLatin(word) {
  if (!word) return '';
  const clean = word.trim();
  if (NAME_DICTIONARY_EN[clean]) return NAME_DICTIONARY_EN[clean];

  let result = '';
  let i = 0;
  const len = clean.length;

  while (i < len) {
    const ch = clean[i];
    const next = i + 1 < len ? clean[i + 1] : '';

    // Digraphs & compound letters
    if (ch === 'ئ' && next === 'ە') {
      result += (i === 0 ? 'A' : 'a');
      i += 2;
      continue;
    }
    if (ch === 'ئ' && next === 'ی') {
      result += (i === 0 ? 'I' : 'i');
      i += 2;
      continue;
    }
    if (ch === 'ئ' && next === 'ێ') {
      result += (i === 0 ? 'E' : 'e');
      i += 2;
      continue;
    }
    if (ch === 'ئ' && next === 'ۆ') {
      result += (i === 0 ? 'O' : 'o');
      i += 2;
      continue;
    }
    if (ch === 'و' && next === 'و') {
      result += 'u';
      i += 2;
      continue;
    }
    if (ch === 'ئ') {
      // Glottal stop or initial vowel marker
      i += 1;
      continue;
    }

    switch (ch) {
      case 'ا': result += 'a'; break;
      case 'ب': result += 'b'; break;
      case 'پ': result += 'p'; break;
      case 'ت':
      case 'ط': result += 't'; break;
      case 'ج': result += 'j'; break;
      case 'چ': result += 'ch'; break;
      case 'ح': result += 'h'; break;
      case 'خ': result += 'kh'; break;
      case 'د': result += 'd'; break;
      case 'ر':
      case 'ڕ': result += 'r'; break;
      case 'ز':
      case 'ذ':
      case 'ض':
      case 'ظ': result += 'z'; break;
      case 'ژ': result += 'zh'; break;
      case 'س':
      case 'ص':
      case 'ث': result += 's'; break;
      case 'ش': result += 'sh'; break;
      case 'ع': result += 'a'; break;
      case 'غ': result += 'gh'; break;
      case 'ف': result += 'f'; break;
      case 'ڤ': result += 'v'; break;
      case 'ق': result += 'q'; break;
      case 'ک':
      case 'ك': result += 'k'; break;
      case 'گ': result += 'g'; break;
      case 'ل':
      case 'ڵ': result += 'l'; break;
      case 'م': result += 'm'; break;
      case 'ن': result += 'n'; break;
      case 'و': result += (i === 0 ? 'W' : 'o'); break;
      case 'ۆ': result += 'o'; break;
      case 'ه':
      case 'ھ':
      case 'ە': result += (i === len - 1 ? 'a' : 'a'); break;
      case 'ی':
      case 'ي': result += (i === 0 ? 'Y' : 'i'); break;
      case 'ێ': result += 'e'; break;
      default:
        result += ch;
    }
    i++;
  }

  // Capitalize first letter
  if (result.length > 0) {
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
  }
  return result;
}

// 4. Translate Student Full Name
export function translateStudentName(name, lang = 'ku') {
  if (!name || typeof name !== 'string') return name;
  if (lang === 'ku') return name;

  const parts = name.trim().split(/\s+/);

  if (lang === 'en') {
    return parts.map(part => {
      if (NAME_DICTIONARY_EN[part]) return NAME_DICTIONARY_EN[part];
      return transliterateKurdishWordToLatin(part);
    }).join(' ');
  }

  if (lang === 'ar') {
    return parts.map(part => {
      if (NAME_DICTIONARY_AR[part]) return NAME_DICTIONARY_AR[part];
      // Normalize Kurdish special chars to Arabic
      return part
        .replace(/ڕ/g, 'ر')
        .replace(/ڵ/g, 'ل')
        .replace(/ڤ/g, 'ف')
        .replace(/ێ/g, 'ي')
        .replace(/ۆ/g, 'و')
        .replace(/پ/g, 'ب')
        .replace(/گ/g, 'ك')
        .replace(/چ/g, 'ج')
        .replace(/ە$/g, 'ة');
    }).join(' ');
  }

  return name;
}

// 5. School Vocabulary Dictionaries
const SCHOOL_VOCAB_EN = {
  'ئامادەیی': 'Preparatory School',
  'ئامادەییی': 'Preparatory School',
  'بنەڕەتی': 'Basic School',
  'بنەڕەتیی': 'Basic School',
  'ناوەندی': 'Intermediate School',
  'ناوەندیی': 'Intermediate School',
  'نموونەیی': 'Model School',
  'نموونەییی': 'Model School',
  'کۆلێژی': 'College',
  'کۆلێژ': 'College',
  'کۆلێجی': 'College',
  'کۆلێج': 'College',
  'کچان': '(Girls)',
  'کچانی': '(Girls)',
  'کوڕان': '(Boys)',
  'کوڕانی': '(Boys)',
  'تێکەڵاو': '(Co-ed)',
  'تێکەڵ': '(Co-ed)',
  'ناحکومی': 'Private',
  'ناحکومیی': 'Private',
  'ئەهلی': 'Private',
  'حکومی': 'Public',
  'حکومیی': 'Public',
  'نێودەوڵەتی': 'International',
  'نێودەوڵەتیی': 'International',
  'شەهید': 'Martyr',
  'شەهیدی': 'Martyr',
  'پەروەردەی': 'Directorate of Education',
  'پەروەردە': 'Education',

  // Cities & Districts
  'هەولێر': 'Erbil',
  'هەولێری': 'Erbil',
  'سلێمانی': 'Sulaimani',
  'سلێمانیی': 'Sulaimani',
  'دهۆک': 'Duhok',
  'دهۆکی': 'Duhok',
  'کەرکووک': 'Kirkuk',
  'کەرکوک': 'Kirkuk',
  'هەڵەبجە': 'Halabja',
  'هەڵەبجەی': 'Halabja',
  'گەرمیان': 'Garmian',
  'گەرمیانی': 'Garmian',
  'سۆران': 'Soran',
  'سۆرانی': 'Soran',
  'زاخۆ': 'Zakho',
  'زاخۆی': 'Zakho',
  'ڕانیە': 'Ranya',
  'ڕانیەی': 'Ranya',
  'کۆیە': 'Koya',
  'کۆیەی': 'Koya',
  'قەڵادزێ': 'Qaladze',
  'قەڵادزێی': 'Qaladze',
  'ئاکرێ': 'Akre',
  'ئاکرێی': 'Akre',
  'کوردستان': 'Kurdistan',
  'کوردستانی': 'Kurdistan',
  'ئازادی': 'Azadi',
  'ڕووناکی': 'Ronaki',
  'نیشتمان': 'Nishtiman',
  'فیداکار': 'Fedakar',
  'شادی': 'Shadi',
  'شێخ مەحموود': 'Sheikh Mahmood',
  'پیرەمێرد': 'Piramerd',
  'نالی': 'Nali',
  'مەحوی': 'Mahwi',
  'گۆران': 'Goran',
  'هەولێری نوێ': 'New Erbil',
  'سلێمانی نوێ': 'New Sulaimani'
};

const SCHOOL_VOCAB_AR = {
  'ئامادەیی': 'إعدادية',
  'ئامادەییی': 'إعدادية',
  'بنەڕەتی': 'الأساسية',
  'بنەڕەتیی': 'الأساسية',
  'ناوەندی': 'المتوسطة',
  'ناوەندیی': 'المتوسطة',
  'نموونەیی': 'النموذجية',
  'نموونەییی': 'النموذجية',
  'کۆلێژی': 'كلية',
  'کۆلێژ': 'كلية',
  'کۆلێجی': 'كلية',
  'کۆلێج': 'كلية',
  'کچان': 'للبنات',
  'کچانی': 'للبنات',
  'کوڕان': 'للبنين',
  'کوڕانی': 'للبنين',
  'تێکەڵاو': 'المختلطة',
  'تێکەڵ': 'المختلطة',
  'ناحکومی': 'الأهلية',
  'ناحکومیی': 'الأهلية',
  'ئەهلی': 'الأهلية',
  'حکومی': 'الحكومية',
  'حکومیی': 'الحكومية',
  'نێودەوڵەتی': 'الدولية',
  'نێودەوڵەتیی': 'الدولية',
  'شەهید': 'الشهيد',
  'شەهیدی': 'الشهيد',
  'پەروەردەی': 'تربية',
  'پەروەردە': 'التربية',

  // Cities
  'هەولێر': 'أربيل',
  'هەولێری': 'أربيل',
  'سلێمانی': 'السليمانية',
  'سلێمانیی': 'السليمانية',
  'دهۆک': 'دهوك',
  'دهۆکی': 'دهوك',
  'کەرکووک': 'كركوك',
  'کەرکوک': 'كركوك',
  'هەڵەبجە': 'حلبجة',
  'هەڵەبجەی': 'حلبجة',
  'گەرمیان': 'كرميان',
  'گەرمیانی': 'كرميان',
  'سۆران': 'سوران',
  'سۆرانی': 'سوران',
  'زاخۆ': 'زاخو',
  'زاخۆی': 'زاخو',
  'ڕانیە': 'رانية',
  'ڕانیەی': 'رانية',
  'کۆیە': 'كوية',
  'کۆیەی': 'كوية',
  'قەڵادزێ': 'قلعة دزة',
  'قەڵادزێی': 'قلعة دزة',
  'ئاکرێ': 'عقرة',
  'ئاکرێی': 'عقرة',
  'کوردستان': 'كوردستان',
  'کوردستانی': 'كوردستان',
  'ئازادی': 'الحرية',
  'ڕووناکی': 'روناكي',
  'نیشتمان': 'الوطن',
  'فیداکار': 'فداكار',
  'شادی': 'شادي'
};

// 6. Translate School Name
export function translateSchoolName(schoolName, lang = 'ku') {
  if (!schoolName || typeof schoolName !== 'string') return schoolName;
  if (lang === 'ku') return schoolName;

  const parts = schoolName.trim().split(/\s+/);

  if (lang === 'en') {
    const translatedParts = parts.map(part => {
      if (SCHOOL_VOCAB_EN[part]) return SCHOOL_VOCAB_EN[part];
      if (NAME_DICTIONARY_EN[part]) return NAME_DICTIONARY_EN[part];
      return transliterateKurdishWordToLatin(part);
    });
    return translatedParts.join(' ');
  }

  if (lang === 'ar') {
    const translatedParts = parts.map(part => {
      if (SCHOOL_VOCAB_AR[part]) return SCHOOL_VOCAB_AR[part];
      if (NAME_DICTIONARY_AR[part]) return NAME_DICTIONARY_AR[part];
      return part
        .replace(/ڕ/g, 'ر')
        .replace(/ڵ/g, 'ل')
        .replace(/ڤ/g, 'ف')
        .replace(/ێ/g, 'ي')
        .replace(/ۆ/g, 'و')
        .replace(/پ/g, 'ب')
        .replace(/گ/g, 'ك')
        .replace(/چ/g, 'ج');
    });
    return translatedParts.join(' ');
  }

  return schoolName;
}

// 7. Academic Subjects & Exam Names Dictionary
const SUBJECTS_EN = {
  'بیرکاری': 'Mathematics',
  'ماتماتیک': 'Mathematics',
  'فیزیا': 'Physics',
  'کیمیا': 'Chemistry',
  'زیندەزانی': 'Biology',
  'بایۆلۆجی': 'Biology',
  'ئینگلیزی': 'English',
  'کوردی': 'Kurdish',
  'عەرەبی': 'Arabic',
  'زانست': 'Science',
  'زانستەکان': 'General Sciences',
  'مێژوو': 'History',
  'جوگرافیا': 'Geography',
  'کۆمپیوتەر': 'Computer Science',
  'پەروەردەی ئیسلامی': 'Islamic Studies',
  'ئایین': 'Religious Studies',
  'وەرزش': 'Physical Education',
  'هونەر': 'Art',
  'گشتی': 'General',
  'هەموو': 'All'
};

const SUBJECTS_AR = {
  'بیرکاری': 'الرياضيات',
  'ماتماتیک': 'الرياضيات',
  'فیزیا': 'الفيزياء',
  'کیمیا': 'الكيمياء',
  'زیندەزانی': 'علم الأحياء',
  'بایۆلۆجی': 'علم الأحياء',
  'ئینگلیزی': 'اللغة الإنجليزية',
  'کوردی': 'اللغة الكردية',
  'عەرەبی': 'اللغة العربية',
  'زانست': 'العلوم',
  'زانستەکان': 'العلوم العامة',
  'مێژوو': 'التاريخ',
  'جوگرافیا': 'الجغرافيا',
  'کۆمپیوتەر': 'الحاسوب',
  'پەروەردەی ئیسلامی': 'التربية الإسلامية',
  'ئایین': 'التربية الدينية',
  'وەرزش': 'التربية الرياضية',
  'هونەر': 'التربية الفنية',
  'گشتی': 'عام',
  'هەموو': 'الكل'
};

export function translateSubject(subject, lang = 'ku') {
  if (!subject || typeof subject !== 'string') return subject;
  if (lang === 'ku') return subject;

  const clean = subject.trim();
  if (lang === 'en') return SUBJECTS_EN[clean] || clean;
  if (lang === 'ar') return SUBJECTS_AR[clean] || clean;
  return subject;
}

// 8. Exam Titles & Phrases
const EXAM_TERMS_EN = {
  'تاقیکردنەوەی خولی یەکەم': 'First Round Exam',
  'تاقیکردنەوەی خولی دووەم': 'Second Round Exam',
  'تاقیکردنەوەی گشتی': 'General Examination',
  'تاقیکردنەوەی نیشتمانی': 'National Examination',
  'ئۆڵۆمپیادی زانستی': 'Science Olympiad',
  'پێشبڕکێی زانستی': 'Science Competition',
  'تاقیکردنەوەی ئۆنلاین': 'Live Online Exam',
  'تاقیکردنەوەی ئەزموونی': 'Trial Exam',
  'خولی ئەزموونی': 'Mock Exam',
  'پۆلی ١٢': 'Grade 12',
  'پۆلی 12': 'Grade 12',
  'پۆلی ١١': 'Grade 11',
  'پۆلی 11': 'Grade 11',
  'پۆلی ١٠': 'Grade 10',
  'پۆلی 10': 'Grade 10',
  'پۆلی ٩': 'Grade 9',
  'پۆلی 9': 'Grade 9',
  'پۆلی ٨': 'Grade 8',
  'پۆلی 8': 'Grade 8',
  'پۆلی ٧': 'Grade 7',
  'پۆلی 7': 'Grade 7',
  'زانستی': 'Scientific',
  'وێژەیی': 'Literary'
};

const EXAM_TERMS_AR = {
  'تاقیکردنەوەی خولی یەکەم': 'امتحان الدور الأول',
  'تاقیکردنەوەی خولی دووەم': 'امتحان الدور الثاني',
  'تاقیکردنەوەی گشتی': 'الامتحان العام',
  'تاقیکردنەوەی نیشتمانی': 'الامتحان الوطني',
  'ئۆڵۆمپیادی زانستی': 'الأولمبياد العلمي',
  'پێشبڕکێی زانستی': 'المسابقة العلمية',
  'تاقیکردنەوەی ئۆنلاین': 'امتحان أونلاين مباشر',
  'تاقیکردنەوەی ئەزموونی': 'امتحان تجريبي',
  'خولی ئەزموونی': 'الدور التجريبي',
  'پۆلی ١٢': 'الصف 12',
  'پۆلی 12': 'الصف 12',
  'پۆلی ١١': 'الصف 11',
  'پۆلی 11': 'الصف 11',
  'پۆلی ١٠': 'الصف 10',
  'پۆلی 10': 'الصف 10',
  'پۆلی ٩': 'الصف 9',
  'پۆلی 9': 'الصف 9',
  'پۆلی ٨': 'الصف 8',
  'پۆلی 8': 'الصف 8',
  'پۆلی ٧': 'الصف 7',
  'پۆلی 7': 'الصف 7',
  'زانستی': 'العلمي',
  'وێژەیی': 'الأدبي'
};

export function translateExamName(examName, lang = 'ku') {
  if (!examName || typeof examName !== 'string') return examName;
  if (lang === 'ku') return examName;

  const clean = examName.trim();
  if (lang === 'en') {
    if (EXAM_TERMS_EN[clean]) return EXAM_TERMS_EN[clean];
    let translated = clean;
    for (const [k, v] of Object.entries(EXAM_TERMS_EN)) {
      translated = translated.split(k).join(v);
    }
    for (const [k, v] of Object.entries(SUBJECTS_EN)) {
      translated = translated.split(k).join(v);
    }
    return translated;
  }

  if (lang === 'ar') {
    if (EXAM_TERMS_AR[clean]) return EXAM_TERMS_AR[clean];
    let translated = clean;
    for (const [k, v] of Object.entries(EXAM_TERMS_AR)) {
      translated = translated.split(k).join(v);
    }
    for (const [k, v] of Object.entries(SUBJECTS_AR)) {
      translated = translated.split(k).join(v);
    }
    return translated;
  }

  return examName;
}

// 9. Promo & General Dynamic Text Translation
const DYNAMIC_PHRASES = {
  // Sponsors
  'سپۆنسەری فەرمی': { en: 'Official Sponsor', ar: 'الراعي الرسمي' },
  'پاڵپشتی فەرمیی پێشبڕکێی قوتابییانی کوردستان (KSC)': {
    en: 'Official Partner of Kurdistan Schools Competition (KSC)',
    ar: 'الداعم الرسمي لمسابقة طلاب كوردستان (KSC)'
  },
  'بەشداری لە بەهێزترین پێشبڕکێی زانستی و خوێندنی کوردستان • دیاری و بڕوانامەی شایستە بۆ قوتابخانە و قوتابییە یەکەمەکان': {
    en: 'Participate in Kurdistan premier academic competition • Prestigious awards & certificates for top students and schools',
    ar: 'المشاركة في أقوى مسابقة علمية وأكاديمية في كوردستان • جوائز وشهادات تقديرية للمدارس والطلاب الأوائل'
  },
  'پەیوەندی لە تێلیگرام': { en: 'Telegram Support', ar: 'تواصل عبر تيليجرام' },
  'پەیوەندی لە وەتسئاپ': { en: 'WhatsApp Support', ar: 'تواصل عبر واتساب' },

  // OMR & Rules
  'ڕێنمایی تاقیکردنەوە': { en: 'Exam Guidelines', ar: 'تعليمات الامتحان' },
  'سیستەمی سکان و پشکنینی ئەلیکترۆنیی فۆڕمی وەڵام': {
    en: 'OMR Automated Bubble Sheet Evaluation System',
    ar: 'نظام التصحيح والتفتيش الإلكتروني لأوراق OMR'
  },
  'تەنها یەک بازنە بە قەڵەمی جافی تۆخ پڕبکەرەوە • ئەنجامەکان بە شێوازی دەستبەجێ بە ژیری دەستکرد شیکاری دەکرێن': {
    en: 'Shade only one bubble completely using a dark pen • Results analyzed instantly via high-speed AI & OMR',
    ar: 'ظلل دائرة واحدة فقط بقلم جاف غامق • يتم تحليل النتائج فورياً بالذكاء الاصطناعي وOMR'
  },
  'خوێندنەوەی یاساکان': { en: 'Read Regulations', ar: 'قراءة اللوائح' },

  // Partnership
  'ڕێکلام و هاوبەشی': { en: 'Partnership & Sponsorship', ar: 'الإعلانات والشراكات' },
  'دەرگای سپۆنسەری و هاوبەشی کراوەیە بۆ کۆمپانیا و ناوەندەکان': {
    en: 'Sponsorship and collaboration open for companies & educational institutions',
    ar: 'باب الرعاية والشراكة مفتوح للشركات والمراكز التعليمية'
  },
  'بۆ ناساندنی براندەکەت بە دەیان هەزار قوتابی و مامۆستا لە سەرانسەری هەرێمی کوردستان، پەیوەندیمان پێوە بکەن': {
    en: 'Promote your brand to tens of thousands of students and educators across Kurdistan',
    ar: 'لتقديم علامتك التجارية لعشرات الآلاف من الطلاب والمعلمين في كوردستان، اتصل بنا'
  },

  // Badges & Actions
  'ئاگاداری': { en: 'Notice', ar: 'تنويه' },
  'نوێ': { en: 'NEW', ar: 'جديد' },
  'گرنگ': { en: 'IMPORTANT', ar: 'هام' },
  'فەرمی': { en: 'OFFICIAL', ar: 'رسمي' },
  'بەردەستە': { en: 'Available', ar: 'متاح' },
  'ڕاستەوخۆ': { en: 'LIVE', ar: 'مباشر' }
};

export function translateDynamic(text, lang = 'ku') {
  if (!text || typeof text !== 'string') return text;
  if (lang === 'ku') return text;

  const clean = text.trim();
  if (DYNAMIC_PHRASES[clean] && DYNAMIC_PHRASES[clean][lang]) {
    return DYNAMIC_PHRASES[clean][lang];
  }

  // Check partial phrase matching for announcements or promo texts
  if (lang === 'en' || lang === 'ar') {
    let result = text;
    for (const [key, mapping] of Object.entries(DYNAMIC_PHRASES)) {
      if (mapping[lang] && result.includes(key)) {
        result = result.split(key).join(mapping[lang]);
      }
    }
    return result;
  }

  return text;
}
