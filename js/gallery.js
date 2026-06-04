// ============================================
// LIGHTBOX / GALLERY SYSTEM
// ============================================

const GALLERY_DATA = {
    'bsimgrp': {
        title: 'BSIM, UC Berkeley',
        subtitle: 'BSIM Group',
        images: [
            './gallery/bsimgrp/group_Aug2025.jpeg',
            './gallery/bsimgrp/nanolab_2.jpeg',
            './gallery/bsimgrp/nanolab_3.jpeg'
        ]
    },
    'drc_2023': {
        title: 'Device Research Conference 2023',
        subtitle: 'Santa Barbara, CA, USA',
        images: [
            './gallery/drc_2023/drc2023_4.jpeg',
            './gallery/drc_2023/drc2023_5.jpeg',
            './gallery/drc_2023/drc2023_3.jpeg',
            './gallery/drc_2023/drc2023_2.jpeg',
            './gallery/drc_2023/drc2023_1.jpeg'
        ]
    },
    'edtm_2024': {
        title: 'IEEE EDTM 2024',
        subtitle: 'Bangalore, India',
        images: [
            './gallery/edtm_2024/chenming_shivendra.jpeg',
            './gallery/edtm_2024/edtm2024_1.jpeg',
            './gallery/edtm_2024/edtm2024_2.jpeg',
            './gallery/edtm_2024/edtm2024_3.jpeg',
            './gallery/edtm_2024/edtm2024_4.jpeg',
            './gallery/edtm_2024/edtm2024_5.jpeg',
            './gallery/edtm_2024/edtm2024_6.jpeg',
            './gallery/edtm_2024/edtm2024_7.jpeg'
        ]
    },
    'meas_lab': {
        title: 'On-Wafer Characterization',
        subtitle: 'Measurement Lab',
        images: [
            './gallery/meas_lab/probesystem.jpeg',
            './gallery/meas_lab/measlab_1.jpeg'
        ]
    },

    'cmc': {
        title: 'Dec 2025 Q4 Meeting',
        subtitle: 'Compact Model Coalition',  // default subtitle
        images: [
            { src: './gallery/cmc/cmc2025_1.jpeg', caption: 'Group Photo', subtitle: 'Santa Clara, CA, USA' },
            { src: './gallery/cmc/cmc2025_2.jpeg', caption: 'BSIM Developers', subtitle: 'Santa Clara, CA, USA' },
            { src: './gallery/cmc/cmc2025_3.jpeg', caption: 'BSIM Developers', subtitle: 'Santa Clara, CA, USA' },
            { src: './gallery/cmc/cmc2025_4.jpeg', caption: 'BSIM Developers', subtitle: 'Santa Clara, CA, USA' },
            { src: './gallery/cmc/cmc2025_5.jpeg', caption: 'Emails are good, but dining together is better', subtitle: 'Santa Clara, CA, USA' }
        ]
    },
    // 'teaching': {
    //     title: 'Teaching',
    //     subtitle: 'IIT Kanpur',
    //     images: [
    //         { src: './gallery/teaching/teaching_1.jpeg', caption: 'Electronics lab tutorial session' },
    //         { src: './gallery/teaching/teaching_2.jpeg', caption: 'Demonstrating oscilloscope measurements' }
    //     ]
    // },
    'iitkteam': {
        title: 'YSC Research Group',
        subtitle: 'Nanolab Team',
        images: [
            { src: './gallery/iitkteam/2019jan-1.jpeg', caption: 'Nanolab group photo, 2019' },
            { src: './gallery/iitkteam/2020jan-1.jpeg', caption: 'Nanolab group photo, 2020' },
            { src: './gallery/iitkteam/2020jan-2.jpeg', caption: 'Nanolab group photo, 2020' },
            { src: './gallery/iitkteam/2020jan-3.jpeg', caption: 'Nanolab group photo, 2020' },
            { src: './gallery/iitkteam/2021_Nov_1.jpeg', caption: 'Nanolab group photo, 2021' },
            { src: './gallery/iitkteam/2021_Nov_2.jpeg', caption: 'Nanolab group photo, 2021' },
            { src: './gallery/iitkteam/2021_Nov_3.jpeg', caption: 'Nanolab group photo, 2021' },
            { src: './gallery/iitkteam/2021_Nov_4.jpeg', caption: 'Nanolab group photo, 2021' },
            { src: './gallery/iitkteam/2021_Nov_5.jpeg', caption: 'Nanolab group photo, 2021' }
        ]
    }
};

let currentLightboxKey = '';
let currentLightboxIndex = 0;

function openLightbox(key) {
    const data = GALLERY_DATA[key];
    if (!data || !data.images || data.images.length === 0) return;

    currentLightboxKey = key;
    currentLightboxIndex = 0;

    const modal = document.getElementById('lightboxModal');
    if (data.images.length <= 1) {
        modal.classList.add('lightbox-single');
    } else {
        modal.classList.remove('lightbox-single');
    }

    updateLightboxImage();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('lightboxModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function lightboxNext() {
    const data = GALLERY_DATA[currentLightboxKey];
    if (!data) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % data.images.length;
    updateLightboxImage();
}

function lightboxPrev() {
    const data = GALLERY_DATA[currentLightboxKey];
    if (!data) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + data.images.length) % data.images.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const data = GALLERY_DATA[currentLightboxKey];
    if (!data) return;

    const imgData = data.images[currentLightboxIndex];
    const imgContainer = document.getElementById('lightbox-img-container');
    const captionTitle = document.getElementById('lightbox-caption-title');
    const captionSub = document.getElementById('lightbox-caption-sub');
    const counter = document.getElementById('lightbox-counter');
    const dotsContainer = document.getElementById('lightbox-dots');

    const imgSrc = typeof imgData === 'string' ? imgData : imgData.src;
    const imgCaption = typeof imgData === 'object' && imgData.caption ? imgData.caption : '';
    const imgSubtitle = typeof imgData === 'object' && imgData.subtitle ? imgData.subtitle : data.subtitle;

    // Use background-image instead of <img> tag
    imgContainer.style.backgroundImage = `url('${imgSrc}')`;
    imgContainer.setAttribute('aria-label', imgCaption || data.title);

    captionTitle.textContent = imgCaption || data.title;
    captionSub.textContent = imgCaption ? `${data.title} — ${imgSubtitle}` : imgSubtitle;
    counter.textContent = `${currentLightboxIndex + 1} / ${data.images.length}`;

    dotsContainer.innerHTML = '';
    data.images.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'lightbox-dot' + (i === currentLightboxIndex ? ' active' : '');
        dot.onclick = () => { currentLightboxIndex = i; updateLightboxImage(); };
        dotsContainer.appendChild(dot);
    });
}

document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('lightboxModal');
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') lightboxNext();
    if (e.key === 'ArrowLeft') lightboxPrev();
});

// ============================================
// IMAGE PROTECTION (deterrent only)
// ============================================

// Disable right-click on gallery and lightbox areas
document.addEventListener('contextmenu', function(e) {
    if (e.target.closest('.gallery-item') || e.target.closest('.lightbox-modal')) {
        e.preventDefault();
    }
});

// Disable drag on gallery items
document.addEventListener('dragstart', function(e) {
    if (e.target.closest('.gallery-item') || e.target.closest('.lightbox-modal')) {
        e.preventDefault();
    }
});