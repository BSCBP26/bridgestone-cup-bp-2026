const STORAGE_KEY = 'bridgestone_public_language';
const pairs = [
  ['Lewati ke konten utama','Skip to main content'],['Menu','Menu'],['Navigasi utama','Main navigation'],['Ganti bahasa','Change language'],
  ['Greeting','Greetings'],['Schedule','Schedule'],['Sport Event','Sports'],['Gallery','Gallery'],['Support Board','Support Board'],
  ['PENGUMUMAN','ANNOUNCEMENT'],['Tutup pengumuman','Close announcement'],
  ['Sambutan dan semangat kebersamaan untuk seluruh peserta','Greetings and a spirit of togetherness for all participants'],
  ['GREETINGS','GREETINGS'],['EVENT SCHEDULE','EVENT SCHEDULE'],['8–13 DESEMBER • CAFETARIA & EMPANG IKAN MAS BUNGUR','8–13 DECEMBER • CAFETERIA & BUNGUR GOLDFISH POND'],
  ['ENAM CABOR. SATU JUARA.','SIX SPORTS. ONE CHAMPION.'],['PILIH ARENAMU','CHOOSE YOUR ARENA'],
  ['Pilih kategori kompetisi untuk melihat jadwal, bracket, dan klasemen.','Select a competition category to explore schedules, brackets, and standings.'],
  ['KATEGORI AKTIF','ACTIVE CATEGORY'],['Pilih olahraga untuk membuka ringkasan pertandingannya','Choose a sport to open its event overview'],
  ['MOMEN DARI TURNAMEN','MOMENTS FROM THE TOURNAMENT'],['GALERI FOTO','PHOTO GALLERY'],['LEBIH BANYAK UNTUK DITEMUKAN','MORE TO DISCOVER'],
  ['LIHAT SETIAP MOMEN DARI TURNAMEN','SEE EVERY MOMENT FROM THE TOURNAMENT'],['Jelajahi koleksi foto lengkap dari setiap cabang olahraga dan pertandingan.','Explore the complete photo collection across every sport and event.'],['LIHAT LEBIH BANYAK →','CLICK FOR MORE →'],
  ['PAPAN DUKUNGAN','SUPPORT BOARD'],['TIM PENDUKUNG TERATAS','TOP SUPPORTER TEAMS'],['PINDAI ATAU KETUK UNTUK MENGIRIM DUKUNGAN','SCAN OR TAP TO SEND YOUR SUPPORT'],
  ['LEADERBOARD BELUM TERSEDIA','LEADERBOARD NOT AVAILABLE'],
  ['GREETING BELUM TERSEDIA','GREETINGS NOT AVAILABLE'],
  ['JADWAL BELUM TERSEDIA','SCHEDULE NOT AVAILABLE'],['BRACKET BELUM TERSEDIA','BRACKET NOT AVAILABLE'],['HASIL BELUM TERSEDIA','RESULTS NOT AVAILABLE'],
  ['PESERTA BELUM TERSEDIA','PARTICIPANTS NOT AVAILABLE'],['TOP SCORER BELUM TERSEDIA','TOP SCORER NOT AVAILABLE'],['DUKUNGAN BELUM TERSEDIA','SUPPORT NOT AVAILABLE'],
  ['DATA MENUNGGU','DATA PENDING'],['FOTO BELUM TERSEDIA','PHOTO NOT AVAILABLE'],
  ['Buka','Open'],['Foto','Photo'],['LOKASI','LOCATION'],['WAKTU','TIME'],['Timbang hasil tangkapan','Weighing the catch'],['DESEMBER','DECEMBER'],['Venue menunggu','Venue pending'],
  ['Pilih cabang olahraga','Choose a sport'],['Tampilan Futsal','Futsal views'],['Klasemen grup Futsal','Futsal group standings'],['Jadwal pertandingan Futsal','Futsal match schedule'],
  ['KLASEMEN BELUM TERSEDIA','STANDINGS NOT AVAILABLE'],
  ['JADWAL MENUNGGU','SCHEDULE PENDING'],['MENUNGGU HASIL','AWAITING RESULT'],['PENGUMUMAN','ANNOUNCEMENT'],['JUARA 1','1ST PLACE'],['JUARA 2','2ND PLACE'],['JUARA 3','3RD PLACE'],
  ['JADWAL PERTANDINGAN','MATCH SCHEDULE'],['PERTANDINGAN','MATCH'],['KLASEMEN GRUP','GROUP STANDINGS'],['POIN','POINTS'],['PEMENANG','WINNER'],
  ['SEMUA FOTO','ALL PHOTOS'],['← KEMBALI KE BERANDA','← BACK HOME'],['JELAJAHI BERDASARKAN CABOR','EXPLORE BY SPORT'],['Pilih cabang olahraga untuk menjelajahi galeri turnamen yang telah dipublikasikan.','Choose a sport to explore its published tournament gallery.'],
  ['SEMUA MOMEN','ALL MOMENTS'],['SETIAP MOMEN, SATU CERITA TURNAMEN.','EVERY MOMENT, ONE TOURNAMENT STORY.'],['KOLEKSI LENGKAP CABANG OLAHRAGA','COMPLETE SPORT COLLECTION'],['MOMEN OLAHRAGA','SPORT MOMENTS'],['Memuat foto turnamen yang telah dipublikasikan.','Loading published tournament photos.'],
  ['Belum ada foto yang dipublikasikan untuk cabang olahraga ini.','No photos have been published for this sport yet.'],['Buka foto','Open photo'],['Tutup foto','Close photo'],['Foto sebelumnya','Previous photo'],['Foto berikutnya','Next photo'],
  ['SEMUA','ALL'],['GALERI','GALLERY'],['BUKA KOLEKSI','OPEN COLLECTION'],['MOMEN TURNAMEN','TOURNAMENT MOMENT'],['DIARSIPKAN','ARCHIVED'],
  ['TIM','TEAMS'],['PASANGAN','PAIRS'],['PESERTA','PLAYERS'],['GANDA','DOUBLES'],['FOTO','PHOTOS'],['MOMEN','MOMENTS'],['KARTU DUKUNGAN','SUPPORT CARDS']
  ,['Akses pengelola','Admin access']
];

