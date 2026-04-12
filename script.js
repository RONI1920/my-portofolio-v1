(function () {
    'use strict';

    const GITHUB_USERNAME = 'RONI1920';
    const CACHE_KEY = 'github_data';
    const CACHE_TIME_KEY = 'github_data_timestamp';
    const ONE_HOUR = 60 * 60 * 1000;

    // --- THEME LOGIC ---
    const html = document.documentElement;
    const toggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('portfolio-theme', theme);
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
        }
    }

    const savedTheme = localStorage.getItem('portfolio-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    applyTheme(savedTheme);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // --- GITHUB DATA ---
    const repoGrid = document.getElementById('repo-grid');

    function renderRepo(repo) {
        const name = repo.name.replace(/-/g, ' ').replace(/_/g, ' ');
        const desc = repo.description ? `<p class="project-desc">${repo.description}</p>` : '<p class="project-desc" style="font-style:italic;opacity:0.6;">No description.</p>';
        const lang = repo.language ? `<span class="tag">${repo.language}</span>` : '';

        return `
            <article class="project-card">
                <div class="project-header">
                    <h3>${name}</h3>
                    <div class="project-tags">${lang}</div>
                </div>
                ${desc}
                <div class="project-links">
                    <a href="${repo.html_url}" target="_blank" class="link-text">GitHub →</a>
                </div>
            </article>`;
    }

    function updateStats(user) {
        const stats = {
            'stat-repos': user.public_repos,
            'stat-followers': user.followers,
            'stat-following': user.following
        };
        for (const [id, value] of Object.entries(stats)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value || '0';
        }
    }

    async function fetchGitHubData() {
        if (!repoGrid) return; // Guard clause

        const lastFetch = localStorage.getItem(CACHE_TIME_KEY);
        const cachedRepos = localStorage.getItem(CACHE_KEY);
        const cachedUser = localStorage.getItem('github_user_data');
        const now = new Date().getTime();

        if (cachedRepos && cachedUser && lastFetch && (now - lastFetch < ONE_HOUR)) {
            repoGrid.innerHTML = JSON.parse(cachedRepos).map(renderRepo).join('');
            updateStats(JSON.parse(cachedUser));
            return;
        }

        try {
            const [userRes, repoRes] = await Promise.all([
                fetch(`https://api.github.com/users/${GITHUB_USERNAME}`),
                fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=9`)
            ]);

            if (userRes.status === 403) throw new Error("API Limit reached.");
            if (!userRes.ok) throw new Error("User not found.");

            const userData = await userRes.json();
            const repoData = await repoRes.json();

            localStorage.setItem(CACHE_KEY, JSON.stringify(repoData));
            localStorage.setItem('github_user_data', JSON.stringify(userData));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());

            updateStats(userData);
            repoGrid.innerHTML = repoData.map(renderRepo).join('');

        } catch (err) {
            repoGrid.innerHTML = `<div class="repo-error">${err.message}</div>`;
            if (cachedRepos) repoGrid.innerHTML = JSON.parse(cachedRepos).map(renderRepo).join('');
        }
    }

    // --- HAMBURGER ---
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function () {
            const isOpen = hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
            mobileMenu.setAttribute('aria-hidden', String(!isOpen));
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileMenu.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
            });
        });
    }

    // --- SMOOTH SCROLL DENGAN JARAK HEADER DINAMIS ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Abaikan jika href hanya "#" (biasanya untuk back-to-top)
            if (this.getAttribute('href') === '#') return;

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (!targetElement) return;

            e.preventDefault();

            // Ambil tinggi header saat ini (otomatis menyesuaikan HP/Desktop)
            const header = document.querySelector('header');
            const headerHeight = header ? header.getBoundingClientRect().height : 0;

            // Hitung posisi elemen target dari atas dokumen
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerHeight;

            // Eksekusi scroll mulus
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });

            // Update URL hash tanpa membuat halaman melompat
            history.pushState(null, null, targetId);
        });
    });

    fetchGitHubData();

    // --- UTILS (Year, Scroll, Spy) ---
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    if (sections.length > 0 && navLinks.length > 0) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
                    });
                }
            });
        }, { rootMargin: '-30% 0px -60% 0px' });

        sections.forEach(s => observer.observe(s));
    }

    const backTop = document.querySelector('.back-top');
    if (backTop) {
        backTop.addEventListener('click', e => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

})();

// ==========================================
// 1. FUNGSI JAM REAL-TIME (VERSI ANALOG)
// ==========================================
function updateClock() {
    const now = new Date();

    // 1. AMBIL WAKTU SAAT INI
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours();

    // 2. LOGIKA JAM DIGITAL (Untuk Tampilan Mobile)
    // Menggunakan padStart agar tetap 2 digit (contoh: 09:05:01)
    const displayHours = String(hours).padStart(2, '0');
    const displayMinutes = String(minutes).padStart(2, '0');
    const displaySeconds = String(seconds).padStart(2, '0');

    const digitalEl = document.getElementById('digital-clock');
    if (digitalEl) {
        digitalEl.textContent = `${displayHours}:${displayMinutes}:${displaySeconds}`;
    }

    // 3. LOGIKA JAM ANALOG (Derajat Putaran)
    const secDeg = (seconds / 60) * 360;
    const minDeg = ((minutes / 60) * 360) + ((seconds / 60) * 6);
    const hourDeg = ((hours % 12) / 12) * 360 + ((minutes / 60) * 30);

    const secHand = document.getElementById('second-hand');
    const minHand = document.getElementById('minute-hand');
    const hourHand = document.getElementById('hour-hand');

    if (secHand) secHand.style.transform = `rotate(${secDeg}deg)`;
    if (minHand) minHand.style.transform = `rotate(${minDeg}deg)`;
    if (hourHand) hourHand.style.transform = `rotate(${hourDeg}deg)`;

    // 4. UPDATE TANGGAL
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('realtime-date');
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('id-ID', dateOptions);
    }
}

// Jalankan setiap detik
setInterval(updateClock, 1000);
// Panggil sekali di awal agar tidak menunggu 1 detik pertama
updateClock();


// ==========================================
// FUNGSI MEMBUAT ANGKA 1-12 DI JAM ANALOG
// ==========================================
function createClockNumbers() {
    const clock = document.querySelector('.analog-clock');
    if (!clock) return; // Cegah error jika jam tidak ditemukan

    for (let i = 1; i <= 12; i++) {
        const numberDiv = document.createElement('div');
        numberDiv.className = 'clock-number';
        numberDiv.textContent = i;

        // Rumus sakti: 
        // 1. Putar ke arah jam (misal jam 1 = 30 derajat)
        // 2. Dorong ke pinggir sejauh 44px
        // 3. Putar balik teksnya agar posisinya tetap tegak berdiri
        numberDiv.style.transform = `rotate(${i * 30}deg) translate(0, -44px) rotate(-${i * 30}deg)`;

        clock.appendChild(numberDiv);
    }
}

// Panggil fungsi ini SATU KALI saja saat web dimuat
createClockNumbers();

// Jalankan jam setiap 1 detik
setInterval(updateClock, 1000);
updateClock(); // Panggil saat web baru dibuka

// ==========================================
// 2. FUNGSI JADWAL SHALAT (DENGAN CACHE & IKON)
// ==========================================
async function fetchPrayerTimes() {
    const prayerListEl = document.getElementById('prayer-list');
    if (!prayerListEl) return;

    // Buat kunci unik berdasarkan tanggal hari ini (Contoh: "2026-04-08")
    const today = new Date().toISOString().split('T')[0];
    const CACHE_KEY = 'jadwal_shalat_data';
    const DATE_KEY = 'jadwal_shalat_tanggal';

    // CEK CACHE: Jika tanggal hari ini sama dengan yang disimpan, pakai data lokal!
    if (localStorage.getItem(DATE_KEY) === today && localStorage.getItem(CACHE_KEY)) {
        const cachedPrayers = JSON.parse(localStorage.getItem(CACHE_KEY));
        renderPrayers(cachedPrayers, prayerListEl);
        return; // Hentikan fungsi di sini, tidak perlu memanggil API lagi
    }

    // JIKA TIDAK ADA CACHE / GANTI HARI: Baru ambil dari server Aladhan
    const apiUrl = 'https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=11';

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Gagal mengambil data API");

        const data = await response.json();
        const timings = data.data.timings;

        // Daftar shalat beserta ikonnya
        const prayers = [
            { name: 'Subuh', time: timings.Fajr, icon: 'fa-person-praying' },
            { name: 'Dzuhur', time: timings.Dhuhr, icon: 'fa-sun' },
            { name: 'Ashar', time: timings.Asr, icon: 'fa-cloud-sun' },
            { name: 'Maghrib', time: timings.Maghrib, icon: 'fa-moon' },
            { name: 'Isya', time: timings.Isha, icon: 'fa-star-and-crescent' }
        ];

        // SIMPAN KE CACHE
        localStorage.setItem(DATE_KEY, today);
        localStorage.setItem(CACHE_KEY, JSON.stringify(prayers));

        // Tampilkan ke layar
        renderPrayers(prayers, prayerListEl);

    } catch (error) {
        prayerListEl.innerHTML = `<li style="color: #b94a3a;">Gagal memuat jadwal shalat.</li>`;
        console.error(error);
    }
}

function renderPrayers(prayers, container) {
    container.innerHTML = prayers.map(p => `
            <li class="prayer-item">
                <div class="prayer-info">
                    <i class="fa-solid ${p.icon} prayer-icon"></i>
                    <span class="prayer-name">${p.name}</span>
                </div>
                <span class="prayer-time">${p.time}</span>
            </li>
        `).join('');
}

async function initLiveStats() {
    const visitorEl = document.getElementById('live-visitors');
    const hitsEl = document.getElementById('total-hits');

    // Gunakan namespace unik, misalnya domain kamu
    const namespace = "ronihidayat.my.id";
    const key = "visits";

    try {
        // 1. Ambil & Tambah data Total Hits secara real
        const response = await fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`);
        const data = await response.json();

        if (data.value) {
            hitsEl.innerText = data.value.toLocaleString();
        }

        // 2. Simulasi Live Visitors (Karena statis tidak punya socket real-time)
        // Kita buat angka 1-5 agar terlihat ada aktivitas
        let currentVisitors = Math.floor(Math.random() * 3) + 2;
        visitorEl.innerText = currentVisitors;

        // Interval untuk membuat angka 'Live' bergerak sedikit
        setInterval(() => {
            const change = Math.floor(Math.random() * 3) - 1;
            currentVisitors = Math.max(1, currentVisitors + change);
            visitorEl.innerText = currentVisitors;

            visitorEl.classList.add('number-pulse');
            setTimeout(() => visitorEl.classList.remove('number-pulse'), 300);
        }, 5000);

    } catch (error) {
        // Fallback jika API sedang down
        hitsEl.innerText = "1,240";
        visitorEl.innerText = "1";
    }
}

function initDailyTracker() {
    const todayVisitorEl = document.getElementById('today-visitors');
    if (!todayVisitorEl) return;

    const today = new Date().toDateString(); // Contoh: "Thu Apr 09 2026"
    let stats = JSON.parse(localStorage.getItem('site_stats')) || { date: today, count: 0 };

    // Jika ganti hari, reset angka
    if (stats.date !== today) {
        stats = { date: today, count: 1 };
    } else {
        // Cek apakah user ini sudah dihitung hari ini (biar gak spam refresh)
        const hasVisited = sessionStorage.getItem('has_visited_today');
        if (!hasVisited) {
            stats.count += 1;
            sessionStorage.setItem('has_visited_today', 'true');
        }
    }

    localStorage.setItem('site_stats', JSON.stringify(stats));

    // Tampilkan angka (kita tambahkan angka dasar agar tidak mulai dari 1 banget)
    // Misalnya ditambah 12 agar terlihat sudah ada beberapa orang yang akses
    todayVisitorEl.innerText = (stats.count + 12).toLocaleString();
}

// Jalankan semua fungsi saat website terbuka
document.addEventListener('DOMContentLoaded', () => {
    // 1. Jalankan data GitHub (dari IIFE kamu yang sudah ada)
    // IIFE di awal file kamu sudah memanggil fetchGitHubData(), jadi aman.

    // 2. Aktifkan Tracker Pengunjung Harian (Metode Lokal)
    initDailyTracker();

    // 3. Aktifkan Simulasi Live Visitors
    initLiveStats();

    // 4. Update Jam & Jadwal Shalat
    updateClock();
    if (typeof fetchPrayerTimes === "function") {
        fetchPrayerTimes();
    }
});



const SUPABASE_URL = 'https://nkbqjdmiwmfbejbqsdyl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYnFqZG1pd21mYmVqYnFzZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTAxMzUsImV4cCI6MjA5MTU4NjEzNX0.-58DEvE2wD3Y1NJbqIBI0qjCZ51gKRZpcemkkvevrgo';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const feedbackForm = document.getElementById('feedback-form');
const feedbackList = document.getElementById('feedback-list');

// LOAD DATA
async function loadFeedback() {
    if (!feedbackList) return;

    const { data, error } = await supabaseClient
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        feedbackList.innerHTML = "<p>Gagal memuat feedback.</p>";
        console.error(error);
        return;
    }

    if (!data.length) {
        feedbackList.innerHTML = "<p>Belum ada saran.</p>";
        return;
    }

    feedbackList.innerHTML = data.map(item => `
        <div class="feedback-item">
            <strong>${item.name}</strong>
            <p>${item.message}</p>
        </div>
    `).join('');
}

// SUBMIT FORM (HANYA SATU!)
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('fb-name').value;
        const message = document.getElementById('fb-message').value;

        const { error } = await supabaseClient
            .from('feedback')
            .insert([{ name, message }]);

        if (error) {
            alert("Gagal: " + error.message);
            console.error(error);
            return;
        }

        alert("Berhasil!");
        feedbackForm.reset();
        loadFeedback();
    });
}

// LOAD AWAL
document.addEventListener('DOMContentLoaded', () => {
    loadFeedback();
});