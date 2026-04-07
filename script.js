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

// --- PRAYER TIMES API (Aladhan) DENGAN CACHE ---
    async function fetchPrayerTimes() {
        const prayerListEl = document.getElementById('prayer-list');
        
        // Buat kunci unik berdasarkan tanggal hari ini (Contoh: "2026-04-08")
        const today = new Date().toISOString().split('T')[0];
        const CACHE_KEY = 'jadwal_shalat_data';
        const DATE_KEY = 'jadwal_shalat_tanggal';

        // 1. CEK CACHE: Jika tanggal hari ini sama dengan yang disimpan, pakai data lokal!
        if (localStorage.getItem(DATE_KEY) === today && localStorage.getItem(CACHE_KEY)) {
            const cachedPrayers = JSON.parse(localStorage.getItem(CACHE_KEY));
            renderPrayers(cachedPrayers, prayerListEl);
            return; // Hentikan fungsi di sini, tidak perlu memanggil API lagi
        }

        // 2. JIKA TIDAK ADA CACHE / GANTI HARI: Baru ambil dari server Aladhan
        const apiUrl = 'https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=11';

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Gagal mengambil data API");
            
            const data = await response.json();
            const timings = data.data.timings;

            const prayers = [
                { name: 'Subuh', time: timings.Fajr },
                { name: 'Dzuhur', time: timings.Dhuhr },
                { name: 'Ashar', time: timings.Asr },
                { name: 'Maghrib', time: timings.Maghrib },
                { name: 'Isya', time: timings.Isha }
            ];

            // 3. SIMPAN KE CACHE: Simpan tanggal dan data jadwal ke browser pengguna
            localStorage.setItem(DATE_KEY, today);
            localStorage.setItem(CACHE_KEY, JSON.stringify(prayers));

            // Tampilkan ke layar
            renderPrayers(prayers, prayerListEl);

        } catch (error) {
            prayerListEl.innerHTML = `<li style="color: #b94a3a;">Gagal memuat jadwal shalat.</li>`;
            console.error(error);
        }
    }

    // Fungsi kecil untuk menampilkan HTML agar kode lebih rapi
    function renderPrayers(prayers, container) {
        container.innerHTML = prayers.map(p => `
            <li class="prayer-item">
                <span class="prayer-name">${p.name}</span>
                <span class="prayer-time">${p.time}</span>
            </li>
        `).join('');
    }

    // Panggil fungsinya
    fetchPrayerTimes();
