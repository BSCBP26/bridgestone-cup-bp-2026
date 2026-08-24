const LANGUAGE_KEY = 'bridgestone_admin_language';

const idToEn = new Map(Object.entries({
  'DASHBOARD ADMIN': 'ADMIN DASHBOARD',
  'MENU ADMIN': 'ADMIN MENU',
  'Bagian yang Dapat Diatur': 'Management Menu',
  '5 pilihan': '5 options',
  'Kelola Pertandingan per Cabor': 'Manage Sports Competitions',
  'Pilih Badminton, Futsal, Chess, Table Tennis, Football, atau Fishing untuk mengatur grup, bracket, jadwal, skor, ranking, dan pemenang.': 'Choose Badminton, Futsal, Chess, Table Tennis, Football, or Fishing to manage groups, brackets, schedules, scores, rankings, and winners.',
  'Galeri Pertandingan': 'Match Gallery',
  'Unggah, atur, dan publikasikan dokumentasi foto setiap cabang olahraga.': 'Upload, organize, and publish photos for each sport.',
  'Sambutan Acara': 'Event Greetings',
  'Kelola nama, jabatan, pesan sambutan, serta foto perwakilan acara.': 'Manage names, positions, greeting messages, and representative photos.',
  'Pesan Dukungan': 'Support Messages',
  'Kelola support card, tim pendukung, foto, dan leaderboard Top Supporter Teams.': 'Manage support cards, supporter teams, photos, and the Top Supporter Teams leaderboard.',
  'Pengumuman Publik': 'Public Announcements',
  'Tulis, simpan sebagai draft, atau publikasikan informasi untuk pengunjung.': 'Write, save as draft, or publish information for visitors.',
  'DAFTAR CABOR': 'SPORTS LIST',
  'Cabang Olahraga': 'Sports',
  'Cabang terdaftar': 'Registered sports',
  'Keluar': 'Log out',
  'Situs publik': 'Public site',
  'KAPASITAS MEDIA': 'MEDIA CAPACITY',
  'Kapasitas Penyimpanan': 'Storage Capacity',
  'Memuat pemakaianâ€¦': 'Loading usageâ€¦',
  'Memuatâ€¦': 'Loadingâ€¦',
  'Aman': 'Safe',
  'Perlu diperhatikan': 'Needs attention',
  'Hampir penuh': 'Almost full',
  'terpakai': 'used',
  'tersisa': 'remaining',
  'Gagal dimuat': 'Failed to load',
  'Diperiksa': 'Checked',
  'Pemakaian penyimpanan belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.': 'Storage usage could not be loaded. Reload the page to try again.',
  'Dashboard': 'Dashboard',
  'PILIH CABANG OLAHRAGA': 'CHOOSE A SPORT',
  'SATU MENU UNTUK SELURUH PERTANDINGAN': 'ONE MENU FOR ALL COMPETITIONS',
  'Pilih cabang olahraga yang ingin dikelola.': 'Choose the sport you want to manage.',
  'Setiap kartu hanya menampilkan pengaturan yang dibutuhkan oleh cabang tersebut.': 'Each card shows only the settings required for that sport.',
  'SISTEM GUGUR': 'KNOCKOUT SYSTEM',
  'GRUP & SISTEM GUGUR': 'GROUP & KNOCKOUT',
  'FORMAT FLEKSIBEL': 'FLEXIBLE FORMAT',
  'Format kompetisi': 'Competition format',
  'Langsung playoff / bracket': 'Direct playoff / bracket',
  'Group standing lalu playoff': 'Group standing then playoff',
  'Simpan format': 'Save format',
  'Fase grup diaktifkan.': 'Group stage enabled.',
  'Langsung playoff diaktifkan.': 'Direct playoff enabled.',
  'Menyimpan format…': 'Saving format…',
  'RANKING MANUAL': 'MANUAL RANKING',
  'Kelola Badminton': 'Manage Badminton',
  'Kelola Football': 'Manage Football',
  'Kelola Fishing': 'Manage Fishing',
  'Kelola Grup & Kelolosan': 'Manage Groups & Qualification',
  'Kelola Bracket, Jadwal & Hasil': 'Manage Bracket, Schedule & Results',
  'Kelola Top Scorer': 'Manage Top Scorers',
  'Atur pasangan peserta, bracket pertandingan, jadwal, venue, skor, serta Juara 1, 2, dan 3.': 'Manage participant pairs, match brackets, schedules, venues, scores, and first, second, and third place.',
  'Atur klasemen grup, tim yang lolos secara silang, bracket, jadwal, hasil, dan top scorer manual.': 'Manage group standings, cross-group qualifiers, brackets, schedules, results, and manual top scorers.',
  'Atur klasemen grup, peserta yang lolos Top 1 atau Top 2, bracket, jadwal, hasil, dan pemenang.': 'Manage group standings, Top 1 or Top 2 qualifiers, brackets, schedules, results, and winners.',
  'Atur klasemen grup, kelolosan silang, bracket, jadwal, hasil, serta Juara 1, 2, dan 3.': 'Manage group standings, cross-group qualification, brackets, schedules, results, and first, second, and third place.',
  'Atur tim peserta, bracket pertandingan, jadwal, venue, skor, serta Juara 1, 2, dan 3.': 'Manage participating teams, match brackets, schedules, venues, scores, and first, second, and third place.',
  'Pilih langsung playoff atau fase grup terlebih dahulu, lalu atur bracket, jadwal, skor, dan podium.': 'Choose direct playoffs or a group stage first, then manage the bracket, schedule, scores, and podium.',
  'Pilih langsung playoff atau fase grup terlebih dahulu, lalu atur bracket, jadwal, hasil, dan top scorer.': 'Choose direct playoffs or a group stage first, then manage the bracket, schedule, results, and top scorers.',
  'Pilih langsung playoff atau fase grup terlebih dahulu, lalu atur bracket, hasil, dan pemenang.': 'Choose direct playoffs or a group stage first, then manage the bracket, results, and winners.',
  'Pilih langsung playoff atau fase grup terlebih dahulu, lalu atur bracket, hasil, dan podium.': 'Choose direct playoffs or a group stage first, then manage the bracket, results, and podium.',
  'Atur nama tim, dua pemancing setiap tim, skor hasil tangkapan, urutan ranking, dan winner.': 'Manage team names, two anglers per team, catch scores, ranking order, and the winner.',
  'PENGATURAN BRACKET': 'BRACKET SETTINGS',
  'Pilih Cabor': 'Choose Sport',
  'TURNAMEN': 'TOURNAMENT',
  'Peserta & Bracket': 'Participants & Bracket',
  'Cabang olahraga': 'Sport',
  'Turnamen': 'Tournament',
  'Peserta': 'Participants',
  'satu nama per baris': 'one name per line',
  'Preview': 'Preview',
  'Simpan': 'Save',
  'Regenerate': 'Regenerate',
  'Muat tersimpan': 'Load Saved',
  'Bracket, jadwal, dan hasil yang disimpan akan tetap tersedia.': 'Saved brackets, schedules, and results will remain available.',
  'HASIL BRACKET': 'BRACKET RESULTS',
  'Bracket belum dimuat': 'Bracket has not been loaded',
  'Belum ada bracket': 'No bracket yet',
  'Gunakan Preview atau Muat tersimpan.': 'Use Preview or Load Saved.',
  'Simpan jadwal': 'Save Schedule',
  'Simpan hasil': 'Save Result',
  'Koreksi skor': 'Correct Score',
  'Menunggu hasil': 'Awaiting Result',
  'Memuat bracket…': 'Loading bracket…',
  'Memuat bracket hasil grup…': 'Loading group-stage bracket…',
  'Peserta diambil otomatis dari hasil Group Standing.': 'Participants are selected automatically from Group Standing results.',
  'Peserta berasal dari hasil kelolosan grup.': 'Participants come from the group qualification results.',
  'PEMENANG': 'WINNER',
  'PENGATURAN GRUP & KLASEMEN': 'GROUP & STANDINGS SETTINGS',
  'Tambah grup': 'Add Group',
  'Simpan klasemen': 'Save Standings',
  'PESERTA LOLOS KE BRACKET': 'BRACKET QUALIFIERS',
  'Lolos ke Bracket': 'Qualify for Bracket',
  'Ambil peserta berdasarkan peringkat terbaru dari setiap grup.': 'Select participants based on the latest ranking in each group.',
  'Aturan kelolosan': 'Qualification Rule',
  'Top 2 setiap grup': 'Top 2 from each group',
  'Top 1 setiap grup': 'Top 1 from each group',
  'Buat / Perbarui bracket': 'Create / Update Bracket',
  'Hapus grup': 'Delete Group',
  'Tim/Peserta': 'Team/Participant',
  'Tambah peserta': 'Add Participant',
  'Memuat klasemen…': 'Loading standings…',
  'Klasemen tersimpan dimuat.': 'Saved standings loaded.',
  'Belum ada data tersimpan. Contoh turnamen dimuat dan siap disimpan.': 'No saved data yet. Tournament examples are loaded and ready to save.',
  'Belum ada data tersimpan. Tambahkan grup dan peserta.': 'No saved data yet. Add groups and participants.',
  'PENGATURAN TOP SCORER FUTSAL': 'FUTSAL TOP SCORER SETTINGS',
  'INPUT MANUAL': 'MANUAL INPUT',
  'Daftar Top Scorer': 'Top Scorer List',
  'Nama, tim, dan jumlah gol sepenuhnya ditulis admin.': 'The admin enters the name, team, and goal total manually.',
  'Tambah pemain': 'Add Player',
  'Simpan Top Scorer': 'Save Top Scorers',
  'Nama pemain': 'Player Name',
  'Tim': 'Team',
  'Gol': 'Goals',
  'Hapus': 'Delete',
  'Memuat Top Scorer…': 'Loading Top Scorers…',
  'Top Scorer tersimpan dimuat.': 'Saved Top Scorers loaded.',
  'Belum ada Top Scorer. Tambahkan pemain secara manual.': 'No Top Scorers yet. Add players manually.',
  'PENGATURAN FISHING': 'FISHING SETTINGS',
  'TIM & PEMANCING': 'TEAMS & ANGLERS',
  'Tim & Pemancing': 'Teams & Anglers',
  'Nama tim tampil di atas, dua nama pemancing tampil di bawah.': 'The team name appears above its two anglers.',
  'Tambah tim': 'Add Team',
  'Simpan pasangan': 'Save Pairs',
  'Nama tim/departemen': 'Team/Department Name',
  'Pemancing 1': 'Angler 1',
  'Pemancing 2': 'Angler 2',
  'PERINGKAT & PEMENANG': 'RANKING & WINNER',
  'Skor Fishing': 'Fishing Scores',
  'Nama tim mengikuti daftar di atas. Admin hanya mengubah skor.': 'Team names follow the list above. The admin only changes scores.',
  'Simpan ranking': 'Save Ranking',
  'Skor': 'Score',
  'Memuat ranking…': 'Loading ranking…',
  'Memuat pasangan…': 'Loading pairs…',
  'Nama mengikuti Tim & Pemancing. Ubah skor saja.': 'Names follow Teams & Anglers. Change scores only.',
  'Semua tim dimuat dengan skor awal 0.': 'All teams loaded with an initial score of 0.',
  'Pasangan tersimpan dimuat.': 'Saved pairs loaded.',
  'Data awal pasangan siap disimpan.': 'Initial pair data is ready to save.',
  'PENGATURAN GALERI': 'GALLERY SETTINGS',
  'Tambah Foto': 'Add Photo',
  'File gambar': 'Image File',
  'Cabang olahraga': 'Sport',
  'Umum / Semua olahraga': 'General / All Sports',
  'Judul': 'Title',
  'Deskripsi gambar': 'Image Description',
  'Urutan': 'Order',
  'Status': 'Status',
  'Draft': 'Draft',
  'Published': 'Published',
  'Upload dan simpan': 'Upload and Save',
  'FOTO TERSIMPAN': 'SAVED PHOTOS',
  'Foto Tersimpan': 'Saved Photos',
  'Muat ulang': 'Reload',
  'Memuat foto…': 'Loading photos…',
  'Belum ada foto tersimpan.': 'No saved photos yet.',
  'Jadikan draft': 'Move to Draft',
  'Publish': 'Publish',
  'Edit': 'Edit',
  'PENGATURAN SAMBUTAN': 'GREETING SETTINGS',
  'Tambah Greeting': 'Add Greeting',
  'Foto': 'Photo',
  'Nama': 'Name',
  'Jabatan (Indonesia)': 'Position (Indonesian)',
  'Jabatan (English)': 'Position (English)',
  'Pesan (Indonesia)': 'Message (Indonesian)',
  'Pesan (English)': 'Message (English)',
  'Simpan Greeting': 'Save Greeting',
  'SAMBUTAN TERSIMPAN': 'SAVED GREETINGS',
  'Greeting Tersimpan': 'Saved Greetings',
  'Memuat greeting…': 'Loading greetings…',
  'Belum ada greeting tersimpan.': 'No saved greetings yet.',
  'PENGATURAN PESAN DUKUNGAN': 'SUPPORT MESSAGE SETTINGS',
  'Tambah Support': 'Add Support Message',
  'Nama pemberi dukungan': 'Supporter Name',
  'Tim / Departemen': 'Team / Department',
  'Label foto': 'Photo Label',
  'Simpan Support': 'Save Support Message',
  'PESAN DUKUNGAN TERSIMPAN': 'SAVED SUPPORT MESSAGES',
  'Support Tersimpan': 'Saved Support Messages',
  'Memuat support…': 'Loading support messages…',
  'Belum ada support tersimpan.': 'No saved support messages yet.',
  'Tanpa label': 'No label',
  'Contoh: PRODUCTION TEAM': 'Example: PRODUCTION TEAM',
  'Contoh: SPORTIVITAS': 'Example: SPORTSMANSHIP',
  'PENGATURAN PENGUMUMAN': 'ANNOUNCEMENT SETTINGS',
  'Tambah Pengumuman': 'Add Announcement',
  'Judul (Indonesia)': 'Title (Indonesian)',
  'Judul (English)': 'Title (English)',
  'Isi (Indonesia)': 'Content (Indonesian)',
  'Isi (English)': 'Content (English)',
  'Simpan Pengumuman': 'Save Announcement',
  'Batal edit': 'Cancel Edit',
  'PENGUMUMAN TERSIMPAN': 'SAVED ANNOUNCEMENTS',
  'Pengumuman Tersimpan': 'Saved Announcements',
  'Memuat pengumuman…': 'Loading announcements…',
  'Belum ada pengumuman tersimpan.': 'No saved announcements yet.',
}));

