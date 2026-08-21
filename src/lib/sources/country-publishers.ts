import { Category } from "@prisma/client";
import { type CountrySourceSeed, rowsToSources } from "./types";

/**
 * National newspapers, agencies, and business dailies keyed by ISO.
 * Existing verified rows in country-sources.ts are not repeated.
 */
const COUNTRY_ROWS = [
  // Kuwait
  ["KUWAIT_TIMES_KW", "Kuwait Times", "https://www.kuwaittimes.com/feed/", "https://www.kuwaittimes.com/", "KW", Category.ME_ECONOMY, 80],
  ["KUWAIT_LOCAL_KW", "Kuwait Local", "https://www.kuwaitlocal.com/feed", "https://www.kuwaitlocal.com/", "KW", Category.ME_ECONOMY, 72],

  // Saudi Arabia
  ["AAWSAT_SA", "Asharq Al-Awsat English", "https://english.aawsat.com/rss.xml", "https://english.aawsat.com/", "SA", Category.ME_ECONOMY, 84],
  ["SAUDI_GAZETTE_SA_HOME", "Saudi Gazette Home", "https://saudigazette.com.sa/rss", "https://saudigazette.com.sa/", "SA", Category.ME_ECONOMY, 80],

  // UAE
  ["THE_NATIONAL_AE", "The National Business", "https://www.thenationalnews.com/business/rss.xml", "https://www.thenationalnews.com/business/", "AE", Category.ME_ECONOMY, 86],
  ["THE_NATIONAL_AE_ECON", "The National Economy", "https://www.thenationalnews.com/business/economy/rss.xml", "https://www.thenationalnews.com/business/economy/", "AE", Category.ME_ECONOMY, 86],
  ["KHALEEJ_TIMES_AE", "Khaleej Times", "https://www.khaleejtimes.com/rss.xml", "https://www.khaleejtimes.com/", "AE", Category.ME_ECONOMY, 82],
  ["ARABIAN_BUSINESS_AE", "Arabian Business", "https://www.arabianbusiness.com/feed", "https://www.arabianbusiness.com/", "AE", Category.FINANCE, 82],
  ["GULF_TODAY_AE", "Gulf Today", "https://www.gulftoday.ae/rss", "https://www.gulftoday.ae/", "AE", Category.ME_ECONOMY, 76],

  // Qatar
  ["PENINSULA_QA", "The Peninsula Qatar", "https://thepeninsulaqatar.com/rss", "https://thepeninsulaqatar.com/", "QA", Category.ME_ECONOMY, 80],
  ["GULF_TIMES_QA", "Gulf Times", "https://www.gulf-times.com/rss/rss", "https://www.gulf-times.com/", "QA", Category.ME_ECONOMY, 80],
  ["QATAR_TRIBUNE_QA", "Qatar Tribune", "https://www.qatar-tribune.com/feed", "https://www.qatar-tribune.com/", "QA", Category.ME_ECONOMY, 76],

  // Bahrain
  ["GDN_BH", "Gulf Daily News", "https://www.gdnonline.com/feed", "https://www.gdnonline.com/", "BH", Category.ME_ECONOMY, 78],
  ["BAHRAIN_THIS_WEEK_BH", "Bahrain This Week", "https://www.bahrainthisweek.com/feed/", "https://www.bahrainthisweek.com/", "BH", Category.ME_ECONOMY, 72],
  ["DAILY_TRIBUNE_BH", "The Daily Tribune Bahrain", "https://www.dt.bh/feed/", "https://www.dt.bh/", "BH", Category.ME_ECONOMY, 74],

  // Oman
  ["OMAN_OBSERVER_OM", "Oman Observer", "https://www.omanobserver.om/feed/", "https://www.omanobserver.om/", "OM", Category.ME_ECONOMY, 80],
  ["MUSCAT_DAILY_OM", "Muscat Daily", "https://www.muscatdaily.com/feed/", "https://www.muscatdaily.com/", "OM", Category.ME_ECONOMY, 76],
  ["OMAN_DAILY_OM", "Oman Daily Observer Business", "https://www.omanobserver.om/category/business/feed/", "https://www.omanobserver.om/category/business/", "OM", Category.ME_ECONOMY, 80],

  // Egypt
  ["AHRAM_EG", "Ahram Online", "https://english.ahram.org.eg/Rss.aspx", "https://english.ahram.org.eg/", "EG", Category.ME_ECONOMY, 82],
  ["EGYPT_TODAY_EG", "Egypt Today", "https://www.egypttoday.com/Rss/Index", "https://www.egypttoday.com/", "EG", Category.ME_ECONOMY, 78],
  ["EGYPT_INDEPENDENT_EG", "Egypt Independent", "https://www.egyptindependent.com/feed/", "https://www.egyptindependent.com/", "EG", Category.ME_ECONOMY, 78],
  ["MADA_MASR_EG", "Mada Masr", "https://www.madamasr.com/en/feed/", "https://www.madamasr.com/en/", "EG", Category.MARKETS, 76],
  ["AHRAM_BIZ_EG", "Ahram Online Business", "https://english.ahram.org.eg/PortalRss/3.aspx", "https://english.ahram.org.eg/Portal/3/Business.aspx", "EG", Category.ME_ECONOMY, 82],

  // Jordan
  ["JORDAN_TIMES_JO", "Jordan Times", "https://jordantimes.com/rss.xml", "https://jordantimes.com/", "JO", Category.ME_ECONOMY, 80],
  ["JORDAN_NEWS_JO", "Jordan News", "https://www.jordannews.jo/feed", "https://www.jordannews.jo/", "JO", Category.ME_ECONOMY, 74],
  ["PETRA_JO", "Petra News Agency", "https://petranews.gov.jo/rss", "https://petranews.gov.jo/", "JO", Category.ME_ECONOMY, 82],

  // Iraq
  ["IRAQINEWS_IQ", "Iraqi News", "https://www.iraqinews.com/feed/", "https://www.iraqinews.com/", "IQ", Category.ME_ECONOMY, 74],
  ["KURDISTAN24_IQ", "Kurdistan 24 English", "https://www.kurdistan24.net/en/rss", "https://www.kurdistan24.net/en", "IQ", Category.MARKETS, 74],
  ["NINA_IQ", "NINA News", "https://ninanews.com/Feed", "https://ninanews.com/", "IQ", Category.MARKETS, 72],

  // Iran
  ["IRNA_IR", "IRNA English", "https://en.irna.ir/rss", "https://en.irna.ir/", "IR", Category.ECONOMICS, 80],
  ["MEHR_IR", "Mehr News English", "https://en.mehrnews.com/rss", "https://en.mehrnews.com/", "IR", Category.MARKETS, 76],
  ["FINANCIAL_TRIBUNE_IR", "Financial Tribune", "https://financialtribune.com/rss.xml", "https://financialtribune.com/", "IR", Category.FINANCE, 80],
  ["PRESS_TV_IR", "PressTV", "https://www.presstv.ir/rss", "https://www.presstv.ir/", "IR", Category.MARKETS, 72],

  // Lebanon
  ["LORIENT_LB", "L Orient Today", "https://today.lorientlejour.com/rss", "https://today.lorientlejour.com/", "LB", Category.ME_ECONOMY, 82],
  ["NAHARNET_LB", "Naharnet", "https://www.naharnet.com/rss", "https://www.naharnet.com/", "LB", Category.MARKETS, 74],
  ["BEIRUT_TODAY_LB", "Beirut Today", "https://beirut-today.com/feed/", "https://beirut-today.com/", "LB", Category.ME_ECONOMY, 72],

  // Syria
  ["ENAB_BALADI_SY", "Enab Baladi English", "https://english.enabbaladi.net/feed/", "https://english.enabbaladi.net/", "SY", Category.MARKETS, 74],
  ["SYRIA_DIRECT_SY", "Syria Direct", "https://syriadirect.org/feed/", "https://syriadirect.org/", "SY", Category.MARKETS, 74],

  // Yemen
  ["SABA_YE", "Saba News English", "https://www.sabanew.net/rss", "https://www.sabanew.net/", "YE", Category.MARKETS, 70],
  ["DEBRIEFER_YE", "Debriefer", "https://debriefer.net/feed", "https://debriefer.net/", "YE", Category.MARKETS, 70],

  // Palestine
  ["WAFA_PS", "WAFA English", "https://english.wafa.ps/rss.aspx", "https://english.wafa.ps/", "PS", Category.MARKETS, 76],
  ["PALESTINE_CHRONICLE_PS", "Palestine Chronicle", "https://www.palestinechronicle.com/feed/", "https://www.palestinechronicle.com/", "PS", Category.MARKETS, 72],

  // Sudan
  ["SUDAN_TRIBUNE_SD", "Sudan Tribune", "https://sudantribune.com/feed/", "https://sudantribune.com/", "SD", Category.MARKETS, 74],
  ["RADIO_TAMAZUJ_SD", "Radio Tamazuj", "https://www.radiotamazuj.org/en/rss", "https://www.radiotamazuj.org/en", "SD", Category.MARKETS, 72],

  // Libya
  ["LIBYA_OBSERVER_LY", "Libya Observer", "https://libyaobserver.ly/rss.xml", "https://libyaobserver.ly/", "LY", Category.ME_ECONOMY, 74],
  ["LIBYA_UPDATE_LY", "Libya Update", "https://libyaupdate.com/feed/", "https://libyaupdate.com/", "LY", Category.ME_ECONOMY, 72],

  // Turkiye
  ["DAILY_SABAH_TR", "Daily Sabah Finance", "https://www.dailysabah.com/rss/finance", "https://www.dailysabah.com/business/finance", "TR", Category.FINANCE, 82],
  ["DAILY_SABAH_ECON_TR", "Daily Sabah Economy", "https://www.dailysabah.com/rss/economy", "https://www.dailysabah.com/business/economy", "TR", Category.ECONOMICS, 82],
  ["TRT_WORLD_TR", "TRT World", "https://www.trtworld.com/rss", "https://www.trtworld.com/", "TR", Category.MARKETS, 80],
  ["BIANET_TR", "Bianet English", "https://bianet.org/rss", "https://bianet.org/english", "TR", Category.MARKETS, 72],

  // Israel
  ["TIMES_ISRAEL_IL", "Times of Israel", "https://www.timesofisrael.com/feed/", "https://www.timesofisrael.com/", "IL", Category.MARKETS, 82],
  ["JPOST_IL", "Jerusalem Post", "https://www.jpost.com/rss/rssfeedsheadlines.aspx", "https://www.jpost.com/", "IL", Category.MARKETS, 80],
  ["GLOBES_IL", "Globes English", "https://en.globes.co.il/rss", "https://en.globes.co.il/", "IL", Category.FINANCE, 84],
  ["HAARETZ_IL", "Haaretz", "https://www.haaretz.com/srv/rss", "https://www.haaretz.com/", "IL", Category.MARKETS, 82],

  // Morocco
  ["MWN_MA", "Morocco World News", "https://www.moroccoworldnews.com/feed", "https://www.moroccoworldnews.com/", "MA", Category.ME_ECONOMY, 78],
  ["NORTH_AFRICA_POST_MA", "North Africa Post", "https://northafricapost.com/feed", "https://northafricapost.com/", "MA", Category.ME_ECONOMY, 72],
  ["TELQUEL_MA", "TelQuel", "https://telquel.ma/feed/", "https://telquel.ma/", "MA", Category.ME_ECONOMY, 74],

  // Tunisia
  ["KAPITALIS_TN", "Kapitalis", "https://kapitalis.com/tunisie/feed/", "https://kapitalis.com/tunisie/", "TN", Category.ME_ECONOMY, 74],
  ["WEBMANAGER_TN", "Webmanagercenter", "https://www.webmanagercenter.com/feed/", "https://www.webmanagercenter.com/", "TN", Category.ME_ECONOMY, 76],

  // Algeria
  ["APS_DZ", "Algeria Press Service", "https://www.aps.dz/en/rss", "https://www.aps.dz/en", "DZ", Category.ME_ECONOMY, 80],
  ["ELWATAN_DZ", "El Watan", "https://elwatan.com/feed/", "https://elwatan.com/", "DZ", Category.ME_ECONOMY, 74],

  // Ethiopia
  ["CAPITAL_ET", "Capital Ethiopia", "https://www.capitalethiopia.com/feed/", "https://www.capitalethiopia.com/", "ET", Category.ECONOMICS, 76],
  ["ADDIS_STANDARD_ET", "Addis Standard", "https://addisstandard.com/feed/", "https://addisstandard.com/", "ET", Category.MARKETS, 74],
  ["THEREPORTER_ET", "The Reporter Ethiopia", "https://www.thereporterethiopia.com/feed/", "https://www.thereporterethiopia.com/", "ET", Category.ECONOMICS, 74],

  // Nigeria
  ["VANGUARD_NG", "Vanguard Nigeria", "https://www.vanguardngr.com/feed/", "https://www.vanguardngr.com/", "NG", Category.MARKETS, 78],
  ["PREMIUM_TIMES_NG", "Premium Times", "https://www.premiumtimesng.com/feed/", "https://www.premiumtimesng.com/", "NG", Category.MARKETS, 80],
  ["BUSINESSDAY_NG", "BusinessDay Nigeria", "https://businessday.ng/feed/", "https://businessday.ng/", "NG", Category.FINANCE, 84],
  ["THECABLE_NG", "TheCable", "https://www.thecable.ng/feed/", "https://www.thecable.ng/", "NG", Category.MARKETS, 76],
  ["THISDAY_NG", "ThisDay", "https://www.thisdaylive.com/feed/", "https://www.thisdaylive.com/", "NG", Category.MARKETS, 78],

  // Kenya
  ["BDA_KE", "Business Daily Africa", "https://www.businessdailyafrica.com/rss", "https://www.businessdailyafrica.com/", "KE", Category.FINANCE, 84],
  ["NATION_KE", "Nation Africa Business", "https://nation.africa/kenya/business/rss.xml", "https://nation.africa/kenya/business", "KE", Category.FINANCE, 82],
  ["STAR_KE", "The Star Kenya", "https://www.the-star.co.ke/rss.xml", "https://www.the-star.co.ke/", "KE", Category.MARKETS, 76],
  ["STANDARD_KE", "The Standard Kenya", "https://www.standardmedia.co.ke/rss/business.php", "https://www.standardmedia.co.ke/business", "KE", Category.FINANCE, 78],

  // Ghana
  ["CITI_GH", "Citi Newsroom", "https://citinewsroom.com/feed/", "https://citinewsroom.com/", "GH", Category.MARKETS, 76],
  ["BFT_GH", "Business and Financial Times", "https://thebftonline.com/feed/", "https://thebftonline.com/", "GH", Category.FINANCE, 80],
  ["GRAPHIC_GH", "Graphic Online", "https://www.graphic.com.gh/rss/news.xml", "https://www.graphic.com.gh/", "GH", Category.MARKETS, 76],
  ["GHANAWEB_GH", "GhanaWeb Business", "https://www.ghanaweb.com/GhanaHomePage/business/rss.xml", "https://www.ghanaweb.com/GhanaHomePage/business", "GH", Category.FINANCE, 74],

  // South Africa
  ["NEWS24_ZA", "News24", "https://feeds.news24.com/articles/fin24/rss", "https://www.news24.com/fin24", "ZA", Category.FINANCE, 84],
  ["BUSINESSLIVE_ZA", "BusinessLive", "https://www.businesslive.co.za/rss/?publication=bd", "https://www.businesslive.co.za/", "ZA", Category.FINANCE, 84],
  ["DAILY_MAVERICK_ZA", "Daily Maverick", "https://www.dailymaverick.co.za/dmrss/", "https://www.dailymaverick.co.za/", "ZA", Category.MARKETS, 82],
  ["MG_ZA", "Mail and Guardian", "https://mg.co.za/feed/", "https://mg.co.za/", "ZA", Category.MARKETS, 80],
  ["IOL_ZA", "IOL Business", "https://www.iol.co.za/cmlink/1.738", "https://www.iol.co.za/business-report", "ZA", Category.FINANCE, 76],

  // India
  ["INDIAN_EXPRESS_IN", "Indian Express Business", "https://indianexpress.com/section/business/feed/", "https://indianexpress.com/section/business/", "IN", Category.FINANCE, 84],
  ["MONEYCONTROL_IN", "Moneycontrol", "https://www.moneycontrol.com/rss/business.xml", "https://www.moneycontrol.com/", "IN", Category.FINANCE, 86],
  ["HINDU_BL_IN", "The Hindu Business Line", "https://www.thehindubusinessline.com/feeder/default.rss", "https://www.thehindubusinessline.com/", "IN", Category.FINANCE, 84],
  ["FINANCIAL_EXPRESS_IN", "Financial Express", "https://www.financialexpress.com/feed/", "https://www.financialexpress.com/", "IN", Category.FINANCE, 84],
  ["NDTV_PROFIT_IN", "NDTV Profit", "https://feeds.feedburner.com/ndtvprofit-latest", "https://www.ndtvprofit.com/", "IN", Category.FINANCE, 82],
  ["PIB_IN", "Press Information Bureau", "https://pib.gov.in/RssMainH.aspx?Lang=1&Reg=0", "https://pib.gov.in/", "IN", Category.ECONOMICS, 88],

  // Pakistan
  ["TRIBUNE_PK", "Express Tribune Business", "https://tribune.com.pk/feed/business", "https://tribune.com.pk/business", "PK", Category.FINANCE, 82],
  ["PROFIT_PK", "Profit Pakistan", "https://profit.pakistantoday.com.pk/feed/", "https://profit.pakistantoday.com.pk/", "PK", Category.FINANCE, 80],
  ["ARAB_NEWS_PK", "Arab News Pakistan", "https://www.arabnews.pk/rss.xml", "https://www.arabnews.pk/", "PK", Category.ME_ECONOMY, 80],
  ["THE_NEWS_PK", "The News International", "https://www.thenews.com.pk/rss/1/1", "https://www.thenews.com.pk/", "PK", Category.MARKETS, 78],

  // Bangladesh
  ["DHAKA_TRIBUNE_BD", "Dhaka Tribune", "https://www.dhakatribune.com/feed", "https://www.dhakatribune.com/", "BD", Category.MARKETS, 80],
  ["NEW_AGE_BD", "New Age Bangladesh", "https://www.newagebd.net/rss.xml", "https://www.newagebd.net/", "BD", Category.MARKETS, 76],
  ["FE_BD", "The Financial Express Bangladesh", "https://today.thefinancialexpress.com.bd/rss.xml", "https://thefinancialexpress.com.bd/", "BD", Category.FINANCE, 82],
  ["BSS_BD", "Bangladesh Sangbad Sangstha", "https://www.bssnews.net/rss/business", "https://www.bssnews.net/", "BD", Category.ECONOMICS, 78],

  // Philippines
  ["RAPPLER_PH", "Rappler", "https://www.rappler.com/rss", "https://www.rappler.com/", "PH", Category.MARKETS, 80],
  ["PHILSTAR_PH", "Philstar Business", "https://www.philstar.com/rss/business", "https://www.philstar.com/business", "PH", Category.FINANCE, 82],
  ["BUSINESSMIRROR_PH", "BusinessMirror", "https://businessmirror.com.ph/feed/", "https://businessmirror.com.ph/", "PH", Category.FINANCE, 80],
  ["PNA_PH", "Philippine News Agency", "https://www.pna.gov.ph/latest/rss.xml", "https://www.pna.gov.ph/", "PH", Category.MARKETS, 82],
  ["INQUIRER_BIZ_PH", "Inquirer Business", "https://business.inquirer.net/feed", "https://business.inquirer.net/", "PH", Category.FINANCE, 80],

  // Sri Lanka
  ["ECONOMYNEXT_LK", "EconomyNext", "https://economynext.com/feed/", "https://economynext.com/", "LK", Category.FINANCE, 84],
  ["DAILY_NEWS_LK", "Daily News Sri Lanka", "https://www.dailynews.lk/feed/", "https://www.dailynews.lk/", "LK", Category.MARKETS, 76],
  ["SUNDAY_TIMES_LK", "Sunday Times Sri Lanka", "https://www.sundaytimes.lk/feed/", "https://www.sundaytimes.lk/", "LK", Category.MARKETS, 76],
  ["ADADERANA_LK", "Ada Derana Business", "https://www.adaderana.lk/rss.php", "https://www.adaderana.lk/", "LK", Category.MARKETS, 74],

  // Nepal
  ["REPUBLICA_NP", "myRepublica", "https://myrepublica.nagariknetwork.com/rss", "https://myrepublica.nagariknetwork.com/", "NP", Category.MARKETS, 76],
  ["HIMALAYAN_NP", "The Himalayan Times", "https://thehimalayantimes.com/rss.xml", "https://thehimalayantimes.com/", "NP", Category.MARKETS, 76],
  ["KATHMANDU_POST_NP_HOME", "Kathmandu Post", "https://kathmandupost.com/rss", "https://kathmandupost.com/", "NP", Category.MARKETS, 80],
  ["ONLINEKHABAR_NP", "OnlineKhabar English", "https://english.onlinekhabar.com/feed", "https://english.onlinekhabar.com/", "NP", Category.MARKETS, 74],

  // Indonesia
  ["JAKARTA_POST_ID", "The Jakarta Post", "https://www.thejakartapost.com/rss", "https://www.thejakartapost.com/", "ID", Category.FINANCE, 84],
  ["ANTARA_ID", "Antara English Business", "https://en.antaranews.com/rss/business", "https://en.antaranews.com/business", "ID", Category.ECONOMICS, 82],
  ["TEMPO_ID", "Tempo English", "https://en.tempo.co/rss", "https://en.tempo.co/", "ID", Category.MARKETS, 80],
  ["JAKARTA_GLOBE_ID", "Jakarta Globe", "https://jakartaglobe.id/rss", "https://jakartaglobe.id/", "ID", Category.FINANCE, 80],

  // Malaysia
  ["THESTAR_MY", "The Star Malaysia Business", "https://www.thestar.com.my/rss/business/business-news", "https://www.thestar.com.my/business", "MY", Category.FINANCE, 84],
  ["NST_MY", "New Straits Times", "https://www.nst.com.my/feed", "https://www.nst.com.my/", "MY", Category.MARKETS, 80],
  ["THE_EDGE_MY", "The Edge Malaysia", "https://theedgemalaysia.com/rss", "https://theedgemalaysia.com/", "MY", Category.FINANCE, 84],
  ["BERNAMA_MY", "Bernama", "https://www.bernama.com/en/news/rss.php", "https://www.bernama.com/en/", "MY", Category.MARKETS, 82],

  // Singapore
  ["CNA_SG", "Channel News Asia", "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml", "https://www.channelnewsasia.com/", "SG", Category.FINANCE, 86],
  ["BUSINESS_TIMES_SG", "The Business Times", "https://www.businesstimes.com.sg/rss.xml", "https://www.businesstimes.com.sg/", "SG", Category.FINANCE, 88],
  ["TODAY_SG", "TODAY", "https://www.todayonline.com/feed", "https://www.todayonline.com/", "SG", Category.MARKETS, 80],
  ["CNA_BIZ_SG", "Channel News Asia Business", "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=business", "https://www.channelnewsasia.com/business", "SG", Category.FINANCE, 86],

  // Thailand
  ["NATION_TH", "Nation Thailand", "https://www.nationthailand.com/rss", "https://www.nationthailand.com/", "TH", Category.MARKETS, 80],
  ["THAIPBS_TH", "Thai PBS World", "https://www.thaipbsworld.com/feed/", "https://www.thaipbsworld.com/", "TH", Category.MARKETS, 80],
  ["KHAOSOD_TH", "Khaosod English", "https://www.khaosodenglish.com/feed/", "https://www.khaosodenglish.com/", "TH", Category.MARKETS, 76],
  ["BANGKOK_POST_NEWS_TH", "Bangkok Post News", "https://www.bangkokpost.com/rss/data/news.xml", "https://www.bangkokpost.com/", "TH", Category.MARKETS, 82],

  // Vietnam
  ["VIETNAMNET_VN", "VietnamNet English Business", "https://vietnamnet.vn/en/business.rss", "https://vietnamnet.vn/en/business", "VN", Category.ECONOMICS, 78],
  ["VIETNAMNEWS_VN", "Vietnam News", "https://vietnamnews.vn/rss", "https://vietnamnews.vn/", "VN", Category.MARKETS, 78],
  ["TUOI_TRE_VN", "Tuoi Tre News", "https://tuoitrenews.vn/rss", "https://tuoitrenews.vn/", "VN", Category.MARKETS, 76],
  ["SAIGON_TIMES_VN", "The Saigon Times", "https://english.thesaigontimes.vn/feed/", "https://english.thesaigontimes.vn/", "VN", Category.FINANCE, 80],

  // China
  ["GLOBAL_TIMES_CN", "Global Times", "https://www.globaltimes.cn/rss/outbrain.xml", "https://www.globaltimes.cn/", "CN", Category.MARKETS, 76],
  ["SIXTH_TONE_CN", "Sixth Tone", "https://www.sixthtone.com/rss", "https://www.sixthtone.com/", "CN", Category.MARKETS, 76],
  ["ECNS_CN", "China News Service", "https://www.ecns.cn/rss/rss.xml", "https://www.ecns.cn/", "CN", Category.MARKETS, 78],
  ["PEOPLE_CN", "People's Daily English Business", "http://en.people.cn/rss/business.xml", "http://en.people.cn/", "CN", Category.ECONOMICS, 78],
  ["XINHUA_BIZ_CN", "Xinhua Business", "https://www.xinhuanet.com/english/rss/businessrss.xml", "https://english.news.cn/", "CN", Category.FINANCE, 80],

  // Hong Kong
  ["HKFP_HK", "Hong Kong Free Press", "https://hongkongfp.com/feed/", "https://hongkongfp.com/", "HK", Category.MARKETS, 80],
  ["RTHK_HK", "RTHK English News", "https://rthk.hk/rthk/news/rss/e_expressnews_elocal.xml", "https://news.rthk.hk/", "HK", Category.MARKETS, 82],
  ["EJINSIGHT_HK", "EJ Insight", "https://www.ejinsight.com/feed/", "https://www.ejinsight.com/", "HK", Category.FINANCE, 80],
  ["THE_STANDARD_HK", "The Standard Hong Kong", "https://www.thestandard.com.hk/rss.php", "https://www.thestandard.com.hk/", "HK", Category.FINANCE, 78],

  // Taiwan
  ["FOCUS_TAIWAN_TW", "Focus Taiwan", "https://focustaiwan.tw/rss", "https://focustaiwan.tw/", "TW", Category.MARKETS, 84],
  ["TAIWAN_NEWS_TW", "Taiwan News", "https://www.taiwannews.com.tw/en/rss", "https://www.taiwannews.com.tw/", "TW", Category.MARKETS, 78],
  ["CNA_TW", "CNA English", "https://focustaiwan.tw/rss/aall", "https://www.cna.com.tw/english/", "TW", Category.MARKETS, 84],
  ["TAIWAN_TODAY_TW", "Taiwan Today", "https://taiwantoday.tw/rss.php", "https://taiwantoday.tw/", "TW", Category.ECONOMICS, 76],

  // Japan
  ["MAINICHI_JP", "Mainichi English", "https://mainichi.jp/english/rss/index.rss", "https://mainichi.jp/english/", "JP", Category.MARKETS, 80],
  ["JAPAN_TODAY_JP", "Japan Today", "https://japantoday.com/feed", "https://japantoday.com/", "JP", Category.MARKETS, 76],
  ["JAPAN_NEWS_JP", "The Japan News", "https://japannews.yomiuri.co.jp/feed/", "https://japannews.yomiuri.co.jp/", "JP", Category.MARKETS, 82],
  ["ASAHI_JP", "Asahi Shimbun English", "https://www.asahi.com/ajw/rss/", "https://www.asahi.com/ajw/", "JP", Category.MARKETS, 82],

  // South Korea
  ["KOREA_HERALD_KR", "The Korea Herald", "https://www.koreaherald.com/rss", "https://www.koreaherald.com/", "KR", Category.FINANCE, 82],
  ["YONHAP_KR", "Yonhap News", "https://en.yna.co.kr/RSS/news.xml", "https://en.yna.co.kr/", "KR", Category.MARKETS, 86],
  ["JOONGANG_KR", "Korea JoongAng Daily", "https://koreajoongangdaily.joins.com/xml/rss.xml", "https://koreajoongangdaily.joins.com/", "KR", Category.MARKETS, 82],
  ["KBS_WORLD_KR", "KBS World", "https://world.kbs.co.kr/rss/rss_news.htm?lang=e", "https://world.kbs.co.kr/", "KR", Category.MARKETS, 80],

  // Australia
  ["SMH_AU", "Sydney Morning Herald Business", "https://www.smh.com.au/rss/business.xml", "https://www.smh.com.au/business", "AU", Category.FINANCE, 86],
  ["GUARDIAN_AU_BIZ", "Guardian Australia Business", "https://www.theguardian.com/au/business/rss", "https://www.theguardian.com/au/business", "AU", Category.FINANCE, 84],
  ["NEWS_AU_FINANCE", "news.com.au Finance", "https://www.news.com.au/content-feeds/latest-news-finance/", "https://www.news.com.au/finance", "AU", Category.FINANCE, 78],
  ["ABC_AU_NEWS", "ABC News Australia", "https://www.abc.net.au/news/feed/51120/rss.xml", "https://www.abc.net.au/news/", "AU", Category.MARKETS, 86],
  ["AFR_AU", "Australian Financial Review", "https://www.afr.com/rss/feed.xml", "https://www.afr.com/", "AU", Category.FINANCE, 88],

  // New Zealand
  ["NZHERALD_NZ", "NZ Herald Business", "https://www.nzherald.co.nz/business/rss.xml", "https://www.nzherald.co.nz/business/", "NZ", Category.FINANCE, 84],
  ["STUFF_NZ", "Stuff", "https://www.stuff.co.nz/rss", "https://www.stuff.co.nz/", "NZ", Category.MARKETS, 80],
  ["INTEREST_NZ", "interest.co.nz", "https://www.interest.co.nz/rss.xml", "https://www.interest.co.nz/", "NZ", Category.FINANCE, 84],
  ["RNZ_NZ_NEWS", "RNZ News", "https://www.rnz.co.nz/rss/national.xml", "https://www.rnz.co.nz/", "NZ", Category.MARKETS, 84],

  // United States (national extra)
  ["USA_TODAY_MONEY", "USA Today Money", "http://rssfeeds.usatoday.com/UsatodaycomMoney-TopStories", "https://www.usatoday.com/money/", "US", Category.FINANCE, 80],
  ["LATIMES_BIZ", "LA Times Business", "https://www.latimes.com/business/rss2.0.xml", "https://www.latimes.com/business", "US", Category.FINANCE, 84],
  ["CBS_MONEYWATCH", "CBS MoneyWatch", "https://www.cbsnews.com/latest/rss/moneywatch", "https://www.cbsnews.com/moneywatch/", "US", Category.FINANCE, 82],
  ["PBS_NEWSHOUR", "PBS NewsHour", "https://www.pbs.org/newshour/feeds/rss/economy", "https://www.pbs.org/newshour/economy", "US", Category.ECONOMICS, 86],

  // United Kingdom extra
  ["TELEGRAPH_FINANCE", "The Telegraph Finance", "https://www.telegraph.co.uk/finance/rss.xml", "https://www.telegraph.co.uk/finance/", "GB", Category.FINANCE, 82],
  ["STANDARD_UK", "Evening Standard Business", "https://www.standard.co.uk/business/rss", "https://www.standard.co.uk/business", "GB", Category.FINANCE, 78],
  ["SKY_UK", "Sky News UK", "https://feeds.skynews.com/feeds/rss/uk.xml", "https://news.sky.com/uk", "GB", Category.MARKETS, 80],

  // Canada
  ["CBC_MONEY_CA", "CBC Money", "https://www.cbc.ca/webfeed/rss/rss-money", "https://www.cbc.ca/news/business", "CA", Category.FINANCE, 84],
  ["NATIONAL_POST_CA", "National Post", "https://nationalpost.com/feed/", "https://nationalpost.com/", "CA", Category.MARKETS, 80],
  ["BNN_CA", "BNN Bloomberg", "https://www.bnnbloomberg.ca/rss.xml", "https://www.bnnbloomberg.ca/", "CA", Category.FINANCE, 84],
  ["TORONTO_STAR_BIZ", "Toronto Star Business", "https://www.thestar.com/business.rss", "https://www.thestar.com/business.html", "CA", Category.FINANCE, 80],

  // Mexico
  ["EL_UNIVERSAL_MX", "El Universal", "https://www.eluniversal.com.mx/rss.xml", "https://www.eluniversal.com.mx/", "MX", Category.MARKETS, 78],
  ["EL_FINANCIERO_MX", "El Financiero", "https://www.elfinanciero.com.mx/rss/", "https://www.elfinanciero.com.mx/", "MX", Category.FINANCE, 84],
  ["MILENIO_MX", "Milenio Negocios", "https://www.milenio.com/rss/negocios", "https://www.milenio.com/negocios", "MX", Category.FINANCE, 78],
  ["EXPANSION_MX", "Expansion Mexico", "https://expansion.mx/rss", "https://expansion.mx/", "MX", Category.FINANCE, 82],

  // Brazil
  ["VALOR_BR", "Valor Economico", "https://valor.globo.com/rss/", "https://valor.globo.com/", "BR", Category.FINANCE, 86],
  ["G1_ECONOMIA_BR", "G1 Economia", "https://g1.globo.com/rss/g1/economia/", "https://g1.globo.com/economia/", "BR", Category.ECONOMICS, 84],
  ["ESTADAO_BR", "Estadao Economia", "https://www.estadao.com.br/rss/economia.xml", "https://www.estadao.com.br/economia/", "BR", Category.ECONOMICS, 82],
  ["REUTERS_BR_FOLHA", "Folha Poder", "https://feeds.folha.uol.com.br/poder/rss091.xml", "https://www.folha.uol.com.br/", "BR", Category.MARKETS, 80],

  // Argentina
  ["CLARIN_AR", "Clarin Economia", "https://www.clarin.com/rss/economia/", "https://www.clarin.com/economia/", "AR", Category.ECONOMICS, 80],
  ["NACION_AR", "La Nacion Economia", "https://www.lanacion.com.ar/arc/outboundfeeds/rss/category/economia/", "https://www.lanacion.com.ar/economia/", "AR", Category.ECONOMICS, 82],
  ["AMBITO_AR", "Ambito Financiero", "https://www.ambito.com/rss/pages/economia.xml", "https://www.ambito.com/economia", "AR", Category.FINANCE, 82],
  ["INFOBAE_AR", "Infobae Economia", "https://www.infobae.com/economia/feed/", "https://www.infobae.com/economia/", "AR", Category.ECONOMICS, 80],

  // Chile
  ["BIOBIO_CL", "BioBio Chile Economia", "https://www.biobiochile.cl/rss/economia.xml", "https://www.biobiochile.cl/", "CL", Category.ECONOMICS, 78],
  ["EMOL_CL", "Emol Economia", "https://www.emol.com/rss/economia.xml", "https://www.emol.com/economia/", "CL", Category.ECONOMICS, 80],
  ["DF_CL", "Diario Financiero", "https://www.df.cl/noticias/site/tax/port/all/rss____1.xml", "https://www.df.cl/", "CL", Category.FINANCE, 84],
  ["LA_TERCERA_CL", "La Tercera Negocios", "https://www.latercera.com/negocio/rss/", "https://www.latercera.com/negocio/", "CL", Category.FINANCE, 80],

  // Paraguay
  ["ULTIMAHORA_PY", "Ultima Hora", "https://www.ultimahora.com/rss/economia.xml", "https://www.ultimahora.com/", "PY", Category.ECONOMICS, 78],
  ["NACION_PY", "La Nacion Paraguay", "https://www.lanacion.com.py/feed/", "https://www.lanacion.com.py/", "PY", Category.ECONOMICS, 74],
  ["ABC_PY_ECON", "ABC Color Economia", "https://www.abc.com.py/arc/outboundfeeds/rss/economia/", "https://www.abc.com.py/", "PY", Category.ECONOMICS, 80],

  // Germany
  ["ZEIT_DE", "Die Zeit Wirtschaft", "https://newsfeed.zeit.de/wirtschaft/index", "https://www.zeit.de/wirtschaft", "DE", Category.ECONOMICS, 86],
  ["FAZ_DE", "FAZ Wirtschaft", "https://www.faz.net/rss/aktuell/wirtschaft/", "https://www.faz.net/aktuell/wirtschaft/", "DE", Category.ECONOMICS, 86],
  ["TAGESSCHAU_DE", "Tagesschau", "https://www.tagesschau.de/xml/rss2/", "https://www.tagesschau.de/", "DE", Category.MARKETS, 86],
  ["BUNDESBANK_DE", "Deutsche Bundesbank", "https://www.bundesbank.de/en/rss", "https://www.bundesbank.de/en", "DE", Category.ECONOMICS, 98],
  ["HANDELSBLATT_DE", "Handelsblatt", "https://www.handelsblatt.com/contentexport/feed/schlagzeilen", "https://www.handelsblatt.com/", "DE", Category.FINANCE, 86],

  // France
  ["LES_ECHOS_FR", "Les Echos", "https://www.lesechos.fr/rss/rss_une.xml", "https://www.lesechos.fr/", "FR", Category.FINANCE, 88],
  ["FIGARO_ECO_FR", "Le Figaro Economie", "https://www.lefigaro.fr/rss/figaro_economie.xml", "https://www.lefigaro.fr/conjoncture", "FR", Category.ECONOMICS, 84],
  ["LE_PARISIEN_ECO_FR", "Le Parisien Economie", "https://www.leparisien.fr/economie/rss.xml", "https://www.leparisien.fr/economie/", "FR", Category.ECONOMICS, 78],
  ["BFM_FR", "BFM Business", "https://www.bfmtv.com/rss/economie/", "https://www.bfmtv.com/economie/", "FR", Category.FINANCE, 80],

  // Italy
  ["CORRIERE_IT", "Corriere Economia", "https://xml2.corriereobjects.it/rss/economia.xml", "https://www.corriere.it/economia/", "IT", Category.ECONOMICS, 84],
  ["SOLE24ORE_IT", "Il Sole 24 Ore", "https://www.ilsole24ore.com/rss/italia--economia.xml", "https://www.ilsole24ore.com/", "IT", Category.FINANCE, 88],
  ["ANSA_IT_FINANZA", "ANSA Finanza", "https://www.ansa.it/sito/notizie/economia/finanza_imprese/finanza_imprese_rss.xml", "https://www.ansa.it/", "IT", Category.FINANCE, 84],

  // Spain
  ["ELMUNDO_ES", "El Mundo Economia", "https://e00-elmundo.uecdn.es/elmundo/rss/economia.xml", "https://www.elmundo.es/economia.html", "ES", Category.ECONOMICS, 82],
  ["CINCO_DIAS_ES", "Cinco Dias", "https://cincodias.elpais.com/rss/cincodias/portada.xml", "https://cincodias.elpais.com/", "ES", Category.FINANCE, 84],
  ["RTVE_ES", "RTVE Economia", "https://www.rtve.es/rss/temas_economia.xml", "https://www.rtve.es/noticias/economia/", "ES", Category.ECONOMICS, 80],

  // Netherlands
  ["NOS_NL", "NOS Economie", "https://feeds.nos.nl/nosnieuwseconomie", "https://nos.nl/nieuws/economie", "NL", Category.ECONOMICS, 86],
  ["NLTIMES_BIZ_NL", "NL Times Business", "https://nltimes.nl/categories/business/rss.xml", "https://nltimes.nl/", "NL", Category.FINANCE, 76],
  ["DUTCHNEWS_BIZ_NL", "Dutch News Economy", "https://www.dutchnews.nl/category/economy/feed/", "https://www.dutchnews.nl/", "NL", Category.ECONOMICS, 76],

  // Switzerland
  ["SWI_CH", "swissinfo", "https://www.swissinfo.ch/eng/rss", "https://www.swissinfo.ch/eng", "CH", Category.FINANCE, 84],
  ["SNB_CH", "Swiss National Bank", "https://www.snb.ch/en/mmr/reference/rss_feed/source/rss_feed.rss", "https://www.snb.ch/", "CH", Category.ECONOMICS, 98],
  ["THELOCAL_CH", "The Local Switzerland", "https://feeds.thelocal.com/rss/ch", "https://www.thelocal.ch/", "CH", Category.MARKETS, 76],
  ["LE_TEMPS_CH", "Le Temps Economie", "https://www.letemps.ch/economie.rss", "https://www.letemps.ch/economie", "CH", Category.ECONOMICS, 82],

  // Belgium
  ["VRT_BE_ECON", "VRT NWS Economy", "https://www.vrt.be/vrtnws/en.rss.economy.xml", "https://www.vrt.be/vrtnws/en/", "BE", Category.ECONOMICS, 80],
  ["BRUSSELS_TIMES_BE", "The Brussels Times", "https://www.brusselstimes.com/feed", "https://www.brusselstimes.com/", "BE", Category.MARKETS, 80],
  ["NBB_BE", "National Bank of Belgium", "https://www.nbb.be/en/rss/press-releases", "https://www.nbb.be/en", "BE", Category.ECONOMICS, 96],

  // Austria
  ["ORF_AT_ECONOMY", "ORF Economy", "https://rss.orf.at/economy.xml", "https://orf.at/", "AT", Category.ECONOMICS, 80],
  ["THELOCAL_AT", "The Local Austria", "https://feeds.thelocal.com/rss/at", "https://www.thelocal.at/", "AT", Category.MARKETS, 76],
  ["WIENER_ZEITUNG_AT", "Wiener Zeitung", "https://www.wienerzeitung.at/rss/wirtschaft.xml", "https://www.wienerzeitung.at/", "AT", Category.ECONOMICS, 78],

  // Sweden
  ["THELOCAL_SE_BIZ", "The Local Sweden Business", "https://feeds.thelocal.com/rss/se/tag/business", "https://www.thelocal.se/", "SE", Category.FINANCE, 74],
  ["RIKSBANK_SE", "Riksbank", "https://www.riksbank.se/en-gb/rss/", "https://www.riksbank.se/", "SE", Category.ECONOMICS, 98],
  ["THELOCAL_SE_ECON", "The Local Sweden Economy", "https://feeds.thelocal.com/rss/se/tag/economy", "https://www.thelocal.se/", "SE", Category.ECONOMICS, 74],
  ["SVERIGES_RADIO_SE", "Sveriges Radio English", "https://api.sr.se/api/rss/program/2054", "https://sverigesradio.se/", "SE", Category.MARKETS, 78],

  // Norway
  ["THELOCAL_NO", "The Local Norway", "https://feeds.thelocal.com/rss/no", "https://www.thelocal.no/", "NO", Category.OIL, 76],
  ["NORGES_BANK_NO", "Norges Bank", "https://www.norges-bank.no/rss/news", "https://www.norges-bank.no/", "NO", Category.ECONOMICS, 98],
  ["NEWSINENGLISH_BIZ_NO", "News in English Economy", "https://www.newsinenglish.no/category/economy/feed/", "https://www.newsinenglish.no/", "NO", Category.ECONOMICS, 78],
  ["NRK_NO", "NRK Nyheter", "https://www.nrk.no/nyheter/siste.rss", "https://www.nrk.no/", "NO", Category.MARKETS, 82],

  // Denmark
  ["THELOCAL_DK", "The Local Denmark", "https://feeds.thelocal.com/rss/dk", "https://www.thelocal.dk/", "DK", Category.MARKETS, 76],
  ["NATIONALBANKEN_DK", "Danmarks Nationalbank", "https://www.nationalbanken.dk/en/rss", "https://www.nationalbanken.dk/", "DK", Category.ECONOMICS, 98],
  ["CPHPOST_BIZ_DK", "Copenhagen Post Business", "https://cphpost.dk/category/business/feed/", "https://cphpost.dk/", "DK", Category.FINANCE, 74],

  // Poland
  ["NOTES_PL_BIZ", "Notes from Poland Business", "https://notesfrompoland.com/category/business/feed/", "https://notesfrompoland.com/", "PL", Category.FINANCE, 78],
  ["TVP_WORLD_PL", "TVP World", "https://tvpworld.com/rss", "https://tvpworld.com/", "PL", Category.MARKETS, 76],
  ["NBP_PL", "National Bank of Poland", "https://nbp.pl/en/feed/", "https://nbp.pl/en/", "PL", Category.ECONOMICS, 96],
  ["POLISH_NEWS_PL", "The First News", "https://www.thefirstnews.com/rss", "https://www.thefirstnews.com/", "PL", Category.MARKETS, 74],

  // Ukraine
  ["KYIV_INDEPENDENT_UA", "The Kyiv Independent", "https://kyivindependent.com/feed/", "https://kyivindependent.com/", "UA", Category.MARKETS, 82],
  ["UKRINFORM_ECON_UA", "Ukrinform Economy", "https://www.ukrinform.net/rss/block-economics", "https://www.ukrinform.net/rubric-economy", "UA", Category.ECONOMICS, 80],
  ["KYIV_POST_UA", "Kyiv Post", "https://www.kyivpost.com/feed", "https://www.kyivpost.com/", "UA", Category.MARKETS, 80],
  ["PRAVDA_UA", "Ukrainska Pravda", "https://www.pravda.com.ua/eng/rss/", "https://www.pravda.com.ua/eng/", "UA", Category.MARKETS, 78],

  // Russia
  ["TASS_BIZ_RU", "TASS Economy", "https://tass.com/rss/v2.xml?section=economy", "https://tass.com/economy", "RU", Category.ECONOMICS, 78],
  ["RT_RU", "RT Business", "https://www.rt.com/rss/business/", "https://www.rt.com/business/", "RU", Category.FINANCE, 70],
  ["MEDUZA_RU", "Meduza", "https://meduza.io/rss/en/all", "https://meduza.io/en", "RU", Category.MARKETS, 76],
  ["INTERFAX_RU", "Interfax", "https://interfax.com/news/rss/", "https://interfax.com/", "RU", Category.MARKETS, 78],

  // Portugal
  ["THE_PORTUGAL_NEWS_PT", "The Portugal News", "https://www.theportugalnews.com/rss", "https://www.theportugalnews.com/", "PT", Category.MARKETS, 74],
  ["ECO_PT", "ECO Portuguese", "https://eco.sapo.pt/feed/", "https://eco.sapo.pt/", "PT", Category.FINANCE, 82],
  ["PUBLICO_PT", "Publico Economia", "https://feeds.publico.pt/rss/economia", "https://www.publico.pt/economia", "PT", Category.ECONOMICS, 82],
  ["JORNAL_NEGOCIOS_PT", "Jornal de Negocios", "https://www.jornaldenegocios.pt/rss", "https://www.jornaldenegocios.pt/", "PT", Category.FINANCE, 82],

  // Ireland
  ["RTE_IE", "RTE Business", "https://www.rte.ie/rss/business.xml", "https://www.rte.ie/news/business/", "IE", Category.FINANCE, 84],
  ["IRISH_TIMES_IE", "The Irish Times Business", "https://www.irishtimes.com/rss/feed/business", "https://www.irishtimes.com/business/", "IE", Category.FINANCE, 86],
  ["THEJOURNAL_IE", "The Journal Ireland", "https://www.thejournal.ie/feed/", "https://www.thejournal.ie/", "IE", Category.MARKETS, 76],
  ["INDEPENDENT_IE_NEWS", "Irish Independent", "https://www.independent.ie/rss", "https://www.independent.ie/", "IE", Category.MARKETS, 80],

  // Kazakhstan
  ["ASTANA_TIMES_BIZ_KZ", "Astana Times Business", "https://www.astanatimes.com/category/business/feed/", "https://www.astanatimes.com/", "KZ", Category.ECONOMICS, 76],
  ["KAZINFORM_KZ", "Kazinform", "https://www.inform.kz/en/rss", "https://www.inform.kz/en", "KZ", Category.MARKETS, 78],
  ["THE_ASTANA_TIMES_ECON_KZ", "Astana Times Economy", "https://www.astanatimes.com/category/kazakhstan-economy/feed/", "https://www.astanatimes.com/", "KZ", Category.ECONOMICS, 76],

  // Afghanistan
  ["TOLO_AF", "TOLOnews", "https://tolonews.com/rss.xml", "https://tolonews.com/", "AF", Category.MARKETS, 74],
  ["PAJHWOK_AF", "Pajhwok Afghan News", "https://pajhwok.com/feed/", "https://pajhwok.com/", "AF", Category.MARKETS, 74],
  ["ARIEN_AF", "Ariana News", "https://www.ariananews.af/feed/", "https://www.ariananews.af/", "AF", Category.MARKETS, 72],
] as const;

export const COUNTRY_PUBLISHERS: CountrySourceSeed[] = rowsToSources([...COUNTRY_ROWS]);
