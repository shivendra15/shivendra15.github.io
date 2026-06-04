// ============================================
// NAVIGATION & ANIMATIONS
// ============================================

let currentViewMode = 'scroll';
const isAdmin = window.location.search.includes('admin=true');

// Mobile Navigation Toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    if (currentViewMode === 'scroll') {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + current) {
                item.classList.add('active');
            }
        });
    }

    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Scroll animation (fade-in)
const fadeElements = document.querySelectorAll('.fade-in');
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

fadeElements.forEach(el => observer.observe(el));

// Smooth scroll / Page navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').replace('#', '');

        if (currentViewMode === 'paginated') {
            showPage(targetId, true);
        } else {
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});

// ============================================
// VISITOR COUNTER
// ============================================
function initVisitorCounter() {
    fetch('https://api.countapi.xyz/hit/people-eecs-berkeley-edu-ssparihar/visits')
        .then(res => res.json())
        .then(data => {
            const el = document.getElementById('visit-count');
            if (el) el.textContent = data.value.toLocaleString();
        })
        .catch(() => {
            const el = document.getElementById('visit-count');
            if (el) el.textContent = '';
        });
}