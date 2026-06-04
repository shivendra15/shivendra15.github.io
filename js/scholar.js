// ============================================
// GOOGLE SCHOLAR AUTO-FETCH SYSTEM
// ============================================

const SCHOLAR_CONFIG = {
    authorId: 'P2szTJwAAAAJ',
    authorName: 'Parihar',
    cacheKey: 'scholar_publications_P2szTJwAAAAJ',
    cacheDuration: 24 * 60 * 60 * 1000,
    proxyUrls: [
        'https://api.allorigins.win/get?url=',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://corsproxy.io/?',
    ],
    jsonPath: 'publications/publications.json',
    htmlFallbackPath: 'publications/publications_fallback.html'
};

let allPublications = [];
let currentFilter = 'all';
let localDataLoaded = false;

async function initScholarFetch() {
    await loadLocalData();
    fetchScholarInBackground();
}

async function loadLocalData() {
    const cached = getFromCache();
    if (cached && cached.publications && cached.publications.length > 0) {
        console.log('📦 Displaying from browser cache');
        displayScholarData(cached);
        localDataLoaded = true;
        return;
    }

    try {
        const response = await fetch(SCHOLAR_CONFIG.jsonPath);
        if (response.ok) {
            const data = await response.json();
            if (data.publications && data.publications.length > 0) {
                console.log('📄 Displaying from publications.json');
                displayScholarData({
                    citations: data.stats?.citations || '--',
                    hIndex: data.stats?.hIndex || '--',
                    i10Index: data.stats?.i10Index || '--',
                    publications: data.publications || []
                });
                localDataLoaded = true;
                return;
            }
        }
    } catch (e) { console.warn('JSON fallback not available:', e.message); }

    try {
        const response = await fetch(SCHOLAR_CONFIG.htmlFallbackPath);
        if (response.ok) {
            const htmlContent = await response.text();
            if (htmlContent && htmlContent.length > 100) {
                console.log('📄 Displaying from publications_fallback.html');
                document.getElementById('publications-list').innerHTML = htmlContent;
                const meta = document.getElementById('fallback-meta');
                if (meta) {
                    document.getElementById('stat-citations').textContent = meta.dataset.citations || '--';
                    document.getElementById('stat-hindex').textContent = meta.dataset.hindex || '--';
                    document.getElementById('stat-i10index').textContent = meta.dataset.i10index || '--';
                    document.getElementById('stat-journals').textContent = meta.dataset.journals || '--';
                    document.getElementById('stat-conferences').textContent = meta.dataset.conferences || '--';
                    document.getElementById('total-pub-count').textContent = meta.dataset.total || '--';
                    meta.style.display = 'none';
                }
                localDataLoaded = true;
                return;
            }
        }
    } catch (e) { console.warn('HTML fallback not available:', e.message); }

    console.log('📋 Displaying hardcoded publications');
    document.getElementById('publications-fallback').style.display = 'block';
    document.getElementById('publications-list').innerHTML = '';
    document.getElementById('total-pub-count').textContent = '39';
    document.getElementById('stat-journals').textContent = '22';
    document.getElementById('stat-conferences').textContent = '17';
    localDataLoaded = true;
}

