import { faqCards } from './assets/faq/cards.js';

// This optional feature owns its markup, styles, data and event handlers.
const mount = document.getElementById('faq');
if (mount) {
  loadFAQ().catch(() => {
    // Preserve the static PDF link if the optional fragment cannot be loaded.
    mount.dataset.faqState = 'unavailable';
  });
}

async function loadFAQ() {
  const response = await fetch(new URL('./faq.html?v=faq-2', import.meta.url));
  if (!response.ok) throw new Error('FAQ fragment unavailable');
  const template = document.createElement('template');
  template.innerHTML = await response.text();
  mount.replaceChildren(template.content.cloneNode(true));
  initializeFAQ(mount);
  mount.dataset.faqState = 'ready';
}

function initializeFAQ(root) {
  const byId = (id) => root.querySelector(`#${id}`);
  const search = byId('faq-search');
  const filters = [...root.querySelectorAll('.faq-filters button')];
  const status = byId('faq-status');
  const empty = byId('faq-empty');
  const reader = byId('faq-reader');
  const readerBody = byId('faq-reader-body');
  const image = byId('faq-reader-image');
  const imageError = byId('faq-image-error');
  const zoom = byId('faq-zoom');
  const fullscreen = byId('faq-fullscreen');
  const previous = byId('faq-card-prev');
  const next = byId('faq-card-next');
  const pageNumber = byId('faq-page-number');
  const help = byId('faq-reader-help');
  const normalize = (text) => text.normalize('NFKC').toLocaleLowerCase().replace(/[\s_·-]+/g, '');
  const categoryKeywords = {
    project: '프로젝트 전반 아이캔두 ICanDo 캔위성 CanSat 오픈소스',
    engineering: '설계와 기술 설계 개발 하드웨어',
    education: '실험과 교육 멘토링 중학생',
  };
  const searchable = new Map(faqCards.map((card) => [card.id, normalize(`${card.id} ${card.title} ${card.topic} ${categoryKeywords[card.category]}`)]));
  let category = 'all';
  let filtered = faqCards;
  let index = 0;
  let touchStart = null;

  function resetZoom() {
    readerBody.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.textContent = '확대해서 읽기 ＋';
    help.textContent = '한 장씩 천천히 읽어보세요. 뷰어에서 ← → 키로도 넘길 수 있어요.';
    readerBody.scrollTo(0, 0);
  }

  function showPage() {
    reader.hidden = filtered.length === 0;
    empty.hidden = filtered.length > 0;
    for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.category === category));
    if (!filtered.length) {
      status.textContent = '검색 결과 0개';
      image.removeAttribute('src');
      return;
    }
    index = Math.max(0, Math.min(index, filtered.length - 1));
    const card = filtered[index];
    resetZoom();
    imageError.hidden = true;
    image.hidden = false;
    image.alt = `${card.topic}: ${card.title} — 원본 질문과 답변`;
    image.src = `assets/faq/${card.id}.jpg`;
    byId('faq-reader-topic').textContent = `${card.topic} · ${card.id}`;
    byId('faq-reader-title').textContent = card.title;
    byId('faq-original').href = image.src;
    status.textContent = `${filtered.length}개의 질문 · ${index + 1}번째 페이지`;
    pageNumber.value = String(index + 1);
    pageNumber.max = String(filtered.length);
    byId('faq-page-count').textContent = String(filtered.length);
    previous.disabled = index === 0;
    next.disabled = index === filtered.length - 1;
    if (document.activeElement === previous && previous.disabled) next.focus({ preventScroll: true });
    if (document.activeElement === next && next.disabled) previous.focus({ preventScroll: true });
  }

  function filter() {
    const terms = search.value.trim().split(/\s+/).filter(Boolean).map(normalize);
    filtered = faqCards.filter((card) => (category === 'all' || card.category === category)
      && terms.every((term) => searchable.get(card.id).includes(term)));
    index = 0;
    showPage();
  }

  function turnPage(delta) {
    if (index + delta < 0 || index + delta >= filtered.length) return;
    index += delta;
    showPage();
  }

  search.addEventListener('input', filter);
  for (const button of filters) button.addEventListener('click', () => {
    category = button.dataset.category;
    filter();
  });
  byId('faq-reset').addEventListener('click', () => {
    search.value = '';
    category = 'all';
    filter();
    search.focus({ preventScroll: true });
  });
  previous.addEventListener('click', () => turnPage(-1));
  next.addEventListener('click', () => turnPage(1));
  byId('faq-page-jump').addEventListener('submit', (event) => {
    event.preventDefault();
    const value = Number(pageNumber.value);
    if (!Number.isInteger(value) || value < 1 || value > filtered.length) return;
    index = value - 1;
    showPage();
  });
  reader.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, select') || readerBody.classList.contains('is-zoomed')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); turnPage(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); turnPage(1); }
    if (event.key === 'Home') { event.preventDefault(); index = 0; showPage(); }
    if (event.key === 'End') { event.preventDefault(); index = filtered.length - 1; showPage(); }
  });
  zoom.addEventListener('click', () => {
    const expanded = readerBody.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(expanded));
    zoom.textContent = expanded ? '화면에 맞추기 －' : '확대해서 읽기 ＋';
    help.textContent = expanded ? '확대한 페이지를 좌우·위아래로 밀어 읽을 수 있어요.' : '한 장씩 천천히 읽어보세요. 뷰어에서 ← → 키로도 넘길 수 있어요.';
    readerBody.scrollTo(0, 0);
  });
  if (document.fullscreenEnabled && reader.requestFullscreen) {
    fullscreen.hidden = false;
    fullscreen.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement === reader) await document.exitFullscreen();
        else await reader.requestFullscreen();
      } catch {
        help.textContent = '이 브라우저에서는 전체화면을 열 수 없어요. 확대 또는 원본 열기를 이용해 주세요.';
      }
    });
    reader.addEventListener('fullscreenchange', () => {
      fullscreen.textContent = document.fullscreenElement === reader ? '전체화면 닫기 ↙' : '전체화면 ↗';
    });
  }
  readerBody.addEventListener('pointerdown', (event) => {
    touchStart = event.pointerType === 'touch' && !readerBody.classList.contains('is-zoomed')
      ? { x: event.clientX, y: event.clientY, id: event.pointerId } : null;
  });
  readerBody.addEventListener('pointerup', (event) => {
    if (!touchStart || event.pointerId !== touchStart.id) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) turnPage(dx < 0 ? 1 : -1);
  });
  readerBody.addEventListener('pointercancel', () => { touchStart = null; });
  image.addEventListener('error', () => {
    if (!image.hasAttribute('src')) return;
    image.hidden = true;
    imageError.hidden = false;
  });
  byId('faq-retry').addEventListener('click', showPage);

  showPage();
  byId('faq-app').hidden = false;
}
