export type CountryRecord = {
  code: string;
  slug: string;
  country: string;
  nationality: string;
  flag: string;
  aliases: string[];
  nameAr: string;
  nationalityAr: string;
  community: boolean;
};

function country(
  code: string,
  slug: string,
  english: string,
  nationality: string,
  flag: string,
  nameAr: string,
  nationalityAr: string,
  aliases: string[],
  community = false,
): CountryRecord {
  return {
    code,
    slug,
    country: english,
    nationality,
    flag,
    aliases,
    nameAr,
    nationalityAr,
    community,
  };
}

/**
 * Market-news country catalog (global & regional coverage, ISO 3166-1 alpha-2).
 * Spans the full Middle East / North Africa, major African, European, Americas,
 * and Asia-Pacific markets so the briefing reads as global — not a single market.
 * `community` marks nationality briefings; every row is a filterable article country.
 */
export const COUNTRY_CATALOG: CountryRecord[] = [
  country("KW", "kuwaiti", "Kuwait", "Kuwaiti", "🇰🇼", "الكويت", "كويتي", ["kuwait"], true),
  country("IN", "indian", "India", "Indian", "🇮🇳", "الهند", "هندي", ["india"], true),
  country("EG", "egyptian", "Egypt", "Egyptian", "🇪🇬", "مصر", "مصري", ["egypt", "egyption", "egyptions", "cairo"], true),
  country("BD", "bangladeshi", "Bangladesh", "Bangladeshi", "🇧🇩", "بنغلاديش", "بنغلاديشي", ["bangladesh"], true),
  country("PH", "filipino", "Philippines", "Filipino", "🇵🇭", "الفلبين", "فلبيني", ["philippines", "filipina", "filipinos", "manila"], true),
  country("SY", "syrian", "Syria", "Syrian", "🇸🇾", "سوريا", "سوري", ["syria", "syrians", "damascus"], true),
  country("SA", "saudi", "Saudi Arabia", "Saudi", "🇸🇦", "السعودية", "سعودي", ["saudi arabia", "riyadh", "sama"], true),
  country("LK", "sri-lankan", "Sri Lanka", "Sri Lankan", "🇱🇰", "سريلانكا", "سريلانكي", ["sri lanka", "sirilank", "colombo"], true),
  country("PK", "pakistani", "Pakistan", "Pakistani", "🇵🇰", "باكستان", "باكستاني", ["pakistan", "islamabad", "karachi"], true),
  country("NP", "nepali", "Nepal", "Nepali", "🇳🇵", "نيبال", "نيبالي", ["nepal", "nepalese", "kathmandu"], true),
  country("JO", "jordanian", "Jordan", "Jordanian", "🇯🇴", "الأردن", "أردني", ["jordan", "amman"], true),
  country("IR", "iranian", "Iran", "Iranian", "🇮🇷", "إيران", "إيراني", ["iran", "tehran"], true),
  country("IQ", "iraqi", "Iraq", "Iraqi", "🇮🇶", "العراق", "عراقي", ["iraq", "baghdad"], true),
  country("YE", "yemeni", "Yemen", "Yemeni", "🇾🇪", "اليمن", "يمني", ["yemen", "sanaa"], true),
  country("ET", "ethiopian", "Ethiopia", "Ethiopian", "🇪🇹", "إثيوبيا", "إثيوبي", ["ethiopia", "addis ababa"], true),
  country("PS", "palestinian", "Palestine", "Palestinian", "🇵🇸", "فلسطين", "فلسطيني", ["palestine", "palastine", "palastinian", "palastinians", "gaza", "west bank"], true),
  country("SD", "sudanese", "Sudan", "Sudanese", "🇸🇩", "السودان", "سوداني", ["sudan", "khartoum"], true),
  country("LB", "lebanese", "Lebanon", "Lebanese", "🇱🇧", "لبنان", "لبناني", ["lebanon", "beirut"], true),
  country("TR", "turkish", "Türkiye", "Turkish", "🇹🇷", "تركيا", "تركي", ["turkey", "turkiye", "türkiye", "ankara", "istanbul"], true),
  country("US", "american", "United States", "American", "🇺🇸", "الولايات المتحدة", "أمريكي", ["united states", "usa", "u.s.", "washington", "wall street"], true),
  country("CN", "chinese", "China", "Chinese", "🇨🇳", "الصين", "صيني", ["china", "beijing", "pboc", "shanghai"], true),
  country("GB", "british", "United Kingdom", "British", "🇬🇧", "المملكة المتحدة", "بريطاني", ["united kingdom", "uk", "u.k.", "britain", "london", "bank of england"], true),
  country("NG", "nigerian", "Nigeria", "Nigerian", "🇳🇬", "نيجيريا", "نيجيري", ["nigeria", "lagos", "abuja"], true),
  country("KE", "kenyan", "Kenya", "Kenyan", "🇰🇪", "كينيا", "كيني", ["kenya", "nairobi"], true),
  country("AF", "afghan", "Afghanistan", "Afghan", "🇦🇫", "أفغانستان", "أفغاني", ["afghanistan", "afghani", "kabul"], true),
  country("MA", "moroccan", "Morocco", "Moroccan", "🇲🇦", "المغرب", "مغربي", ["morocco", "rabat", "casablanca"], true),
  country("TN", "tunisian", "Tunisia", "Tunisian", "🇹🇳", "تونس", "تونسي", ["tunisia"], true),
  country("DZ", "algerian", "Algeria", "Algerian", "🇩🇿", "الجزائر", "جزائري", ["algeria", "algiers"], true),
  country("MR", "mauritanian", "Mauritania", "Mauritanian", "🇲🇷", "موريتانيا", "موريتاني", ["mauritania", "nouakchott"]),
  country("DJ", "djiboutian", "Djibouti", "Djiboutian", "🇩🇯", "جيبوتي", "جيبوتي", ["djibouti city"]),
  country("SO", "somali", "Somalia", "Somali", "🇸🇴", "الصومال", "صومالي", ["somalia", "mogadishu"]),
  country("KM", "comorian", "Comoros", "Comorian", "🇰🇲", "جزر القمر", "قمري", ["comoros", "moroni"]),
  country("PY", "paraguayan", "Paraguay", "Paraguayan", "🇵🇾", "باراغواي", "باراغواياني", ["paraguay", "asuncion"], true),
  country("ID", "indonesian", "Indonesia", "Indonesian", "🇮🇩", "إندونيسيا", "إندونيسي", ["indonesia", "indonisia", "jakarta"], true),
  country("AE", "emirati", "United Arab Emirates", "Emirati", "🇦🇪", "الإمارات", "إماراتي", ["uae", "emirates", "dubai", "abu dhabi"], true),
  country("QA", "qatari", "Qatar", "Qatari", "🇶🇦", "قطر", "قطري", ["doha", "qcb"], true),
  country("BH", "bahraini", "Bahrain", "Bahraini", "🇧🇭", "البحرين", "بحريني", ["manama"], true),
  country("OM", "omani", "Oman", "Omani", "🇴🇲", "عمان", "عماني", ["muscat"], true),
  country("LY", "libyan", "Libya", "Libyan", "🇱🇾", "ليبيا", "ليبي", ["tripoli", "benghazi"]),
  country("IL", "israeli", "Israel", "Israeli", "🇮🇱", "إسرائيل", "إسرائيلي", ["tel aviv", "jerusalem", "bank of israel"]),
  country("CA", "canadian", "Canada", "Canadian", "🇨🇦", "كندا", "كندي", ["ottawa", "toronto", "bank of canada"]),
  country("MX", "mexican", "Mexico", "Mexican", "🇲🇽", "المكسيك", "مكسيكي", ["mexico city", "banxico"]),
  country("BR", "brazilian", "Brazil", "Brazilian", "🇧🇷", "البرازيل", "برازيلي", ["brasil", "brasilia", "sao paulo", "brazil's"]),
  country("AR", "argentine", "Argentina", "Argentine", "🇦🇷", "الأرجنتين", "أرجنتيني", ["argentina", "buenos aires"]),
  country("CL", "chilean", "Chile", "Chilean", "🇨🇱", "تشيلي", "تشيلي", ["santiago"]),
  country("DE", "german", "Germany", "German", "🇩🇪", "ألمانيا", "ألماني", ["berlin", "frankfurt", "bundesbank"]),
  country("FR", "french", "France", "French", "🇫🇷", "فرنسا", "فرنسي", ["paris", "banque de france"]),
  country("IT", "italian", "Italy", "Italian", "🇮🇹", "إيطاليا", "إيطالي", ["rome", "milan", "bank of italy"]),
  country("ES", "spanish", "Spain", "Spanish", "🇪🇸", "إسبانيا", "إسباني", ["madrid", "barcelona"]),
  country("NL", "dutch", "Netherlands", "Dutch", "🇳🇱", "هولندا", "هولندي", ["amsterdam", "netherlands", "holland"]),
  country("CH", "swiss", "Switzerland", "Swiss", "🇨🇭", "سويسرا", "سويسري", ["zurich", "geneva", "snb"]),
  country("BE", "belgian", "Belgium", "Belgian", "🇧🇪", "بلجيكا", "بلجيكي", ["brussels"]),
  country("AT", "austrian", "Austria", "Austrian", "🇦🇹", "النمسا", "نمساوي", ["vienna"]),
  country("SE", "swedish", "Sweden", "Swedish", "🇸🇪", "السويد", "سويدي", ["stockholm", "riksbank"]),
  country("NO", "norwegian", "Norway", "Norwegian", "🇳🇴", "النرويج", "نرويجي", ["oslo", "norges bank"]),
  country("DK", "danish", "Denmark", "Danish", "🇩🇰", "الدنمارك", "دنماركي", ["copenhagen"]),
  country("PL", "polish", "Poland", "Polish", "🇵🇱", "بولندا", "بولندي", ["warsaw"]),
  country("UA", "ukrainian", "Ukraine", "Ukrainian", "🇺🇦", "أوكرانيا", "أوكراني", ["kyiv", "kiev"]),
  country("RU", "russian", "Russia", "Russian", "🇷🇺", "روسيا", "روسي", ["moscow", "cbr"]),
  country("JP", "japanese", "Japan", "Japanese", "🇯🇵", "اليابان", "ياباني", ["tokyo", "boj", "bank of japan"]),
  country("KR", "south-korean", "South Korea", "South Korean", "🇰🇷", "كوريا الجنوبية", "كوري", ["korea", "seoul", "bok"]),
  country("HK", "hong-kong", "Hong Kong", "Hong Kong", "🇭🇰", "هونغ كونغ", "هونغ كونغي", ["hongkong", "hkma"]),
  country("TW", "taiwanese", "Taiwan", "Taiwanese", "🇹🇼", "تايوان", "تايواني", ["taipei"]),
  country("MY", "malaysian", "Malaysia", "Malaysian", "🇲🇾", "ماليزيا", "ماليزي", ["kuala lumpur", "bnm"]),
  country("SG", "singaporean", "Singapore", "Singaporean", "🇸🇬", "سنغافورة", "سنغافوري", []),
  country("TH", "thai", "Thailand", "Thai", "🇹🇭", "تايلاند", "تايلاندي", ["bangkok"]),
  country("VN", "vietnamese", "Vietnam", "Vietnamese", "🇻🇳", "فيتنام", "فيتنامي", ["hanoi", "ho chi minh"]),
  country("AU", "australian", "Australia", "Australian", "🇦🇺", "أستراليا", "أسترالي", ["sydney", "rba", "canberra"]),
  country("NZ", "new-zealander", "New Zealand", "New Zealander", "🇳🇿", "نيوزيلندا", "نيوزيلندي", ["wellington", "rbnz", "auckland"]),
  country("ZA", "south-african", "South Africa", "South African", "🇿🇦", "جنوب أفريقيا", "جنوب أفريقي", ["johannesburg", "pretoria", "sarb"]),
  country("GH", "ghanaian", "Ghana", "Ghanaian", "🇬🇭", "غانا", "غاني", ["accra"]),
  country("AO", "angolan", "Angola", "Angolan", "🇦🇴", "أنغولا", "أنغولي", ["luanda", "kwanza"]),
  country("CI", "ivorian", "Côte d'Ivoire", "Ivorian", "🇨🇮", "ساحل العاج", "إيفواري", ["cote d'ivoire", "ivory coast", "abidjan", "brvm"]),
  country("TZ", "tanzanian", "Tanzania", "Tanzanian", "🇹🇿", "تنزانيا", "تنزاني", ["dar es salaam", "dodoma"]),
  country("UG", "ugandan", "Uganda", "Ugandan", "🇺🇬", "أوغندا", "أوغندي", ["kampala"]),
  country("PT", "portuguese", "Portugal", "Portuguese", "🇵🇹", "البرتغال", "برتغالي", ["lisbon"]),
  country("IE", "irish", "Ireland", "Irish", "🇮🇪", "أيرلندا", "أيرلندي", ["dublin"]),
  country("KZ", "kazakh", "Kazakhstan", "Kazakh", "🇰🇿", "كازاخستان", "كازاخستاني", ["astana", "almaty"]),
];

const byCode = new Map(COUNTRY_CATALOG.map((item) => [item.code, item]));

export function countryRecord(code: string) {
  return byCode.get(code.trim().toUpperCase());
}

export function catalogCountryCodes() {
  return COUNTRY_CATALOG.map((item) => item.code);
}