const idToEn = new Map(pairs);
const enToId = new Map(pairs.map(([id,en]) => [en,id]));
const heroSelector = '#home.hero, #home.hero *';
let language = localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'id';
let translating = false;

const replaceTokens = (value, lang) => {
  let output = value;
  const replacements = lang === 'en'
    ? [[/\bTIM\b/g,'TEAMS'],[/\bPASANGAN\b/g,'PAIRS'],[/\bPESERTA\b/g,'PLAYERS'],[/\bGANDA\b/g,'DOUBLES'],[/\bPOIN\b/g,'POINTS'],[/\bDESEMBER\b/g,'DECEMBER'],[/\bFOTO\b/g,'PHOTOS'],[/\bMOMEN\b/g,'MOMENTS']]
    : [[/\bTEAMS\b/g,'TIM'],[/\bPAIRS\b/g,'PASANGAN'],[/\bPLAYERS\b/g,'PESERTA'],[/\bDOUBLES\b/g,'GANDA'],[/\bPOINTS\b/g,'POIN'],[/\bDECEMBER\b/g,'DESEMBER'],[/\bPHOTOS\b/g,'FOTO'],[/\bMOMENTS\b/g,'MOMEN']];
  replacements.forEach(([pattern,replacement]) => { output = output.replace(pattern,replacement); });
  return output;
};

const translateValue = value => {
  const trimmed = value.trim();
  if (!trimmed) return value;
  const map = language === 'en' ? idToEn : enToId;
  const translated = map.get(trimmed) || replaceTokens(trimmed, language);
  return value.replace(trimmed, translated);
};

