@media (min-width: 600px) {
  body {
    background: #e5e5e0;
  }
  #view-discover,
  #view-detail,
  #view-publish,
  #view-confirm,
  #view-favorites,
  #view-photos,
  #choice-screen {
    max-width: 480px;
    margin: 0 auto;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.15);
    min-height: 100vh;
  }
}
:root{
  --ink:#1A1A1A;
  --ink-soft:#6B7280;
  --paper:#FAFAFA;
  --card:#ffffff;
  --line:#E5E7EB;
  --primary:#14213D;
  --primary-dark:#0B1526;
  --primary-soft:#EEF0F4;
  --primary-ink:#ffffff;
  --accent:#E8604C;
  --accent-dark:#C64A38;
  --accent-soft:#FCEAE7;
  --sun:#E8604C;
  --radius:16px;
  --radius-sm:10px;
  --shadow-sm:0 1px 2px rgba(20,33,61,.05), 0 1px 1px rgba(20,33,61,.04);
  --shadow-md:0 10px 26px -12px rgba(20,33,61,.15), 0 2px 8px -2px rgba(20,33,61,.06);
  --shadow-lift:0 18px 38px -14px rgba(20,33,61,.22);
  --font-display:'Fraunces', Georgia, 'Times New Roman', serif;
  --font-body:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;}
body{
  font-family:var(--font-body);
  background:linear-gradient(180deg, #fdfaf5 0%, #f7f1e8 100%); 
  color:var(--ink);
  padding-bottom:108px;
  -webkit-font-smoothing:antialiased;
}
img{max-width:100%;}
button,input,select,textarea{font-family:inherit;}
button{ cursor:pointer; transition:transform .12s ease, background-color .15s ease, box-shadow .15s ease, opacity .15s ease; }
button:active{ transform:scale(.97); }
 
/* ---- view transition ---- */
.view{ animation:view-in .24s cubic-bezier(.22,.61,.36,1) both; }
@keyframes view-in{ from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:translateY(0); } }
 