const enToId = new Map([...idToEn].map(([id, en]) => [en, id]));
let currentLanguage = localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'id';
let translationScheduled = false;

function translateValue(value, language) {
  const source = language === 'en' ? idToEn : enToId;
  return source.get(value.trim()) || value;
}

function translateTree(language) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)) continue;
    const trimmed = node.nodeValue.trim();
    if (!trimmed) continue;
    const translated = translateValue(trimmed, language);
    if (translated !== trimmed) node.nodeValue = node.nodeValue.replace(trimmed, translated);
  }
  document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(element => {
    for (const attribute of ['placeholder', 'aria-label', 'title']) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, translateValue(value, language));
    }
  });
  document.documentElement.lang = language;
  document.querySelectorAll('[data-admin-lang]').forEach(button => {
    button.classList.toggle('active', button.dataset.adminLang === language);
    button.setAttribute('aria-pressed', String(button.dataset.adminLang === language));
  });
}

function scheduleTranslation() {
  if (translationScheduled) return;
  translationScheduled = true;
  queueMicrotask(() => {
    translationScheduled = false;
    translateTree(currentLanguage);
  });
}

function createSwitcher() {
  if (document.querySelector('.admin-language-switcher')) return;
  const host = document.querySelector('.header-actions')
    || document.querySelector('main > header nav')
    || document.querySelector('main > header');
  if (!host) return;
  const switcher = document.createElement('div');
  switcher.className = 'admin-language-switcher';
  switcher.setAttribute('aria-label', 'Language / Bahasa');
  switcher.innerHTML = '<button type="button" data-admin-lang="id">ID</button><button type="button" data-admin-lang="en">EN</button>';
  switcher.addEventListener('click', event => {
    const button = event.target.closest('[data-admin-lang]');
    if (!button) return;
    currentLanguage = button.dataset.adminLang;
    localStorage.setItem(LANGUAGE_KEY, currentLanguage);
    translateTree(currentLanguage);
  });
  host.append(switcher);
}

export function initializeAdminI18n() {
  createSwitcher();
  translateTree(currentLanguage);
  new MutationObserver(scheduleTranslation).observe(document.body, { childList: true, subtree: true });
}
