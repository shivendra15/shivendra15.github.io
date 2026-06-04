// ============================================
// VIEW MODE: SCROLL vs PAGINATED (Admin Only)
// ============================================

// function initViewMode() {
//     if (isAdmin) {
//         const toggle = document.getElementById('viewToggle');
//         if (toggle) toggle.classList.add('visible');

//         const saved = localStorage.getItem('viewMode');
//         if (saved === 'paginated') {
//             setViewMode('paginated', false);
//         }
//     }
// }

// ============================================
// CHANGE THIS LINE TO SWITCH MODE FOR ALL VISITORS
// Options: 'scroll' or 'paginated'
// ============================================

// // // // For scroll mode (current):
// const DEFAULT_VIEW_MODE = 'scroll';

// // To switch to paginated:
const DEFAULT_VIEW_MODE = 'paginated';

function initViewMode() {
    // Apply the default mode for all visitors
    setViewMode(DEFAULT_VIEW_MODE, false);

    // Show toggle only for admin
    if (isAdmin) {
        const toggle = document.getElementById('viewToggle');
        if (toggle) toggle.classList.add('visible');
    }
}

function setViewMode(mode, animate = true) {
    currentViewMode = mode;
    localStorage.setItem('viewMode', mode);

    const body = document.body;
    const btnScroll = document.getElementById('btnScrollMode');
    const btnPage = document.getElementById('btnPageMode');
    const label = document.getElementById('viewToggleLabel');

    if (mode === 'paginated') {
        body.classList.add('paginated-mode');
        btnScroll.classList.remove('active');
        btnPage.classList.add('active');
        label.textContent = 'Pages';

        const activeLink = document.querySelector('.nav-links a.active');
        const targetId = activeLink ? activeLink.getAttribute('href').replace('#', '') : 'home';
        showPage(targetId, animate);
    } else {
        body.classList.remove('paginated-mode');
        btnScroll.classList.add('active');
        btnPage.classList.remove('active');
        label.textContent = 'Scroll';

        document.querySelectorAll('.section, .hero').forEach(s => {
            s.classList.remove('active-page', 'page-entering');
        });

        document.querySelector('.footer').classList.remove('footer-visible');
    }
}

function showPage(pageId, animate = true) {
    document.querySelectorAll('.section, .hero').forEach(s => {
        s.classList.remove('active-page', 'page-entering');
    });

    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active-page');
        if (animate) target.classList.add('page-entering');
        target.scrollTop = 0;
        window.scrollTo(0, 0);
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + pageId) {
            link.classList.add('active');
        }
    });

    // // -- Uncomment if you want to see footer only after gallery
    
    // const footer = document.querySelector('.footer');
    // if (pageId === 'gallery') {
    //     footer.classList.add('footer-visible');
    // } else {
    //     footer.classList.remove('footer-visible');
    // }
}