async function fetchScholarInBackground() {
    const scholarURL = `https://scholar.google.com/citations?user=${SCHOLAR_CONFIG.authorId}&cstart=0&pagesize=100&sortby=pubdate`;

    for (let i = 0; i < SCHOLAR_CONFIG.proxyUrls.length; i++) {
        try {
            const proxyUrl = SCHOLAR_CONFIG.proxyUrls[i];
            const fetchUrl = `${proxyUrl}${encodeURIComponent(scholarURL)}`;
            console.log(`🔄 Background fetch: trying proxy ${i + 1}...`);

            const response = await fetch(fetchUrl, { signal: AbortSignal.timeout(15000) });
            let htmlContent;
            const data = await response.json ? await response.json() : await response.text();

            if (typeof data === 'object' && data.contents) { htmlContent = data.contents; }
            else if (typeof data === 'string') { htmlContent = data; }
            else { continue; }

            if (!htmlContent || htmlContent.length < 500) continue;

            const parsedData = parseScholarHTML(htmlContent);
            if (parsedData.publications.length > 0) {
                console.log(`✅ Background fetch successful: ${parsedData.publications.length} publications`);
                saveToCache(parsedData);
                displayScholarData(parsedData);
                document.getElementById('publications-fallback').style.display = 'none';
                document.getElementById('last-updated').textContent =
                    `Live from Google Scholar • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
                return;
            }
        } catch (error) {
            console.warn(`⚠️ Background proxy ${i + 1} failed:`, error.message);
            continue;
        }
    }

    console.log('ℹ️ Background Scholar fetch failed — local data remains displayed');
    const cacheRaw = localStorage.getItem(SCHOLAR_CONFIG.cacheKey);
    if (cacheRaw) {
        const { timestamp } = JSON.parse(cacheRaw);
        document.getElementById('last-updated').textContent =
            `From cache • ${new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    }
}

function parseScholarHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const result = { name: '', affiliation: '', citations: 0, hIndex: 0, i10Index: 0, publications: [] };

    const nameEl = doc.querySelector('#gsc_prf_in');
    if (nameEl) result.name = nameEl.textContent.trim();
    const affEl = doc.querySelector('.gsc_prf_il');
    if (affEl) result.affiliation = affEl.textContent.trim();

    const statRows = doc.querySelectorAll('#gsc_rsb_st tbody tr');
    if (statRows.length >= 3) {
        result.citations = parseInt(statRows[0].querySelectorAll('td')[1]?.textContent) || 0;
        result.hIndex = parseInt(statRows[1].querySelectorAll('td')[1]?.textContent) || 0;
        result.i10Index = parseInt(statRows[2].querySelectorAll('td')[1]?.textContent) || 0;
    }

    doc.querySelectorAll('#gsc_a_b .gsc_a_tr').forEach((row) => {
        const titleEl = row.querySelector('.gsc_a_at');
        const grayEls = row.querySelectorAll('.gs_gray');
        const yearEl = row.querySelector('.gsc_a_y span');
        const citEl = row.querySelector('.gsc_a_c a');

        if (titleEl) {
            result.publications.push({
                title: titleEl.textContent.trim(),
                authors: grayEls[0] ? grayEls[0].textContent.trim() : '',
                venue: grayEls[1] ? grayEls[1].textContent.trim() : '',
                year: yearEl ? yearEl.textContent.trim() : '',
                citations: citEl ? parseInt(citEl.textContent) || 0 : 0,
                link: titleEl.getAttribute('href') ? 'https://scholar.google.com' + titleEl.getAttribute('href') : '',
                type: classifyPublication(grayEls[1] ? grayEls[1].textContent.trim() : '')
            });
        }
    });
    return result;
}

function classifyPublication(venue) {
    const venueLower = (venue || '').toLowerCase();
    const confKw = ['conference', 'symposium', 'workshop', 'proceedings', 'meeting', 'congress', 'drc', 'edtm', 'iedm', 'vlsi', 'irps', 'nano', 'dac', 'upcon', 'mos-ak', 'vdat', 'icmc', 'iscas', 'date', 'isvlsi'];
    const jourKw = ['transactions', 'journal', 'letters', 'ieee trans', 'ieee electron', 'ieee open', 'npj'];
    for (let kw of confKw) { if (venueLower.includes(kw)) return 'conference'; }
    for (let kw of jourKw) { if (venueLower.includes(kw)) return 'journal'; }
    if (venueLower.includes('ieee') && !venueLower.includes('conf')) return 'journal';
    return 'journal';
}

function displayScholarData(data) {
    allPublications = data.publications;
    const journalCount = data.publications.filter(p => p.type === 'journal').length;
    const conferenceCount = data.publications.filter(p => p.type === 'conference').length;

    document.getElementById('stat-citations').textContent = data.citations || '--';
    document.getElementById('stat-hindex').textContent = data.hIndex || '--';
    document.getElementById('stat-i10index').textContent = data.i10Index || '--';
    document.getElementById('stat-journals').textContent = journalCount;
    document.getElementById('stat-conferences').textContent = conferenceCount;
    document.getElementById('total-pub-count').textContent = data.publications.length;
    renderPublications(data.publications);
}

function renderPublications(publications) {
    const container = document.getElementById('publications-list');
    if (!publications || publications.length === 0) return;
    document.getElementById('publications-fallback').style.display = 'none';

    const grouped = {};
    publications.forEach(pub => { const y = pub.year || 'Other'; if (!grouped[y]) grouped[y] = []; grouped[y].push(pub); });
    const sortedYears = Object.keys(grouped).sort((a, b) => { if (a === 'Other') return 1; if (b === 'Other') return -1; return parseInt(b) - parseInt(a); });

    let html = '';
    sortedYears.forEach(year => {
        html += `<div class="pub-year-group" data-year="${year}">`;
        html += `<div class="pub-year-label">${year} (${grouped[year].length} papers)</div>`;
        grouped[year].forEach(pub => {
            html += `<div class="pub-item-scholar" data-type="${pub.type}" data-searchable="${(pub.title + ' ' + pub.authors + ' ' + pub.venue).toLowerCase()}">
                <div class="pub-title-scholar">${pub.link ? `<a href="${pub.link}" target="_blank">${pub.title}</a>` : pub.title}</div>
                <div class="pub-authors-scholar">${highlightAuthorName(pub.authors)}</div>
                <div class="pub-venue-scholar">${pub.venue}</div>
                <div class="pub-meta-scholar">
                    ${pub.year ? `<span>📅 ${pub.year}</span>` : ''}
                    ${pub.citations > 0 ? `<span>📝 Cited: ${pub.citations}</span>` : ''}
                    ${pub.type ? `<span>📄 ${pub.type === 'journal' ? 'Journal' : 'Conference'}</span>` : ''}
                    ${pub.link ? `<span><a href="${pub.link}" target="_blank">🔗 Details</a></span>` : ''}
                </div></div>`;
        });
        html += '</div>';
    });
    container.innerHTML = html;
}

function highlightAuthorName(authors) {
    if (!authors) return '';
    const patterns = [/S\.?\s*S\.?\s*Parihar/gi, /SS\s*Parihar/gi, /Shivendra\s*Singh\s*Parihar/gi, /Shivendra\s*S\.?\s*Parihar/gi, /Parihar\s*S\.?\s*S\.?/gi];
    let result = authors;
    patterns.forEach(p => { result = result.replace(p, m => `<span class="author-bold">${m}</span>`); });
    return result;
}

function filterByType(type) {
    currentFilter = type;
    document.querySelectorAll('.pub-filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    const items = document.querySelectorAll('.pub-item-scholar');
    const yearGroups = document.querySelectorAll('.pub-year-group');
    items.forEach(item => { item.style.display = (type === 'all' || item.dataset.type === type) ? 'block' : 'none'; });
    yearGroups.forEach(group => {
        let visibleCount = 0;
        group.querySelectorAll('.pub-item-scholar').forEach(item => { if (item.style.display !== 'none') visibleCount++; });
        if (visibleCount > 0) { group.style.display = 'block'; const yl = group.querySelector('.pub-year-label'); if (yl) yl.textContent = `${group.dataset.year} (${visibleCount} ${visibleCount === 1 ? 'paper' : 'papers'})`; }
        else { group.style.display = 'none'; }
    });
}

function filterPublications() {
    const query = document.getElementById('pub-search').value.toLowerCase().trim();
    const items = document.querySelectorAll('.pub-item-scholar');
    const yearGroups = document.querySelectorAll('.pub-year-group');
    items.forEach(item => { const s = item.dataset.searchable || ''; item.style.display = ((!query || s.includes(query)) && (currentFilter === 'all' || item.dataset.type === currentFilter)) ? 'block' : 'none'; });
    yearGroups.forEach(group => {
        let visibleCount = 0;
        group.querySelectorAll('.pub-item-scholar').forEach(item => { if (item.style.display !== 'none') visibleCount++; });
        if (visibleCount > 0) { group.style.display = 'block'; const yl = group.querySelector('.pub-year-label'); if (yl) yl.textContent = `${group.dataset.year} (${visibleCount} ${visibleCount === 1 ? 'paper' : 'papers'})`; }
        else { group.style.display = 'none'; }
    });
}

function saveToCache(data) { try { localStorage.setItem(SCHOLAR_CONFIG.cacheKey, JSON.stringify({ timestamp: Date.now(), data })); } catch (e) {} }
function getFromCache() { try { const c = localStorage.getItem(SCHOLAR_CONFIG.cacheKey); if (!c) return null; const { timestamp, data } = JSON.parse(c); if (Date.now() - timestamp > SCHOLAR_CONFIG.cacheDuration) { localStorage.removeItem(SCHOLAR_CONFIG.cacheKey); return null; } return data; } catch (e) { return null; } }

// Admin export functions
function exportPublicationsJSON() {
    if (allPublications.length === 0) { alert('⚠️ No publications fetched yet.'); return; }
    const exportData = { lastUpdated: new Date().toISOString(), authorId: SCHOLAR_CONFIG.authorId, authorName: 'Shivendra Singh Parihar', stats: { citations: document.getElementById('stat-citations').textContent, hIndex: document.getElementById('stat-hindex').textContent, i10Index: document.getElementById('stat-i10index').textContent, totalPublications: allPublications.length, journals: allPublications.filter(p => p.type === 'journal').length, conferences: allPublications.filter(p => p.type === 'conference').length }, publications: allPublications };
    downloadFile(JSON.stringify(exportData, null, 2), 'publications.json', 'application/json');
    alert(`✅ Exported ${allPublications.length} publications!\n\n📁 Save as: publications/publications.json`);
}

function exportPublicationsHTML() {
    if (allPublications.length === 0) { alert('⚠️ No publications fetched yet.'); return; }
    const journals = allPublications.filter(p => p.type === 'journal');
    const conferences = allPublications.filter(p => p.type === 'conference');
    const cit = document.getElementById('stat-citations').textContent;
    const hi = document.getElementById('stat-hindex').textContent;
    const i10 = document.getElementById('stat-i10index').textContent;

    let html = `<!-- AUTO-GENERATED: ${new Date().toISOString()} -->\n<div id="fallback-meta" data-citations="${cit}" data-hindex="${hi}" data-i10index="${i10}" data-journals="${journals.length}" data-conferences="${conferences.length}" data-total="${allPublications.length}"></div>\n\n`;
    html += `<div class="pub-category">\n<h3><i class="fas fa-book"></i> Journal Papers (${journals.length})</h3>\n`;
    journals.forEach(pub => { html += `<div class="pub-item"><p>${makeAuthorHighlight(pub.authors)}, <span class="pub-title">"${escapeHtml(pub.title)},"</span> <span class="pub-venue">${escapeHtml(pub.venue)}</span>${pub.year ? ', ' + pub.year : ''}.${pub.link ? ' <a href="' + pub.link + '" class="pub-doi" target="_blank">Link</a>' : ''}</p></div>\n`; });
    html += `</div>\n\n<div class="pub-category">\n<h3><i class="fas fa-users"></i> Conference Papers (${conferences.length})</h3>\n`;
    conferences.forEach(pub => { html += `<div class="pub-item"><p>${makeAuthorHighlight(pub.authors)}, <span class="pub-title">"${escapeHtml(pub.title)},"</span> <span class="pub-venue">${escapeHtml(pub.venue)}</span>${pub.year ? ', ' + pub.year : ''}.${pub.link ? ' <a href="' + pub.link + '" class="pub-doi" target="_blank">Link</a>' : ''}</p></div>\n`; });
    html += `</div>\n`;
    downloadFile(html, 'publications_fallback.html', 'text/html');
    alert(`✅ Exported HTML fallback!\n\n📁 Save as: publications/publications_fallback.html`);
}

function makeAuthorHighlight(authors) { if (!authors) return ''; return authors.replace(/S\.?\s*S\.?\s*Parihar|SS\s*Parihar|Shivendra\s*S(?:ingh)?\.?\s*Parihar/gi, m => `<span class="author-highlight">${m}</span>`); }
function escapeHtml(text) { if (!text) return ''; return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function downloadFile(content, filename, mimeType) { const blob = new Blob([content], { type: mimeType }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }