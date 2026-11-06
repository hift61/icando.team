import { faqCards } from './assets/faq/cards.js';

const byId = (id) => document.getElementById(id);
const app = byId('faq-app');
const search = byId('faq-search');
const filters = [...document.querySelectorAll('.faq-filters button')];
const grid = byId('faq-results');
const status = byId('faq-status');
const empty = byId('faq-empty');
const pagination = byId('faq-pagination');
const pageStatus = byId('faq-page-status');
const previousPage = byId('faq-page-prev');
const nextPage = byId('faq-page-next');
const reader = byId('faq-reader');
const readerBody = byId('faq-reader-body');
const readerImage = byId('faq-reader-image');
const imageError = byId('faq-image-error');
const zoom = byId('faq-zoom');
const previousCard = byId('faq-card-prev');
const nextCard = byId('faq-card-next');
const pageSize = 6;
const normalize = (text) => text.normalize('NFKC').toLocaleLowerCase().replace(/[\s_·-]+/g, '');
const categoryKeywords = {
  project: '프로젝트 전반 아이캔두 ICanDo 캔위성 CanSat 오픈소스',
  engineering: '설계와 기술 설계 개발 하드웨어',
  education: '실험과 교육 멘토링 중학생',
};
const searchable = new Map(faqCards.map((card) => [card.id, normalize(`${card.id} ${card.title} ${card.topic} ${categoryKeywords[card.category]}`)]));
let category = 'all';
let page = 0;
let filtered = faqCards;
let cardIndex = 0;
let previousOverflow = '';

function render() {
  const terms = search.value.trim().split(/\s+/).filter(Boolean).map(normalize);
  filtered = faqCards.filter((card) => (category === 'all' || card.category === category)
    && terms.every((term) => searchable.get(card.id).includes(term)));
  const pages = Math.ceil(filtered.length / pageSize);
  page = Math.min(page, Math.max(0, pages - 1));
  const start = page * pageSize;
  const fragment = document.createDocumentFragment();
  for (const [offset, card] of filtered.slice(start, start + pageSize).entries()) {
    const item = document.createElement('li');
    item.className = 'faq-card';
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.cardId = card.id;
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'faq-reader');
    const image = document.createElement('img');
    image.src = `assets/faq/thumbs/${card.id}.webp`;
    image.alt = '';
    image.width = 640;
    image.height = 360;
    image.loading = 'lazy';
    image.decoding = 'async';
    const copy = document.createElement('span');
    copy.className = 'faq-card-copy';
    const meta = document.createElement('span');
    meta.className = 'faq-card-meta';
    const topic = document.createElement('span');
    topic.textContent = card.topic;
    const id = document.createElement('span');
    id.className = 'faq-card-id';
    id.textContent = card.id;
    meta.append(topic, id);
    const title = document.createElement('span');
    title.className = 'faq-card-title';
    title.textContent = card.title;
    const open = document.createElement('span');
    open.className = 'faq-card-open';
    open.textContent = '답변 읽기 ↗';
    copy.append(meta, title, open);
    button.append(image, copy);
    button.addEventListener('click', () => openCard(start + offset));
    item.append(button);
    fragment.append(item);
  }
  grid.replaceChildren(fragment);
  status.textContent = filtered.length ? `${filtered.length}개의 질문 · ${start + 1}–${Math.min(start + pageSize, filtered.length)}번째` : '검색 결과 0개';
  empty.hidden = filtered.length > 0;
  pagination.hidden = pages < 2;
  previousPage.disabled = page === 0;
  nextPage.disabled = page >= pages - 1;
  pageStatus.textContent = pages ? `${page + 1} / ${pages}` : '';
  for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.category === category));
}

function changePage(delta) {
  page += delta;
  render();
  // A boundary can disable the button just pressed. Keep keyboard focus usable.
  if (document.activeElement.disabled) (delta > 0 ? previousPage : nextPage).focus({ preventScroll: true });
  grid.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

function resetZoom() {
  readerBody.classList.remove('is-zoomed');
  zoom.setAttribute('aria-pressed', 'false');
  zoom.textContent = '확대해서 읽기 ＋';
  readerBody.scrollTo(0, 0);
}

function showCard(index) {
  cardIndex = index;
  const card = filtered[cardIndex];
  resetZoom();
  imageError.hidden = true;
  readerImage.hidden = false;
  readerImage.alt = `${card.topic}: ${card.title} — 원본 질문과 답변 카드뉴스`;
  readerImage.src = `assets/faq/${card.id}.jpg`;
  byId('faq-reader-topic').textContent = `${card.topic} · ${card.id}`;
  byId('faq-reader-title').textContent = card.title;
  byId('faq-original').href = readerImage.src;
  byId('faq-reader-position').textContent = `${cardIndex + 1} / ${filtered.length}`;
  previousCard.disabled = cardIndex === 0;
  nextCard.disabled = cardIndex === filtered.length - 1;
  if (document.activeElement.disabled) (previousCard.disabled ? nextCard : previousCard).focus({ preventScroll: true });
}

function openCard(index) {
  showCard(index);
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  reader.showModal();
}

search.addEventListener('input', () => { page = 0; render(); });
for (const button of filters) button.addEventListener('click', () => {
  category = button.dataset.category;
  page = 0;
  render();
});
byId('faq-reset').addEventListener('click', () => {
  search.value = '';
  category = 'all';
  page = 0;
  render();
  search.focus({ preventScroll: true });
});
previousPage.addEventListener('click', () => changePage(-1));
nextPage.addEventListener('click', () => changePage(1));
byId('faq-close').addEventListener('click', () => reader.close());
reader.addEventListener('close', () => {
  document.body.style.overflow = previousOverflow;
  readerImage.removeAttribute('src');
  resetZoom();
});
reader.addEventListener('click', (event) => {
  const bounds = reader.getBoundingClientRect();
  if (event.target === reader && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) reader.close();
});
previousCard.addEventListener('click', () => showCard(cardIndex - 1));
nextCard.addEventListener('click', () => showCard(cardIndex + 1));
reader.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || readerBody.classList.contains('is-zoomed')) return;
  if (event.key === 'ArrowLeft' && cardIndex > 0) { event.preventDefault(); showCard(cardIndex - 1); }
  if (event.key === 'ArrowRight' && cardIndex < filtered.length - 1) { event.preventDefault(); showCard(cardIndex + 1); }
});
zoom.addEventListener('click', () => {
  const expanded = readerBody.classList.toggle('is-zoomed');
  zoom.setAttribute('aria-pressed', String(expanded));
  zoom.textContent = expanded ? '화면에 맞추기 －' : '확대해서 읽기 ＋';
  readerBody.scrollTo(0, 0);
});
readerImage.addEventListener('error', () => {
  if (!reader.open) return;
  readerImage.hidden = true;
  imageError.hidden = false;
});

render();
app.hidden = false;