/* ---- layout shell ---- */
.topbar{
  position:sticky; top:0; z-index:30;
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 18px;
  background:linear-gradient(135deg, #14213D, #1a2550);
  box-shadow:0 6px 20px -10px rgba(20,33,61,.5);
}
.brand{ display:flex; align-items:center; gap:10px; }
.brand img{ width:32px;height:32px;border-radius:24%; background:#fff; padding:2px; box-shadow:0 2px 8px rgba(0,0,0,.25); }
.brand-word{ font-family:var(--font-display); font-weight:600; font-size:18px; letter-spacing:-.01em; color:#fff; }
.brand-word .accent{ color:var(--sun); }
 
.btn-ghost{
  background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.38); border-radius:999px;
  padding:9px 15px; font-size:13px; font-weight:700; color:#fff;
  backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
}
.btn-ghost:active{ background:rgba(255,255,255,.3); }
 
.view{ max-width:720px; margin:0 auto; padding:18px 16px 22px; }
.hidden{ display:none !important; }
 
/* ---- locate bar (hero) ---- */
.locate-bar{
  position:relative; overflow:hidden;
  background:var(--primary);
  border-radius:22px;
  box-shadow:0 16px 32px -16px rgba(20,33,61,.5);
  padding:18px 20px 18px; margin-bottom:18px;
  color:#fff;
  min-height:230px;
  display:flex;
  flex-direction:column;
  justify-content:flex-end;
}
.locate-bar-photo{
  position:absolute; top:0; left:0; right:0; height:220px;
  background-size:cover; background-position:center;
  opacity:0; transition:opacity .3s ease;
  border-radius:var(--radius) var(--radius) 0 0;
}
.locate-bar-photo.visible{ opacity:1; }
.locate-bar-photo.visible::after{
  content:""; position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(20,33,61,0) 30%, rgba(11,21,38,.92) 100%);
}
.locate-info{ display:flex; flex-direction:column; margin-bottom:14px; position:relative; z-index:2; }
.locate-label{ font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,.72); font-weight:700; }
.locate-value{ font-family:var(--font-display); font-size:30px; font-weight:600; margin-top:4px; color:#fff; letter-spacing:-0.01em; }
.locate-bar{
  position:relative; overflow:hidden;
  background:var(--primary);
  border-radius:var(--radius);
  box-shadow:0 12px 26px -14px rgba(20,33,61,.4);
  padding:18px 18px 16px; margin-bottom:16px;
  color:#fff;
}
.locate-actions{ display:flex; flex-wrap:wrap; gap:8px; position:relative; }
.locate-hint{ margin:14px 0 0; font-size:11.5px; color:rgba(255,255,255,.72); line-height:1.55; padding-top:12px; border-top:1px solid rgba(255,255,255,.22); position:relative; }
 
.chip-btn{
  background:var(--paper); border:1px solid var(--line); border-radius:999px;
  padding:9px 14px; font-size:12.5px; font-weight:700; color:var(--ink-soft);
}
.chip-btn.active{ background:var(--primary); border-color:var(--primary); color:#fff; box-shadow:0 4px 12px -4px rgba(41,171,226,.5); }
.chip-btn--primary{ background:var(--accent); border-color:var(--accent); color:#fff; box-shadow:0 4px 12px -4px rgba(31,111,120,.5); }
 
.locate-actions .chip-btn{
  background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.32); color:#fff;
  backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
}
.locate-actions .chip-btn.active{ background:#fff; border-color:#fff; color:var(--primary-dark); box-shadow:0 6px 16px -8px rgba(0,0,0,.4); }
.locate-actions .chip-btn--primary{ background:rgba(255,255,255,.2); border-color:rgba(255,255,255,.46); color:#fff; box-shadow:none; }
.locate-actions .chip-btn--primary:active{ background:rgba(255,255,255,.32); }
/* ---- groupes de villes par région ---- */
.region-group{ margin-bottom:14px; }
.region-label{
  display:block; font-size:10px; text-transform:uppercase; letter-spacing:.08em;
  color:rgba(255,255,255,.6); font-weight:700; margin-bottom:6px;
}
 
/* ---- villes : style neutre uniforme (plus de couleur par ville) ---- */
.locate-actions .chip-city-1, .locate-actions .chip-city-2, .locate-actions .chip-city-3,
.locate-actions .chip-city-4, .locate-actions .chip-city-5, .locate-actions .chip-city-6,
.locate-actions .chip-city-7, .locate-actions .chip-city-8, .locate-actions .chip-city-9,
.locate-actions .chip-city-10{
  background:rgba(255,255,255,.14) !important; border-color:rgba(255,255,255,.32) !important; color:#fff !important;
}
 
.locate-actions .chip-city-1.active, .locate-actions .chip-city-2.active,
.locate-actions .chip-city-3.active, .locate-actions .chip-city-4.active,
.locate-actions .chip-city-5.active, .locate-actions .chip-city-6.active,
.locate-actions .chip-city-7.active, .locate-actions .chip-city-8.active,
.locate-actions .chip-city-9.active, .locate-actions .chip-city-10.active{
  outline:3px solid #fff !important; outline-offset:1px;
}
/* ---- city info card ---- */
.city-info{
  background:var(--card); border-radius:var(--radius);
  box-shadow:var(--shadow-md);
  padding:20px; margin-bottom:16px;
}
.city-info.hidden{ display:none; }
.city-info .ci-head{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-bottom:10px; }
.city-info .ci-name{ font-family:var(--font-display); font-size:19px; font-weight:600; }
.city-info .ci-pop{ font-size:11.5px; color:var(--ink-soft); white-space:nowrap; font-weight:600; }
.city-info .ci-desc{ font-size:13px; color:var(--ink-soft); line-height:1.65; margin:0 0 14px; }
.city-info .ci-tags{ display:flex; flex-wrap:wrap; gap:7px; margin-bottom:16px; }
.city-info .ci-tag{ font-size:11px; font-weight:700; color:var(--accent); background:var(--accent-soft); padding:6px 12px; border-radius:999px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:5px; }
 
/* ---- couleurs des tags de lieux emblématiques, façon mockup ---- */
.city-info .ci-tags .ci-tag:nth-child(4n+1){ background:#FFE0DB; color:#c0392b; }
.city-info .ci-tags .ci-tag:nth-child(4n+2){ background:#EDE7FF; color:#6c5ce7; }
.city-info .ci-tags .ci-tag:nth-child(4n+3){ background:#D9F7EC; color:#00905f; }
.city-info .ci-tags .ci-tag:nth-child(4n+4){ background:#DBEEFF; color:#0984E3; }
 
/* ---- couleurs des icônes de "facts" (infos pratiques) ---- */
.city-info .ci-facts .ci-fact:nth-child(3n+1) .ico{ color:#FF6F61; }
.city-info .ci-facts .ci-fact:nth-child(3n+2) .ico{ color:#6C5CE7; }
.city-info .ci-facts .ci-fact:nth-child(3n+3) .ico{ color:#0984E3; }
.city-info .ci-tag:active{ background:#d5e9e7; }
.city-info .ci-tag .ci-tag-ico{ font-size:10px; }
.city-info .ci-facts{ display:flex; flex-direction:column; gap:9px; padding-top:14px; border-top:1px solid var(--line); }
.city-info .ci-fact{ font-size:12px; color:var(--ink); display:flex; gap:9px; line-height:1.5; }
.city-info .ci-fact .ico{ color:var(--primary); flex:0 0 auto; }
.city-info .ci-source{ margin-top:12px; font-size:10px; color:#a39c92; }
.city-info .btn-photos{
  width:100%; margin-top:16px;
  background:var(--accent-soft); border:none; color:var(--accent-dark);
  font-weight:700; font-size:13.5px; padding:13px; border-radius:var(--radius-sm);
}
.city-info .btn-photos:active{ background:#d5e9e7; }
 
/* ---- toolbar / segmented ---- */
.toolbar{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px; }
.segmented{ flex:1; background:var(--card); box-shadow:var(--shadow-sm); border-radius:999px; display:flex; padding:4px; max-width:260px; }
.segmented .seg{ flex:1; text-align:center; padding:9px 0; font-size:13px; font-weight:700; color:var(--ink-soft); border-radius:999px; background:transparent; border:none; }
.segmented .seg.active{ background:var(--primary); color:#fff; box-shadow:0 4px 10px -4px rgba(41,171,226,.5); }
#btn-filters{ background:var(--card); box-shadow:var(--shadow-sm); border:none; }
 
/* ---- filters ---- */
.filters-panel{
  background:var(--card); border-radius:var(--radius);
  box-shadow:var(--shadow-md);
  padding:16px 18px; margin-bottom:16px;
  border-top:4px solid #6C5CE7;
}
 
/* ---- couleurs des boutons de rayon rapide ---- */
#radius-presets .chip-btn{ background:#EDE7FF; border-color:#EDE7FF; color:#6c5ce7; }
#radius-presets .chip-btn.active{ background:#6C5CE7; border-color:#6C5CE7; color:#fff; }
.filters-row{ margin-bottom:14px; }
.filters-row:last-child{ margin-bottom:0; }
.filters-label{ display:block; font-size:11px; font-weight:700; color:var(--ink-soft); text-transform:uppercase; letter-spacing:.05em; margin-bottom:9px; }
.chips-row{ display:flex; flex-wrap:wrap; gap:7px; }
 
input[type="range"]{ width:100%; accent-color:var(--primary); }
 
/* ---- map mock ---- */
.locate-bar-photo, #locate-bar-photo{ border-radius:20px !important; overflow:hidden; }
.chip-btn{ transition:background .2s ease, color .2s ease, border-color .2s ease; }
.map-mock{
  border-radius:var(--radius); margin-bottom:16px;
  position:relative; overflow:hidden;
  box-shadow:var(--shadow-md);
  background:#eef1e9;
}
#discover-leaflet-map{ width:100%; height:300px; }
.discover-map-legend{ display:flex; flex-wrap:wrap; gap:8px; justify-content:center; padding:12px 10px; background:#fff; }
.map-tag{ position:absolute; top:12px; right:12px; background:rgba(255,255,255,.94); font-size:11px; font-weight:700; padding:5px 11px; border-radius:999px; color:var(--accent); box-shadow:var(--shadow-sm); z-index:400; }

/* ---- event list ---- */
.event-list{ display:flex; flex-direction:column; gap:11px; }
.event-card{
  display:flex; gap:14px; align-items:center;
  background:var(--card); border-radius:16px; padding:13px;
  text-align:left; width:100%; border:none;
  box-shadow:0 2px 10px rgba(20,33,61,0.06);
  border-left:3px solid transparent;
  transition:box-shadow .2s ease, transform .15s ease;
}
.event-card:hover{ box-shadow:0 6px 18px rgba(20,33,61,0.12); transform:translateY(-1px); }
.event-card:active{ box-shadow:var(--shadow-sm); background:#fdfbf8; }
.event-card .thumb-wrap{ position:relative; flex:0 0 auto; }
.event-card .thumb{ width:78px;height:78px;border-radius:16px; overflow:hidden; background:var(--line); box-shadow:0 4px 10px -4px rgba(33,31,27,.22); }
.event-card .thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
.event-card .thumb svg{ display:block; width:100%; height:100%; }
.event-card .thumb-badge{ position:absolute; bottom:-6px; left:-6px; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; border:2.5px solid var(--card); box-shadow:0 2px 6px rgba(0,0,0,0.25); }
.event-card .info{ flex:1; min-width:0; }
.event-card .cat{ font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; }
.event-card .title{ font-family:var(--font-display); font-size:15.5px; font-weight:600; margin:4px 0 4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.event-card .meta{ font-size:12px; color:var(--ink-soft); }
.event-card .dist{ font-size:11px; font-weight:700; color:var(--accent-dark); background:var(--accent-soft); padding:6px 11px; border-radius:999px; flex:0 0 auto; }
 
/* ---- catégories en icônes rondes ---- */
#category-chips{ display:flex; gap:14px; overflow-x:auto; padding:4px 2px 10px; }
#category-chips .cat-chip{ display:flex; flex-direction:column; align-items:center; gap:5px; flex:0 0 auto; background:none; border:none; cursor:pointer; padding:0; }
#category-chips .cat-chip-circle{ width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 6px 14px -6px rgba(20,33,61,0.35); transition:opacity .2s ease, transform .15s ease; }
#category-chips .cat-chip.active .cat-chip-circle{ transform:scale(1.08); box-shadow:0 8px 18px -6px rgba(20,33,61,0.5); }
#category-chips .cat-chip-label{ font-size:9.5px; font-weight:700; color:var(--ink-soft); white-space:nowrap; }
#category-chips .cat-chip.active .cat-chip-label{ color:var(--ink); }
 
/* ---- grille d'icônes colorées "Que se passe-t-il ?" (accueil, toujours visible) ---- */
.home-quickbar-section{ margin:4px 16px 14px; }
.home-quickbar-title{ font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--ink); margin:0 0 10px; letter-spacing:-.01em; }
.home-category-quickbar{ display:flex; gap:16px; overflow-x:auto; padding:2px 2px 8px; scrollbar-width:none; }
.home-category-quickbar::-webkit-scrollbar{ display:none; }
.home-category-quickbar .quick-cat{ display:flex; flex-direction:column; align-items:center; gap:6px; flex:0 0 auto; width:60px; background:none; border:none; cursor:pointer; padding:0; }
.home-category-quickbar .quick-cat-circle{ position:relative; width:56px; height:56px; border-radius:20px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#e7e5e0; box-shadow:0 8px 16px -8px rgba(20,33,61,0.4); border:2.5px solid transparent; transition:transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
.home-category-quickbar .quick-cat-circle img{ width:100%; height:100%; object-fit:cover; display:block; opacity:.62; transition:opacity .15s ease; }
.home-category-quickbar .quick-cat-circle.active img{ opacity:1; }
.home-category-quickbar .quick-cat-circle.active{ border-color:var(--cat-color); }
.home-category-quickbar .quick-cat-emoji-fallback{ font-size:24px; filter:drop-shadow(0 1px 2px rgba(0,0,0,.15)); }
.home-category-quickbar .quick-cat-badge{ position:absolute; bottom:-3px; right:-3px; width:22px; height:22px; border-radius:50%; background:var(--cat-color); display:flex; align-items:center; justify-content:center; font-size:11px; border:2px solid #fff; box-shadow:0 2px 5px rgba(0,0,0,.25); }
.home-category-quickbar .quick-cat.active .quick-cat-circle{ transform:translateY(-3px) scale(1.06); box-shadow:0 12px 22px -8px rgba(20,33,61,0.55); }
.home-category-quickbar .quick-cat-label{ font-size:10.5px; font-weight:700; color:var(--ink-soft); white-space:nowrap; text-align:center; }
.home-category-quickbar .quick-cat.active .quick-cat-label{ color:var(--ink); }

.empty-state{ text-align:center; color:var(--ink-soft); font-size:13px; padding:28px 10px; }
 
/* ---- detail view ---- */
.back-btn{ background:none; border:none; font-weight:700; color:var(--ink); font-size:14px; padding:6px 0 16px; }
.detail-hero{ height:210px; border-radius:var(--radius); overflow:hidden; background:var(--line); margin-bottom:18px; box-shadow:var(--shadow-md); }
.detail-hero svg{ display:block; width:100%; height:100%; }
.pill{ display:inline-block; font-size:11px; font-weight:700; color:#fff; background:var(--accent); padding:6px 13px; border-radius:999px; margin-bottom:12px; }
.detail-body h1{ font-family:var(--font-display); font-weight:600; font-size:24px; margin:0 0 16px; line-height:1.22; letter-spacing:-.01em; }
.info-row{ display:flex; gap:12px; font-size:13.5px; margin-bottom:13px; }
.info-card{ background:#f7f5f2; border-radius:14px; padding:14px 16px; margin-bottom:16px; }
.info-row-new{ display:flex; gap:12px; align-items:baseline; }
.info-row-new .ico{ width:20px; text-align:center; font-size:15px; }
.info-main{ font-size:14.5px; font-weight:700; color:var(--primary); }
.info-sub{ font-size:12px; color:#888; margin-top:2px; }
.info-sub.accent{ color:var(--accent); font-weight:600; }
.info-divider{ height:1px; background:#e5e0d8; margin:11px 0; }
.price-badge{ display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:999px; background:#eafaf0; color:#2a9d5c; font-size:12px; font-weight:700; margin-bottom:14px; }
.detail-desc{ font-size:13.5px; color:var(--ink-soft); line-height:1.65; margin:0 0 18px; }
.info-row .ico{ width:22px; text-align:center; color:var(--primary); }
/* ---- fiche détail, style sobre : marine + accent corail réservé aux états confirmés ---- */
.cta-row{ display:flex; gap:10px; margin:20px 0 12px; }
#btn-interested{
  flex:1; padding:14px 18px; border:none; border-radius:var(--radius-sm);
  background:var(--primary); color:#fff;
  font-weight:700; font-size:14.5px; cursor:pointer;
}
#btn-interested.active{
  background:var(--accent);
}
.action-tiles{ display:flex; gap:8px; margin-bottom:14px; }
.action-tile{ flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; padding:12px 4px; border-radius:12px; border:none; background:#f7f5f2; cursor:pointer; }
.action-tile .tile-icon{ font-size:18px; }
.action-tile .tile-label{ font-size:9.5px; color:#666; font-weight:600; }
.action-tile.active{ background:var(--accent-soft); }
.btn-primary.active{ background:linear-gradient(155deg, var(--accent) 0%, var(--accent-dark) 100%); box-shadow:0 10px 22px -10px rgba(31,111,120,.55); }
.btn-block{ width:100%; }
.btn-outline{ width:52px; background:var(--card); border:none; border-radius:var(--radius-sm); font-size:19px; box-shadow:var(--shadow-sm); }
.btn-outline.active{ background:#fde7e7; }
.cta-row .btn-primary{ flex:1; }
 
/* ---- publish form ---- */
.form-title{ font-family:var(--font-display); font-weight:600; font-size:22px; margin:6px 0 8px; letter-spacing:-.01em; }
.form-sub{ font-size:13px; color:var(--ink-soft); margin:0 0 20px; line-height:1.55; }
.publish-form{ display:flex; flex-direction:column; gap:15px; }
.field{ display:flex; flex-direction:column; gap:7px; font-size:11.5px; font-weight:700; color:var(--ink-soft); text-transform:uppercase; letter-spacing:.04em; }
.field input, .field select, .field textarea{
  border:1px solid var(--line); border-radius:var(--radius-sm); padding:12px 13px; font-size:14.5px;
  color:var(--ink); background:var(--card); text-transform:none; font-weight:400;
}
.field input:focus, .field select:focus, .field textarea:focus{ outline:2px solid #6C5CE7; outline-offset:1px; border-color:#6C5CE7; }
 
/* ---- bouton de publication coloré, façon mockup ---- */
.publish-form button[type="submit"]{
  background:linear-gradient(135deg, #6C5CE7, #4834b0) !important;
  border:none !important;
  box-shadow:0 6px 16px -6px rgba(108,92,231,.5);
}
 
/* ---- titre du formulaire avec petit accent coloré ---- */
.form-title{ position:relative; padding-left:14px; }
.form-title::before{
  content:""; position:absolute; left:0; top:4px; bottom:4px; width:4px;
  background:linear-gradient(180deg, #6C5CE7, #0984E3); border-radius:2px;
}
.field-row{ display:flex; gap:12px; }
.field-row .field{ flex:1; }
 
/* ---- confirm ---- */
.confirm-box{ text-align:center; padding:48px 10px; }
.confirm-icon{ width:64px;height:64px;border-radius:50%; background:var(--primary); color:#fff; font-size:28px; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; }
.confetti{ display:none; }
.confirm-box h1{ font-family:var(--font-display); font-weight:600; font-size:22px; margin:0 0 9px; }
.confirm-box p{ font-size:13.5px; color:var(--ink-soft); margin:0 0 24px; line-height:1.5; }
 
/* ---- bottom nav (floating) ---- */
.bottomnav{
  position:fixed; left:14px; right:14px; bottom:14px; z-index:40;
  max-width:392px; margin:0 auto;
  display:flex; background:rgba(255,255,255,.9);
  backdrop-filter:blur(14px) saturate(1.5);
  -webkit-backdrop-filter:blur(14px) saturate(1.5);
  border-radius:22px;
  box-shadow:0 16px 34px -12px rgba(33,31,27,.32), 0 2px 8px rgba(33,31,27,.06);
  padding:7px;
}
.nav-item{
  flex:1; display:flex; flex-direction:column; align-items:center; gap:2px;
  background:none; border:none; font-size:10.5px; font-weight:700; color:var(--ink-soft);
  padding:8px 0 7px; border-radius:16px;
}
.nav-item.active{
  color:#fff;
  background:linear-gradient(155deg, var(--primary) 0%, var(--primary-dark) 100%);
  box-shadow:0 8px 16px -6px rgba(41,171,226,.55);
}
.nav-item .dot{ font-size:26px; }
.nav-item .nav-label{
  position:absolute; width:1px; height:1px; padding:0; margin:-1px;
  overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;
}
 
/* ---- navigation : couleur unique et cohérente pour l'onglet actif ---- */
.nav-item.active{ background:var(--primary); color:#fff; }
@media (min-width:760px){ .bottomnav{ max-width:460px; } }
 
/* ---- mes photos (souvenirs), accent doré ---- */
.photos-title::before{
  background:linear-gradient(180deg, #FDCB6E, #e3a72e) !important;
}
#btn-add-photo{
  margin-bottom:18px;
  background:linear-gradient(135deg, #FDCB6E, #e3a72e) !important;
  border:none !important;
  color:#3a2e00 !important;
  box-shadow:0 6px 16px -6px rgba(253,203,110,.6);
}
.photos-grid{ display:grid; grid-template-columns:repeat(3, 1fr); gap:9px; }
.photos-grid .photo-thumb{ transition:transform .15s ease; }
.photos-grid .photo-thumb:active{ transform:scale(.96); }
.photos-grid .photo-thumb{
  aspect-ratio:1; border-radius:var(--radius-sm); overflow:hidden; border:none; padding:0;
  background:var(--line); cursor:pointer; box-shadow:var(--shadow-sm);
}
.photos-grid .photo-thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
 
.photo-lightbox{
  position:fixed; inset:0; z-index:70;
  background:rgba(18,16,14,.94);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px;
  padding:20px;
}
.photo-lightbox.hidden{ display:none; }
.photo-lightbox img{ max-width:92vw; max-height:68vh; border-radius:16px; object-fit:contain; box-shadow:var(--shadow-lift); }
.lightbox-delete{
  background:#fff; color:var(--primary); border:none; border-radius:999px;
  padding:12px 24px; font-weight:700; font-size:13px; box-shadow:var(--shadow-md);
}
 
/* ---- landmark modal ---- */
.landmark-modal{
  position:fixed; inset:0; z-index:60;
  background:rgba(24,22,19,.6);
  backdrop-filter:blur(2px);
  display:flex; align-items:flex-end; justify-content:center;
}
.landmark-modal.hidden{ display:none; }
.landmark-modal-card{
  background:var(--card); width:100%; max-width:480px;
  border-radius:24px 24px 0 0; overflow:hidden;
  max-height:88vh; overflow-y:auto;
  box-shadow:var(--shadow-lift);
  animation:landmark-up .2s cubic-bezier(.22,.61,.36,1);
}
@keyframes landmark-up{ from{ transform:translateY(28px); opacity:0; } to{ transform:translateY(0); opacity:1; } }
.landmark-modal-img{ position:relative; height:210px; background:var(--line); }
.landmark-modal-img svg, .landmark-modal-img img{ display:block; width:100%; height:100%; object-fit:cover; }
.modal-close{
  position:absolute; top:14px; right:14px; z-index:2;
  width:34px; height:34px; border-radius:50%; border:none;
  background:rgba(24,22,19,.5); color:#fff; font-size:15px;
  display:flex; align-items:center; justify-content:center;
  backdrop-filter:blur(4px);
}
/* ---- fenêtres modales génériques (Mon compte, Modération, Newsletter) ---- */
.modal{
  position:fixed; inset:0; z-index:9000;
  background:rgba(20,33,61,.6);
  display:flex; align-items:flex-end; justify-content:center;
}
.modal-content{
  position:relative;
  background:var(--card); width:100%; max-width:480px;
  border-radius:24px 24px 0 0;
  max-height:88vh; overflow-y:auto;
  padding:26px 20px 30px;
  box-shadow:var(--shadow-lift);
}
@media (min-width:600px){
  .modal{ align-items:center; }
  .modal-content{ border-radius:20px; }
}
.modal-content .btn-outline.btn-block{ width:100%; font-size:14px; margin-bottom:8px; }
.modal-content .btn-outline.btn-block:last-child{ margin-bottom:0; }
.landmark-modal-body{ padding:20px 22px 26px; }
.landmark-modal-body h2{ font-family:var(--font-display); font-weight:600; font-size:19px; margin:0 0 9px; }
.landmark-modal-body p{ font-size:13.5px; color:var(--ink-soft); line-height:1.65; margin:0; }
/* ---- bouton "Voir la liste" sous la carte ---- */
.btn-see-list{
  display:block; width:calc(100% - 32px); margin:12px 16px 4px;
  padding:14px 20px; border:none; border-radius:14px;
  background:linear-gradient(135deg, #E85D3D, #c1440e); color:#fff;
  font-weight:700; font-size:14.5px; cursor:pointer;
  box-shadow:0 4px 12px -4px rgba(232,93,61,.5);
}
/* ---- responsive : desktop ---- */
@media (min-width:760px){
  .view{ padding-top:26px; }
  .event-list{ display:grid; grid-template-columns:1fr 1fr; }
  .cta-row{ max-width:360px; }
}
/* ---- badge de points, harmonisé avec le nouvel en-tête ---- */
.loyalty-badge{
  background:rgba(255,255,255,.22) !important;
  border:1px solid rgba(255,255,255,.4) !important;
  color:#fff !important;
  padding:6px 14px !important;
  border-radius:999px !important;
  font-weight:700 !important;
  font-size:12.5px !important;
  backdrop-filter:blur(6px);
  -webkit-backdrop-filter:blur(6px);
}
/* ---- titre de l'écran Favoris, accent corail plutôt que violet ---- */
.favorites-title::before{
  background:linear-gradient(180deg, #FF6F61, #c0392b) !important;
}
/* ---- écran de démarrage animé ---- */
.splash-screen{
  position:fixed; inset:0; z-index:200;
  display:flex; align-items:center; justify-content:center;
  background:linear-gradient(165deg, #14213D 0%, #2b3f66 45%, #7ba9c9 78%, #cdeaf9 100%);
}
.splash-logo{
  width:min(420px, 100vw); height:min(420px, 100vw);
  opacity:0; animation:splash-logo-in .7s ease-out .15s forwards, splash-inflate .5s ease-in 2.5s forwards;
}
@keyframes splash-logo-in{
  from{ opacity:0; transform:scale(.7); }
  to{ opacity:1; transform:scale(1); }
}
@keyframes splash-inflate{
  from{ transform:scale(1); }
  to{ transform:scale(1.35); opacity:0; }
}
.splash-eyelid{
  transform-box:fill-box; transform-origin:center; transform:scaleY(0);
  animation:splash-wink 0.5s ease-in-out 1.6s;
}
.splash-eyelid-line{ opacity:0; animation:splash-wink-line 0.5s ease-in-out 1.6s; }
@keyframes splash-wink{
  0%, 100%{ transform:scaleY(0); }
  50%{ transform:scaleY(1); }
}
@keyframes splash-wink-line{
  0%, 100%{ opacity:0; }
  50%{ opacity:1; }
}
.splash-confetti-burst{ position:absolute; top:50%; left:50%; width:0; height:0; }
.splash-confetti{
  position:absolute; width:14px; height:14px; opacity:0;
  animation:splash-burst 1s cubic-bezier(.2,.8,.4,1) 2.95s forwards;
}
@keyframes splash-burst{
  0%{ opacity:1; transform:translate(-50%,-50%) rotate(0deg) scale(1); }
  100%{ opacity:0; transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(.6); }
}
.splash-screen.hide{ transition:opacity .35s ease; opacity:0; pointer-events:none; }
/* ---- accordéon de sélection de ville par région ---- */
.locate-bar{ padding:0; overflow:hidden; }
.locate-bar-photo{
  position:relative; height:220px;
  background-size:cover; background-position:center;
  display:flex; align-items:flex-end; padding:16px;
}
.locate-bar-photo::after{
  content:""; position:absolute; inset:0; z-index:0;
  background:linear-gradient(180deg, rgba(20,33,61,0) 40%, rgba(11,21,38,.9) 100%);
}
.locate-bar-photo .locate-info{ position:relative; z-index:1; margin-bottom:0; }
.locate-body{ padding:16px; }
.region-block{ border-bottom:1px solid rgba(255,255,255,.12); }
.region-block:last-child{ border-bottom:none; }
.region-toggle{
  width:100%; background:none; border:none; color:#fff; text-align:left;
  padding:13px 2px; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.04em;
  display:flex; justify-content:space-between; align-items:center; cursor:pointer;
  font-family:var(--font-body);
}
.chevron{ transition:transform .2s ease; font-size:16px; color:rgba(255,255,255,.6); }
.region-block.open .chevron{ transform:rotate(90deg); }
.region-panel{ max-height:0; overflow:hidden; transition:max-height .3s ease; }
.region-block.open .region-panel{ max-height:600px; }
.region-body .locate-actions{ padding:2px 2px 14px; }
 
/* ---- recherche de ville (toutes les villes de France) ---- */
.city-search-input{
  width:100%; box-sizing:border-box; padding:12px 14px; margin-bottom:12px;
  background:rgba(255,255,255,.12); border:1.5px solid rgba(255,255,255,.28); border-radius:12px;
  color:#fff; font-size:14px; font-family:var(--font-body);
}
.city-search-input::placeholder{ color:rgba(255,255,255,.6); }
.city-search-results{ display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
.city-search-results.hidden{ display:none; }
.city-search-empty{ color:rgba(255,255,255,.65); font-size:12.5px; margin:4px 2px; }
.chip-btn--curated{ display:inline-flex; align-items:center; gap:6px; }
.city-dot{ width:7px; height:7px; border-radius:50%; background:#4CD07A; box-shadow:0 0 0 2px rgba(76,208,122,.25); flex-shrink:0; }
#region-accordion.hidden{ display:none; }
 
/* ---- état vide : ville pas encore couverte ---- */
.empty-city-card{
  background:linear-gradient(135deg,#eaf6fd,#fdfaf5); border:1px dashed #cdeaf9; border-radius:16px;
  padding:18px; text-align:left; color:#14213D;
}
.empty-city-card .t{ font-weight:800; font-size:14px; margin-bottom:6px; }
.empty-city-card .d{ font-size:12.5px; color:#6b6458; line-height:1.5; margin-bottom:12px; }
.nearest-city-btn{ display:inline-block; }
/* ---- bannière statistiques (aujourd'hui / demain / cette semaine) ---- */
.stats-banner{
  margin:0 0 16px; padding:8px; box-sizing:border-box;
  background:#fff; border:1.5px solid var(--line); border-radius:var(--radius-sm);
  display:flex; justify-content:space-between;
}
.stat{
  text-align:center; flex:1; background:none; border:none; cursor:pointer;
  padding:8px 6px; border-radius:8px; font-family:var(--font-body);
}
.stat.active{ background:var(--accent-soft); }
.stat .num{ font-family:var(--font-display); font-size:22px; font-weight:700; color:var(--accent); }
.stat .label{ font-size:11px; color:var(--ink-soft); font-weight:600; text-transform:uppercase; letter-spacing:.03em; margin-top:2px; }
/* ---- écran intro : souvenirs ou découvrir ---- */
.intro-screen{
  position:fixed; inset:0; z-index:101;
  background:linear-gradient(165deg, #cdeaf9 0%, #eaf6fd 45%, #fdfaf5 100%);
  display:flex; flex-direction:column; align-items:center; justify-content:space-between;
  padding:60px 24px 40px;
}
.intro-screen.hidden{ display:none; }
.intro-bubble{
  background:rgba(20,33,61,0.92); color:#fff; border-radius:18px; padding:16px 18px;
  font-size:15px; text-align:center; line-height:1.45; font-weight:600; max-width:340px;
}
.intro-logo{ display:flex; align-items:center; justify-content:center; flex:1; }
.intro-logo svg{ width:min(300px, 78vw); height:auto; }
.intro-pills{ width:100%; max-width:340px; display:flex; flex-direction:column; gap:12px; }
.intro-pill{
  border:none; border-radius:999px; padding:15px; text-align:center; font-size:14px; font-weight:800;
  cursor:pointer; font-family:inherit;
}
.intro-pill.primary{ background:linear-gradient(135deg,#F2C879,#E85D3D); color:#fff; box-shadow:0 8px 18px -6px rgba(242,167,68,0.55); }
.intro-pill.ghost{ background:rgba(242,167,68,0.12); border:1px solid rgba(242,167,68,0.4); color:#14213D; }
.intro-tagline{ text-align:center; color:rgba(20,33,61,0.55); font-size:12px; margin-top:6px; font-style:italic; }
 
/* ---- écran de choix : localiser ou visiter une ville ---- */
.choice-screen{
  position:fixed; inset:0; z-index:100; background:linear-gradient(160deg, #0d1730 0%, #1a2550 55%, #2b1f4a 100%);
  display:flex; flex-direction:column; padding:32px 20px 20px;
  overflow-y:auto;
}
.choice-screen.hidden{ display:none; }
.choice-header{ text-align:center; margin-bottom:8px; }
.choice-header .brand-word{ font-family:var(--font-display); font-weight:700; font-size:20px; color:#fff; }
.choice-header .accent{ color:var(--accent); }
.choice-header h1{ font-family:var(--font-display); font-size:22px; color:#fff; margin:20px 0 4px; }
.choice-header p{ font-size:13px; color:rgba(255,255,255,0.65); margin:0; }
.choice-cards{ flex:1; display:flex; flex-direction:column; gap:16px; margin-top:20px; min-height:0; }
.choice-card{
  flex:1; min-height:220px; border-radius:20px; position:relative; overflow:hidden;
  display:flex; flex-direction:column; align-items:center; justify-content:flex-end;
  padding:20px; cursor:pointer; border:none;
  isolation:isolate; transform:translateZ(0); clip-path:inset(0 round 20px);
}
.choice-card.carnet{ flex:none; min-height:150px; }
.choice-card.locate{ background:linear-gradient(155deg,#1a2d52,#0B1526); color:#fff; }
.choice-card.visit{ background:linear-gradient(155deg,#fdf3ee,#f7e4da); color:var(--ink); }
.choice-card .scene{ position:absolute; inset:0; width:100%; height:100%; }
.choice-content{ position:relative; z-index:1; text-align:center; }
.choice-content h2{ font-family:var(--font-display); font-size:19px; margin:0 0 6px; }
.choice-content p{ font-size:13px; margin:0; max-width:260px; }
.choice-card.locate .choice-content p{ color:rgba(255,255,255,.8); }
.choice-card.visit .choice-content p{ color:var(--ink-soft); }
.choice-badge{
  position:absolute; top:14px; right:14px; background:var(--accent); color:#fff;
  font-size:10px; font-weight:700; padding:4px 9px; border-radius:999px; text-transform:uppercase; z-index:2;
}
 
.choice-eyelid{ transform-box:fill-box; transform-origin:center; transform:scaleY(0); }
.choice-card.clicked .choice-eyelid{ animation:choice-wink .4s ease-in-out; }
@keyframes choice-wink{
  0%, 100%{ transform:scaleY(0); }
  50%{ transform:scaleY(1); }
}
.choice-confetti-burst{ position:absolute; top:50%; left:50%; width:0; height:0; z-index:3; }
.choice-confetti{ position:absolute; width:9px; height:9px; opacity:0; }
.choice-card.clicked .choice-confetti{ animation:choice-burst .7s cubic-bezier(.2,.8,.4,1) .35s forwards; }
@keyframes choice-burst{
  0%{ opacity:1; transform:translate(-50%,-50%) rotate(0deg) scale(1); }
  100%{ opacity:0; transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(.6); }
}
/* ---- cartes "lieux à voir" (toujours ouverts) ---- */
.event-card--place{ border-left: 3px solid #7fa36b; }
.event-card--place .cat{ color: #4f6e42; }
.flags-row{ display:flex; gap:6px; flex-shrink:0; }
.flag-btn{
  background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.3); border-radius:999px;
  width:30px; height:30px; cursor:pointer; display:flex; align-items:center; justify-content:center;
  padding:0; flex-shrink:0;
}
.flag-btn.active{ background:var(--accent); border-color:var(--accent); }
.flag-btn img{ width:18px; height:13px; border-radius:2px; object-fit:cover; display:block; }
@media (max-width: 480px){
  .topbar{ flex-wrap:wrap; row-gap:8px; }
}

/* ---- écran de bienvenue (photo de ville + accroche), après le splash ---- */
.brand-intro-screen{
  position:fixed; inset:0; z-index:150;
  display:flex; flex-direction:column; justify-content:space-between;
  overflow:hidden;
}
.brand-intro-screen.hidden{ display:none; }
.brand-intro-screen.hide{ transition:opacity .35s ease; opacity:0; pointer-events:none; }
@keyframes brandIntroIn{
  from{ opacity:0; transform:scale(1.04); }
  to{ opacity:1; transform:scale(1); }
}
.brand-intro-photo{
  position:absolute; inset:0; background-size:cover; background-position:center;
  background-color:#14213D;
}
.brand-intro-overlay{
  position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(20,33,61,.75) 0%, rgba(20,33,61,.25) 32%, rgba(20,33,61,.55) 68%, rgba(11,21,38,.95) 100%);
}
.brand-intro-content{
  position:relative; z-index:1; height:100%;
  display:flex; flex-direction:column; justify-content:space-between;
  padding:max(28px, env(safe-area-inset-top)) 24px max(28px, env(safe-area-inset-bottom));
  box-sizing:border-box;
}
.brand-intro-top{ display:flex; flex-direction:column; align-items:center; gap:6px; margin-top:10px; }
.brand-intro-logo-icon{ width:112px; height:112px; }
.brand-intro-wordmark{ font-family:var(--font-display); font-weight:700; font-size:60px; color:#fff; letter-spacing:-.01em; }
.brand-intro-tagline{ font-family:var(--font-display); font-style:italic; font-size:28px; color:rgba(255,255,255,.85); }
.brand-intro-bottom{ display:flex; flex-direction:column; gap:8px; max-width:320px; }
.brand-intro-pitch{ font-family:var(--font-display); font-size:22px; font-weight:600; line-height:1.3; color:#fff; }
.brand-intro-today{ font-family:var(--font-body); font-size:13px; font-weight:700; color:#F2C879; text-transform:uppercase; letter-spacing:.03em; position:relative; display:inline-block; padding-bottom:6px; }
.brand-intro-today::after{ content:""; position:absolute; left:0; bottom:0; width:56px; height:2px; background:#F2C879; border-radius:2px; } 

.brand-intro-choices{ display:flex; flex-direction:column; gap:10px; margin-top:14px; }
.brand-choice-btn{
  border:none; border-radius:14px; padding:14px 16px;
  font-family:var(--font-body); font-size:14px; font-weight:800;
  text-align:left; cursor:pointer; display:flex; align-items:center; gap:10px;
}
.brand-choice-btn.primary{ background:linear-gradient(135deg,#F2C879,#E85D3D); color:#fff; box-shadow:0 8px 18px -6px rgba(242,167,68,0.55); }
.brand-choice-btn.ghost{ background:rgba(255,255,255,0.14); border:1px solid rgba(255,255,255,0.35); color:#fff; }

/* ==========================================================================
   REDESIGN "TOUT VOIR" — thème sombre dynamique, cartes blanches contrastées
   ========================================================================== */
#view-discover{
  background:linear-gradient(180deg, #0E1526 0%, #141C36 55%, #14213D 100%);
  min-height:100vh;
  padding-bottom:30px;
}
#view-discover .locate-value{ font-size:26px; }

/* ---- bande de jours défilable (30 jours), pastilles dynamiques ---- */
#view-discover .stats-banner{ background:transparent; border:none; padding:0; margin:0 0 18px; }
#view-discover .week-strip-hint{
  font-size:10.5px; color:rgba(255,255,255,.5); padding:0 2px 8px;
  text-transform:uppercase; letter-spacing:.05em; font-weight:700;
}
#view-discover .week-strip{ display:flex; gap:8px; overflow-x:auto; padding:2px 2px 6px; scrollbar-width:none; }
#view-discover .week-strip::-webkit-scrollbar{ display:none; }
#view-discover .week-day-btn{
  flex:0 0 54px; display:flex; flex-direction:column; align-items:center; gap:3px;
  padding:10px 4px; border-radius:14px; cursor:pointer;
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14); color:#fff;
  transition:background .2s ease, border-color .2s ease, transform .15s ease;
}
#view-discover .week-day-btn .week-day-label{
  font-size:9.5px; text-transform:uppercase; letter-spacing:.04em; font-weight:700; color:rgba(255,255,255,.55);
}
#view-discover .week-day-btn .week-day-date{ font-size:10px; color:rgba(255,255,255,.5); }
#view-discover .week-day-btn .week-day-count{ font-size:16px; font-weight:800; color:#F2A98C; font-family:var(--font-display); }
#view-discover .week-day-btn.active{
  background:linear-gradient(150deg,#F2C879,#E85D3D); border-color:transparent;
  transform:translateY(-1px); box-shadow:0 8px 18px -8px rgba(232,93,61,.65);
}
#view-discover .week-day-btn.active .week-day-label,
#view-discover .week-day-btn.active .week-day-date{ color:rgba(255,255,255,.85); }
#view-discover .week-day-btn.active .week-day-count{ color:#fff; }

/* ---- fiche ville ---- */
#view-discover .city-info{
  background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
  border-radius:20px; padding:18px 20px; margin-bottom:18px; backdrop-filter:blur(6px);
}
#view-discover .city-info .ci-name{ color:#fff; }
#view-discover .city-info .ci-pop{ color:rgba(255,255,255,.65); }
#view-discover .city-info .ci-desc{ color:rgba(255,255,255,.72); }
#view-discover .city-info .ci-facts{ border-top-color:rgba(255,255,255,.14); }
#view-discover .city-info .ci-fact{ color:rgba(255,255,255,.85); }
#view-discover .city-info .ci-source{ color:rgba(255,255,255,.4); }
#view-discover .city-info .ci-tags .ci-tag{ background:rgba(255,255,255,.1); color:#F2C879; }
#view-discover .city-info .ci-tags .ci-tag:nth-child(4n+1){ background:rgba(232,93,61,.18); color:#F2A98C; }
#view-discover .city-info .ci-tags .ci-tag:nth-child(4n+2){ background:rgba(165,124,247,.18); color:#C6ACFA; }
#view-discover .city-info .ci-tags .ci-tag:nth-child(4n+3){ background:rgba(76,208,122,.16); color:#7FE0A6; }
#view-discover .city-info .ci-tags .ci-tag:nth-child(4n+4){ background:rgba(41,171,226,.16); color:#7FCBF2; }
#view-discover .city-info .btn-photos{ background:rgba(255,255,255,.1); color:#fff; border:1px solid rgba(255,255,255,.2); }

/* ---- barre carte/liste + filtres ---- */
#view-discover .toolbar{ margin-bottom:16px; }
#view-discover .segmented{ background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14); box-shadow:none; }
#view-discover .segmented .seg{ color:rgba(255,255,255,.65); }
#view-discover .segmented .seg.active{
  background:linear-gradient(135deg,#A57CF7,#8B6CF2); color:#fff; box-shadow:0 4px 12px -4px rgba(139,108,242,.6);
}
#view-discover .toolbar .chip-btn{ background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14); color:#fff; }
#view-discover .filters-panel{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:18px; }
#view-discover .filters-label{ color:rgba(255,255,255,.6); }
#view-discover .filters-panel .chip-btn{ background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.16); color:rgba(255,255,255,.85); }
#view-discover .filters-panel .chip-btn.active{ background:linear-gradient(135deg,#F2C879,#E85D3D); border-color:transparent; color:#fff; }
#view-discover .filters-panel select{ background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.16); color:#fff; }
#view-discover .filters-panel input[type="range"]{ accent-color:#E85D3D; }

/* ---- cartes d'événements : blanches et colorées sur fond sombre ---- */
#view-discover .event-card{
  background:#fff; border:none; padding:12px; gap:13px; align-items:stretch;
  box-shadow:0 10px 24px -12px rgba(0,0,0,.45);
  transition:box-shadow .2s ease, transform .15s ease, background .2s ease;
}
#view-discover .event-card:hover{ box-shadow:0 14px 28px -12px rgba(0,0,0,.55); transform:translateY(-1px); }
#view-discover .event-card:active{ background:#faf9f7; }
#view-discover .event-card .thumb-wrap{ align-self:center; }
#view-discover .event-card .thumb{ width:92px; height:92px; border-radius:18px; box-shadow:0 4px 10px -4px rgba(20,33,61,.25); }
#view-discover .event-card .thumb-badge{
  top:-6px; left:-6px; bottom:auto; width:28px; height:28px; font-size:13px;
  border-color:#fff; box-shadow:0 3px 8px rgba(0,0,0,.25);
}
#view-discover .event-card .info{ display:flex; flex-direction:column; justify-content:center; }
#view-discover .event-card .cat{ display:none; }
#view-discover .event-card .title{
  color:#14213D; -webkit-line-clamp:2; display:-webkit-box; -webkit-box-orient:vertical;
  white-space:normal; overflow:hidden; line-height:1.25; margin:0 0 3px;
}
#view-discover .event-card .venue{
  font-size:12.5px; color:#8891A6; margin:0 0 4px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
#view-discover .event-card .meta{ font-size:11.5px; color:#8891A6; }
#view-discover .event-card .dist{
  align-self:center; font-size:11px; font-weight:800; color:#fff;
  padding:7px 12px; border-radius:999px; flex:0 0 auto; white-space:nowrap;
}
#view-discover .event-card .dist.free{ background:#28C76F; }
#view-discover .event-card .dist.inscr{ background:linear-gradient(135deg,#A57CF7,#8B6CF2); }
#view-discover .event-card .dist.paid{ background:linear-gradient(135deg,#F2C879,#E85D3D); }
#view-discover .event-card--place{ border-left:3px solid #22C55E; }

#view-discover .empty-state{ color:rgba(255,255,255,.6); }
#view-discover .map-mock{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); }
#view-discover .map-tag{ background:rgba(20,33,61,.85); color:#fff; border:1px solid rgba(255,255,255,.2); }

/* ---- compacte le bandeau "Tout voir" comme celui d'"Autour de moi" ---- */
#view-discover .locate-bar{
  background:linear-gradient(135deg, rgba(242,134,75,0.16), rgba(139,108,242,0.16)) !important;
  border:1px solid rgba(255,255,255,0.14);
  border-radius:18px !important;
  padding:16px 18px 14px !important;
  min-height:0 !important;
  display:block !important;
  position:relative;
  overflow:hidden;
  color:#fff;
}
#view-discover .locate-bar::before{
  content:""; position:absolute; top:-30px; right:-20px; width:90px; height:90px; border-radius:50%;
  background:radial-gradient(circle, rgba(242,134,75,0.4), transparent 70%); filter:blur(24px); pointer-events:none;
}
#view-discover .locate-bar::after{
  content:""; position:absolute; bottom:-30px; left:-20px; width:80px; height:80px; border-radius:50%;
  background:radial-gradient(circle, rgba(139,108,242,0.35), transparent 70%); filter:blur(24px); pointer-events:none;
}
#view-discover .locate-bar-photo{
  position:relative !important; height:auto !important; background-image:none !important; opacity:1 !important;
  border-radius:0 !important; text-align:center;
}
#view-discover .locate-bar-photo::after{ content:none !important; }
#view-discover .locate-info{ position:relative; margin-bottom:0 !important; }
#view-discover .locate-label{ font-size:10px; }
#view-discover .locate-value{ display:block; font-size:22px; font-weight:700; margin-top:2px; }
#view-discover #weather-mini{ display:block; font-style:italic; font-weight:500; font-size:12.5px; color:rgba(255,255,255,.78); margin:3px 0 0 !important; }

/* Boutons flottants (photo souvenir, etc.) : positionnés par défaut par rapport au bord de
   l'écran (mobile, où le site occupe toute la largeur). Au-delà de 600px de large, le site
   s'affiche dans une colonne centrée de 480px max (voir règle plus haut) — sans cette règle,
   un bouton "position:fixed; right:18px" se retrouve caché tout à droite de la fenêtre,
   en dehors de cette colonne visible. */
@media (min-width: 600px) {
  #souvenir-fab { right: max(18px, calc(50vw - 222px)) !important; }
}