const translateTree = root => {
  if (translating) return;
  translating = true;
  const nodes = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (nodes.nextNode()) textNodes.push(nodes.currentNode);
  textNodes.forEach(node => {
    const parent = node.parentElement;
    if (!parent || parent.matches(heroSelector) || parent.closest(heroSelector) || parent.closest('.public-language-switcher')) return;
    node.nodeValue = translateValue(node.nodeValue);
  });
  root.querySelectorAll?.('[aria-label],[title],[placeholder]').forEach(element => {
    if (element.matches(heroSelector) || element.closest(heroSelector)) return;
    ['aria-label','title','placeholder'].forEach(attribute => {
      if (element.hasAttribute(attribute)) element.setAttribute(attribute, translateValue(element.getAttribute(attribute)));
    });
  });
  document.documentElement.lang = language;
  document.querySelectorAll('[data-public-lang]').forEach(button => {
    const active = button.dataset.publicLang === language;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  translating = false;
};

const setLanguage = next => {
  language = next === 'en' ? 'en' : 'id';
  localStorage.setItem(STORAGE_KEY, language);
  translateTree(document.body);
  window.dispatchEvent(new CustomEvent('publiclanguagechange', { detail:{ language } }));
};

const installSwitcher = () => {
  if (document.querySelector('.public-language-switcher')) return;
  const existing = document.querySelector('.language-toggle');
  if (existing) {
    if (existing.dataset.publicI18nReady === 'true') return;
    existing.innerHTML = '<span data-public-lang="id">ID</span><span data-public-lang="en">EN</span>';
    existing.dataset.publicI18nReady = 'true';
    existing.addEventListener('click', event => {
      const target = event.target.closest('[data-public-lang]');
      if (target) setLanguage(target.dataset.publicLang);
    });
    return;
  }
  const host = document.querySelector('.sports-header nav, .gallery-topbar, .site-header nav');
  if (!host) return;
  const switcher = document.createElement('div');
  switcher.className = 'public-language-switcher';
  switcher.setAttribute('aria-label', 'Ganti bahasa');
  switcher.innerHTML = '<button type="button" data-public-lang="id">ID</button><button type="button" data-public-lang="en">EN</button>';
  switcher.addEventListener('click', event => {
    const target = event.target.closest('[data-public-lang]');
    if (target) setLanguage(target.dataset.publicLang);
  });
  host.append(switcher);
};

const style = document.createElement('style');
style.textContent = '.public-language-switcher{display:inline-flex;align-items:center;gap:2px;margin-left:10px;padding:3px;border:1px solid #66501d;border-radius:999px;background:#080704}.public-language-switcher button{min-width:30px;padding:7px 9px;border:0;border-radius:999px;background:transparent;color:#aaa;font:700 10px Inter,sans-serif;cursor:pointer}.public-language-switcher button.active{background:#d6a42c;color:#090704}.sport-collection .gallery-topbar{position:relative}.sport-collection .gallery-topbar>#photo-count{display:none!important}.sport-collection .gallery-topbar>.public-language-switcher{position:absolute;top:50%;right:20px;grid-column:auto!important;width:auto!important;margin:0!important;transform:translateY(-50%)}@media(max-width:760px){.public-language-switcher{margin:8px 0 0}}@media(max-width:520px){.sport-collection .gallery-topbar>.public-language-switcher{right:10px;margin:0!important}}';
document.head.append(style);
installSwitcher();
translateTree(document.body);
new MutationObserver(records => {
  if (translating) return;
  installSwitcher();
  records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
    else if (node.nodeType === Node.TEXT_NODE && node.parentElement) translateTree(node.parentElement);
  }));
}).observe(document.body, { childList:true, subtree:true });

window.BridgestonePublicI18n = { get language(){ return language; }, setLanguage, translateTree };
