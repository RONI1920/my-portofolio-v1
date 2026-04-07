(function () {
    'use strict';

    const GITHUB_USERNAME = 'RONI1920';
    const CACHE_KEY = 'github_data';
    const CACHE_TIME_KEY = 'github_data_timestamp';
    const ONE_HOUR = 60 * 60 * 1000; // 1 Jam dalam milidetik

    // ── THEME (Tetap Sama) ──────────────────────────────────
    const html = document.documentElement;
    const toggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    function applyTheme(theme) {
        // Ini yang membuat CSS kamu bekerja!
        html.setAttribute('data-theme', theme);
        localStorage.setItem('portfolio-theme', theme);

        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
        }
    }

    // Jalankan saat halaman pertama kali dibuka
    const savedTheme = localStorage.getItem('portfolio-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    applyTheme(savedTheme);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }

    // ── GITHUB DATA LOGIC WITH CACHING ────────────────────────
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
        if (document.getElementById('stat-repos')) document.getElementById('stat-repos').textContent = user.public_repos || '0';
        if (document.getElementById('stat-followers')) document.getElementById('stat-followers').textContent = user.followers || '0';
        if (document.getElementById('stat-following')) document.getElementById('stat-following').textContent = user.following || '0';
    }

    async function fetchGitHubData() {
        const lastFetch = localStorage.getItem(CACHE_TIME_KEY);
        const cachedRepos = localStorage.getItem(CACHE_KEY);
        const cachedUser = localStorage.getItem('github_user_data');
        const now = new Date().getTime();

        // CEK CACHE: Jika data ada dan belum 1 jam, gunakan cache
        if (cachedRepos && cachedUser && lastFetch && (now - lastFetch < ONE_HOUR)) {
            console.log("Mengambil data dari cache browser...");
            repoGrid.innerHTML = JSON.parse(cachedRepos).map(renderRepo).join('');
            updateStats(JSON.parse(cachedUser));
            return;
        }

        // FETCH BARU: Jika tidak ada cache atau sudah kadaluarsa
        try {
            console.log("Mengambil data baru dari GitHub API...");
            const [userRes, repoRes] = await Promise.all([
                fetch(`https://api.github.com/users/${GITHUB_USERNAME}`),
                fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=9`)
            ]);

            if (userRes.status === 403 || repoRes.status === 403) {
                throw new Error("Limit tercapai (403). Tunggu 1 jam.");
            }

            const userData = await userRes.json();
            const repoData = await repoRes.json();

            // Simpan ke LocalStorage
            localStorage.setItem(CACHE_KEY, JSON.stringify(repoData));
            localStorage.setItem('github_user_data', JSON.stringify(userData));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());

            // Update Tampilan
            updateStats(userData);
            repoGrid.innerHTML = repoData.map(renderRepo).join('');

        } catch (err) {
            repoGrid.innerHTML = `<div class="repo-error">${err.message}</div>`;
            // Jika error tapi ada cache lama, tampilkan saja yang lama
            if (cachedRepos) repoGrid.innerHTML = JSON.parse(cachedRepos).map(renderRepo).join('');
        }
    }

    fetchGitHubData();

    // ── YEAR & SCROLL (Tetap Sama) ──────────────────────────
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ── SMOOTH SCROLL ──────────────────────────────────────
    // Membuat perpindahan antar seksi terasa halus (smooth)
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = anchor.getAttribute('href');
            const target = document.querySelector(targetId);

            if (!target) return;

            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Update URL tanpa reload (opsional)
            history.pushState(null, null, targetId);
        });
    });

    // ── SCROLL SPY ─────────────────────────────────────────
    // Memberikan highlight pada menu navigasi sesuai posisi scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    const observerOptions = {
        root: null,
        rootMargin: '-30% 0px -60% 0px', // Trigger saat seksi berada di tengah layar
        threshold: 0
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                navLinks.forEach(function (link) {
                    const isActive = link.getAttribute('href') === '#' + entry.target.id;

                    // Menambahkan styling aktif
                    if (isActive) {
                        link.classList.add('active'); // Pastikan kamu punya class .active di CSS
                        link.style.color = 'var(--text)'; // Fallback jika tidak pakai class
                        link.style.fontWeight = 'bold';
                    } else {
                        link.classList.remove('active');
                        link.style.color = '';
                        link.style.fontWeight = '';
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(function (s) {
        observer.observe(s);
    });

    // ── BACK TO TOP ────────────────────────────────────────
    const backTop = document.querySelector('.back-top');
    if (backTop) {
        backTop.addEventListener('click', function (e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

})();