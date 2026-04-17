import { useState, useEffect, useRef } from "react";

// ─── STORAGE HELPERS ────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "admin1234"; // tu amigo puede cambiarlo
const STORAGE_KEY = "novelaplatform_v1";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { works: [] };
  } catch {
    return { works: [] };
  }
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────
const SAMPLE = {
  works: [
    {
      id: "w1",
      title: "Sombras del Vacío",
      type: "novel",
      cover: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&q=80",
      synopsis: "En un mundo donde la oscuridad es tangible, un joven descubre que lleva en su sangre el poder de moldear las sombras. Una épica de redención, traición y sacrificio que desafiará todo lo que conoces sobre el bien y el mal.",
      genre: "Fantasía Oscura",
      status: "En emisión",
      chapters: [
        { id: "c1", number: 1, title: "El Despertar", date: "2025-01-10", summary: "Todo comienza cuando la oscuridad llama a su nombre." },
        { id: "c2", number: 2, title: "La Primera Sombra", date: "2025-01-17", summary: "Aprende a controlar lo que siempre fue suyo." },
        { id: "c3", number: 3, title: "Sangre y Penumbra", date: "2025-01-24", summary: "El precio del poder se revela cruento." },
      ],
      nextChapterDate: (() => {
        const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split("T")[0];
      })(),
      nextChapterNumber: 4,
    },
    {
      id: "w2",
      title: "Código Eterno",
      type: "comic",
      cover: "https://images.unsplash.com/photo-1601513445506-2ab0d4fb4229?w=400&q=80",
      synopsis: "Un hacker en 2157 descubre que el universo entero es un programa… y alguien lo está cerrando. Acción trepidante, distopía cyberpunk y filosofía existencial en cada página.",
      genre: "Cyberpunk / Sci-Fi",
      status: "En emisión",
      chapters: [
        { id: "c4", number: 1, title: "Glitch", date: "2025-01-05", summary: "El primer error en la Matrix de la realidad." },
        { id: "c5", number: 2, title: "Root Access", date: "2025-01-12", summary: "Accede al núcleo del universo." },
      ],
      nextChapterDate: (() => {
        const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split("T")[0];
      })(),
      nextChapterNumber: 3,
    },
  ],
};

// ─── UTILITIES ───────────────────────────────────────────────────────────────
function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target - today) / 86400000);
  return diff;
}
function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const G = {
  bg: "#080810",
  surface: "#0f0f1a",
  card: "#13131f",
  border: "#1e1e30",
  accent: "#e63946",
  accentGlow: "rgba(230,57,70,0.3)",
  gold: "#ffd166",
  text: "#f0eee8",
  muted: "#8888aa",
  green: "#06d6a0",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Space+Mono:wght@400;700&family=Nunito:wght@400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${G.bg};color:${G.text};font-family:'Nunito',sans-serif;min-height:100vh;overflow-x:hidden}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${G.bg}}::-webkit-scrollbar-thumb{background:${G.accent};border-radius:3px}
  input,textarea,select{background:${G.surface};color:${G.text};border:1px solid ${G.border};border-radius:8px;padding:10px 14px;font-family:'Nunito',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color .2s}
  input:focus,textarea:focus,select:focus{border-color:${G.accent}}
  textarea{resize:vertical;min-height:80px}
  button{cursor:pointer;font-family:'Nunito',sans-serif;font-weight:700;border:none;border-radius:8px;transition:all .2s}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 ${G.accentGlow}}50%{box-shadow:0 0 20px 6px ${G.accentGlow}}}
  @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes countIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
`;

// ─── COUNTDOWN BADGE ─────────────────────────────────────────────────────────
function CountdownBadge({ dateStr, chapterNum }) {
  const days = daysUntil(dateStr);
  const color = days <= 1 ? G.green : days <= 3 ? G.gold : G.accent;
  const label = days < 0 ? "Disponible" : days === 0 ? "¡HOY!" : days === 1 ? "Mañana" : `${days} días`;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}22, ${color}11)`,
      border: `1px solid ${color}66`,
      borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
      animation: days <= 1 ? "pulse 2s infinite" : "none",
    }}>
      <div style={{ fontSize: 22 }}>{days <= 0 ? "🟢" : days <= 3 ? "⚡" : "📅"}</div>
      <div>
        <div style={{ fontSize: 10, color: G.muted, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'Space Mono'" }}>Próximo capítulo</div>
        <div style={{ color, fontWeight: 700, fontSize: 14, fontFamily: "'Space Mono'" }}>
          Cap. {chapterNum} — {label}
        </div>
        <div style={{ fontSize: 11, color: G.muted }}>{formatDate(dateStr)}</div>
      </div>
    </div>
  );
}

// ─── TICKER ──────────────────────────────────────────────────────────────────
function NewsTicker({ works }) {
  const items = works.flatMap(w => {
    const days = daysUntil(w.nextChapterDate);
    if (days >= 0 && days <= 7)
      return [`⚡ ${w.title} — Cap. ${w.nextChapterNumber} en ${days === 0 ? "¡HOY!" : days + " días"}`];
    return [];
  });
  if (!items.length) return null;
  const text = [...items, ...items].join("   ·   ");
  return (
    <div style={{ background: G.accent, overflow: "hidden", whiteSpace: "nowrap", padding: "8px 0", fontSize: 13, fontFamily: "'Space Mono'", letterSpacing: .5 }}>
      <span style={{ display: "inline-block", animation: "ticker 18s linear infinite" }}>{text}&nbsp;&nbsp;&nbsp;{text}</span>
    </div>
  );
}

// ─── WORK CARD (PUBLIC) ───────────────────────────────────────────────────────
function WorkCard({ work, onClick }) {
  const [hov, setHov] = useState(false);
  const typeColor = work.type === "novel" ? G.gold : G.accent;
  return (
    <div
      onClick={() => onClick(work)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: G.card, border: `1px solid ${hov ? G.accent : G.border}`,
        borderRadius: 16, overflow: "hidden", cursor: "pointer",
        transform: hov ? "translateY(-6px) scale(1.01)" : "none",
        transition: "all .25s", boxShadow: hov ? `0 16px 40px ${G.accentGlow}` : "none",
        animation: "fadeUp .5s ease both",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>
        <img src={work.cover} alt={work.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s", transform: hov ? "scale(1.07)" : "scale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080810ee 40%, transparent)" }} />
        <div style={{ position: "absolute", top: 12, left: 12, background: typeColor, color: "#000", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, fontFamily: "'Space Mono'", textTransform: "uppercase" }}>
          {work.type === "novel" ? "📖 Novela" : "🎨 Cómic"}
        </div>
        <div style={{ position: "absolute", top: 12, right: 12, background: "#00000099", color: G.green, fontSize: 10, padding: "4px 10px", borderRadius: 20, border: `1px solid ${G.green}55`, fontFamily: "'Space Mono'" }}>
          {work.status}
        </div>
      </div>
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ fontSize: 11, color: typeColor, fontFamily: "'Space Mono'", marginBottom: 6, letterSpacing: 1 }}>{work.genre}</div>
        <div style={{ fontFamily: "'Playfair Display'", fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginBottom: 8 }}>{work.title}</div>
        <div style={{ fontSize: 13, color: G.muted, lineHeight: 1.6, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {work.synopsis}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
          <span style={{ background: G.border, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: G.muted }}>
            {work.chapters.length} cap{work.chapters.length !== 1 ? "s" : ""}. publicados
          </span>
        </div>
        <CountdownBadge dateStr={work.nextChapterDate} chapterNum={work.nextChapterNumber} />
      </div>
    </div>
  );
}

// ─── WORK DETAIL (PUBLIC) ─────────────────────────────────────────────────────
function WorkDetail({ work, onBack }) {
  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      <button onClick={onBack} style={{ background: "none", color: G.muted, border: `1px solid ${G.border}`, padding: "8px 18px", borderRadius: 8, marginBottom: 32, display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
        ← Volver
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 40, marginBottom: 48 }}>
        <div>
          <img src={work.cover} alt={work.title} style={{ width: "100%", borderRadius: 16, boxShadow: `0 20px 60px ${G.accentGlow}` }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: G.gold, fontFamily: "'Space Mono'", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>
            {work.type === "novel" ? "📖 Novela" : "🎨 Cómic"} · {work.genre}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display'", fontSize: 44, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>{work.title}</h1>
          <p style={{ color: G.muted, lineHeight: 1.8, fontSize: 15, marginBottom: 28 }}>{work.synopsis}</p>
          <CountdownBadge dateStr={work.nextChapterDate} chapterNum={work.nextChapterNumber} />
        </div>
      </div>

      <h2 style={{ fontFamily: "'Playfair Display'", fontSize: 28, marginBottom: 24, borderBottom: `1px solid ${G.border}`, paddingBottom: 16 }}>
        Capítulos publicados
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[...work.chapters].reverse().map((ch, i) => (
          <div key={ch.id} style={{
            background: G.card, border: `1px solid ${G.border}`, borderRadius: 12,
            padding: "18px 22px", display: "flex", gap: 20, alignItems: "flex-start",
            animation: `fadeUp .4s ease ${i * 0.05}s both`,
          }}>
            <div style={{ background: G.accent, color: "#fff", fontFamily: "'Space Mono'", fontSize: 13, fontWeight: 700, padding: "6px 12px", borderRadius: 8, minWidth: 60, textAlign: "center" }}>
              {String(ch.number).padStart(2, "0")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{ch.title}</div>
              <div style={{ color: G.muted, fontSize: 13, lineHeight: 1.6 }}>{ch.summary}</div>
            </div>
            <div style={{ color: G.muted, fontSize: 12, fontFamily: "'Space Mono'", whiteSpace: "nowrap" }}>{formatDate(ch.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PUBLIC VIEW ─────────────────────────────────────────────────────────────
function PublicView({ works, onAdminLogin }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = works.filter(w => {
    const matchType = filter === "all" || w.type === filter;
    const matchSearch = w.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* HEADER */}
      <header style={{
        background: `linear-gradient(180deg, ${G.surface} 0%, transparent 100%)`,
        borderBottom: `1px solid ${G.border}`, padding: "0 40px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display'", fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>
              <span style={{ color: G.accent }}>NEXUS</span>
              <span style={{ color: G.text }}>STORIES</span>
            </div>
            <div style={{ fontSize: 11, color: G.muted, fontFamily: "'Space Mono'", letterSpacing: 2 }}>NOVELAS & CÓMICS</div>
          </div>
          <button onClick={onAdminLogin} style={{
            background: "none", color: G.muted, border: `1px solid ${G.border}`,
            padding: "8px 18px", borderRadius: 8, fontSize: 13,
          }}>
            🔐 Admin
          </button>
        </div>
      </header>

      <NewsTicker works={works} />

      {/* HERO */}
      {!selected && (
        <div style={{
          textAlign: "center", padding: "70px 40px 40px",
          background: `radial-gradient(ellipse at 50% 0%, ${G.accentGlow} 0%, transparent 60%)`,
        }}>
          <div style={{ fontSize: 12, color: G.accent, fontFamily: "'Space Mono'", letterSpacing: 3, marginBottom: 16 }}>— PLATAFORMA OFICIAL —</div>
          <h1 style={{ fontFamily: "'Playfair Display'", fontSize: "clamp(36px,6vw,72px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 20 }}>
            Universos que<br /><em style={{ color: G.accent }}>cobran vida</em>
          </h1>
          <p style={{ color: G.muted, maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.7 }}>
            Novelas y cómics con actualizaciones semanales. Sigue el progreso de cada historia en tiempo real.
          </p>

          {/* FILTERS */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            {[["all","Todos"],["novel","Novelas 📖"],["comic","Cómics 🎨"]].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} style={{
                background: filter === val ? G.accent : G.card,
                color: filter === val ? "#fff" : G.muted,
                border: `1px solid ${filter === val ? G.accent : G.border}`,
                padding: "10px 22px", borderRadius: 40, fontSize: 14,
              }}>{label}</button>
            ))}
          </div>
          <div style={{ maxWidth: 400, margin: "0 auto" }}>
            <input placeholder="🔍 Buscar obra..." value={search} onChange={e => setSearch(e.target.value)} style={{ textAlign: "center" }} />
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: selected ? "40px" : "20px 40px 60px" }}>
        {selected ? (
          <WorkDetail work={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", color: G.muted, padding: "60px 0", fontSize: 16 }}>No se encontraron obras.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 28 }}>
                {filtered.map(w => <WorkCard key={w.id} work={w} onClick={setSelected} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── LOGIN MODAL ──────────────────────────────────────────────────────────────
function LoginModal({ onSuccess, onCancel }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (pw === ADMIN_PASSWORD) { onSuccess(); }
    else {
      setErr(true); setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000cc", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 9999,
      backdropFilter: "blur(8px)",
    }}>
      <div style={{
        background: G.card, border: `1px solid ${G.border}`, borderRadius: 20,
        padding: 40, width: 360, textAlign: "center",
        animation: shake ? "none" : "fadeUp .3s ease",
        transform: shake ? "translateX(-8px)" : "none",
        transition: "transform .1s",
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
        <h2 style={{ fontFamily: "'Playfair Display'", fontSize: 24, marginBottom: 8 }}>Acceso Admin</h2>
        <p style={{ color: G.muted, fontSize: 13, marginBottom: 24 }}>Introduce la contraseña de administrador</p>
        <input
          type="password" placeholder="Contraseña" value={pw}
          onChange={e => { setPw(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && attempt()}
          style={{ marginBottom: 8, borderColor: err ? G.accent : G.border }}
          autoFocus
        />
        {err && <div style={{ color: G.accent, fontSize: 13, marginBottom: 12 }}>Contraseña incorrecta</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onCancel} style={{ flex: 1, background: G.surface, color: G.muted, border: `1px solid ${G.border}`, padding: "12px" }}>Cancelar</button>
          <button onClick={attempt} style={{ flex: 1, background: G.accent, color: "#fff", padding: "12px" }}>Entrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView({ data, setData, onLogout }) {
  const [tab, setTab] = useState("works"); // works | add-work | add-chapter
  const [editWork, setEditWork] = useState(null);
  const [addChapterTo, setAddChapterTo] = useState(null);
  const [preview, setPreview] = useState(null); // preview mode
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const deleteWork = (id) => {
    if (!window.confirm("¿Eliminar esta obra permanentemente?")) return;
    setData(d => { const nd = { ...d, works: d.works.filter(w => w.id !== id) }; saveData(nd); return nd; });
    showToast("Obra eliminada");
  };
  const deleteChapter = (workId, chapId) => {
    if (!window.confirm("¿Eliminar este capítulo?")) return;
    setData(d => {
      const nd = { ...d, works: d.works.map(w => w.id === workId ? { ...w, chapters: w.chapters.filter(c => c.id !== chapId) } : w) };
      saveData(nd); return nd;
    });
    showToast("Capítulo eliminado");
  };

  if (preview) {
    return (
      <div>
        <div style={{ background: G.accent, padding: "10px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: 700 }}>👁 Vista previa pública</span>
          <button onClick={() => setPreview(null)} style={{ background: "#00000033", color: "#fff", border: "none", padding: "6px 16px", borderRadius: 6, fontSize: 13 }}>← Salir del preview</button>
        </div>
        <PublicView works={data.works} onAdminLogin={() => {}} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* TOP BAR */}
      <div style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "16px 32px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ fontFamily: "'Playfair Display'", fontSize: 22, fontWeight: 900 }}>
          <span style={{ color: G.accent }}>NEXUS</span> Admin
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setPreview(true)} style={{ background: G.gold + "22", color: G.gold, border: `1px solid ${G.gold}44`, padding: "9px 18px", borderRadius: 8, fontSize: 13 }}>
          👁 Ver sitio público
        </button>
        <button onClick={onLogout} style={{ background: G.accent + "22", color: G.accent, border: `1px solid ${G.accent}44`, padding: "9px 18px", borderRadius: 8, fontSize: 13 }}>
          Cerrar sesión
        </button>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 32, right: 32, background: toast.type === "ok" ? G.green : G.accent,
          color: "#000", padding: "14px 24px", borderRadius: 12, fontWeight: 700, zIndex: 999, fontSize: 14,
          animation: "fadeUp .3s ease",
        }}>
          {toast.type === "ok" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", flex: 1 }}>
        {/* SIDEBAR */}
        <div style={{ width: 220, background: G.card, borderRight: `1px solid ${G.border}`, padding: "24px 0" }}>
          {[["works","📚 Mis Obras"],["add-work","➕ Nueva Obra"]].map(([id,label]) => (
            <button key={id} onClick={() => { setTab(id); setEditWork(null); setAddChapterTo(null); }} style={{
              width: "100%", textAlign: "left", padding: "13px 24px", background: tab === id ? G.accent + "22" : "none",
              color: tab === id ? G.accent : G.muted, borderLeft: tab === id ? `3px solid ${G.accent}` : "3px solid transparent",
              fontSize: 14, fontWeight: 600,
            }}>{label}</button>
          ))}
          <div style={{ margin: "20px 24px", borderTop: `1px solid ${G.border}` }} />
          <div style={{ padding: "0 24px 8px", fontSize: 11, color: G.muted, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'Space Mono'" }}>Estadísticas</div>
          <div style={{ padding: "8px 24px" }}>
            <div style={{ color: G.text, fontSize: 28, fontFamily: "'Playfair Display'", fontWeight: 900 }}>{data.works.length}</div>
            <div style={{ color: G.muted, fontSize: 12 }}>obras publicadas</div>
          </div>
          <div style={{ padding: "8px 24px" }}>
            <div style={{ color: G.text, fontSize: 28, fontFamily: "'Playfair Display'", fontWeight: 900 }}>
              {data.works.reduce((a, w) => a + w.chapters.length, 0)}
            </div>
            <div style={{ color: G.muted, fontSize: 12 }}>capítulos totales</div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, padding: "36px 40px", overflowY: "auto" }}>
          {tab === "works" && !editWork && !addChapterTo && <WorksList data={data} setData={setData} onEdit={setEditWork} onAddChapter={setAddChapterTo} onDelete={deleteWork} onDeleteChapter={deleteChapter} showToast={showToast} />}
          {(tab === "add-work" || editWork) && <WorkForm data={data} setData={setData} initial={editWork} onDone={() => { setTab("works"); setEditWork(null); }} showToast={showToast} />}
          {addChapterTo && <ChapterForm data={data} setData={setData} workId={addChapterTo} onDone={() => setAddChapterTo(null)} showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}

// ─── WORKS LIST (ADMIN) ───────────────────────────────────────────────────────
function WorksList({ data, setData, onEdit, onAddChapter, onDelete, onDeleteChapter, showToast }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display'", fontSize: 32, marginBottom: 28 }}>Mis Obras</h2>
      {data.works.length === 0 && (
        <div style={{ textAlign: "center", color: G.muted, padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div>Aún no tienes obras. ¡Crea tu primera!</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {data.works.map(work => (
          <div key={work.id} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", display: "flex", gap: 20, alignItems: "flex-start" }}>
              <img src={work.cover} alt={work.title} style={{ width: 80, height: 110, objectFit: "cover", borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Playfair Display'", fontSize: 20, fontWeight: 700 }}>{work.title}</span>
                  <span style={{ background: work.type === "novel" ? G.gold + "33" : G.accent + "33", color: work.type === "novel" ? G.gold : G.accent, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: "'Space Mono'" }}>
                    {work.type === "novel" ? "Novela" : "Cómic"}
                  </span>
                </div>
                <div style={{ color: G.muted, fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>{work.synopsis.slice(0, 120)}...</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => onEdit(work)} style={{ background: G.surface, color: G.text, border: `1px solid ${G.border}`, padding: "8px 16px", fontSize: 13, borderRadius: 8 }}>✏️ Editar obra</button>
                  <button onClick={() => onAddChapter(work.id)} style={{ background: G.accent + "22", color: G.accent, border: `1px solid ${G.accent}44`, padding: "8px 16px", fontSize: 13, borderRadius: 8 }}>➕ Añadir capítulo</button>
                  <button onClick={() => onDelete(work.id)} style={{ background: "none", color: "#ff6b6b", border: `1px solid #ff6b6b44`, padding: "8px 16px", fontSize: 13, borderRadius: 8 }}>🗑 Eliminar</button>
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 140 }}>
                <CountdownBadge dateStr={work.nextChapterDate} chapterNum={work.nextChapterNumber} />
              </div>
            </div>

            {/* CHAPTERS */}
            {work.chapters.length > 0 && (
              <div style={{ borderTop: `1px solid ${G.border}`, padding: "16px 24px" }}>
                <div style={{ fontSize: 12, color: G.muted, fontFamily: "'Space Mono'", marginBottom: 12, letterSpacing: 1 }}>CAPÍTULOS ({work.chapters.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...work.chapters].reverse().map(ch => (
                    <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: G.surface, borderRadius: 8 }}>
                      <span style={{ background: G.accent, color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 6, fontFamily: "'Space Mono'", fontWeight: 700 }}>
                        {String(ch.number).padStart(2, "0")}
                      </span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{ch.title}</span>
                      <span style={{ color: G.muted, fontSize: 12, fontFamily: "'Space Mono'" }}>{formatDate(ch.date)}</span>
                      <button onClick={() => onDeleteChapter(work.id, ch.id)} style={{ background: "none", color: "#ff6b6b", border: "none", fontSize: 16, padding: "0 4px" }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WORK FORM ────────────────────────────────────────────────────────────────
function WorkForm({ data, setData, initial, onDone, showToast }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial ? { ...initial } : {
    title: "", type: "novel", synopsis: "", genre: "", status: "En emisión",
    cover: "", nextChapterDate: "", nextChapterNumber: 1,
  });
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCoverFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const b64 = await fileToBase64(file);
    set("cover", b64);
    setUploading(false);
  };

  const save = () => {
    if (!form.title.trim() || !form.synopsis.trim() || !form.nextChapterDate) {
      showToast("Completa todos los campos requeridos", "err"); return;
    }
    if (isEdit) {
      setData(d => {
        const nd = { ...d, works: d.works.map(w => w.id === form.id ? { ...form } : w) };
        saveData(nd); return nd;
      });
      showToast("Obra actualizada ✨");
    } else {
      const newWork = { ...form, id: uid(), chapters: [] };
      setData(d => { const nd = { ...d, works: [...d.works, newWork] }; saveData(nd); return nd; });
      showToast("Obra creada 🎉");
    }
    onDone();
  };

  const Label = ({ children, required }) => (
    <div style={{ fontSize: 12, color: G.muted, fontFamily: "'Space Mono'", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: G.accent }}> *</span>}
    </div>
  );

  return (
    <div style={{ maxWidth: 680, animation: "fadeUp .4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button onClick={onDone} style={{ background: "none", color: G.muted, border: `1px solid ${G.border}`, padding: "8px 16px", borderRadius: 8, fontSize: 13 }}>← Volver</button>
        <h2 style={{ fontFamily: "'Playfair Display'", fontSize: 28 }}>{isEdit ? "Editar obra" : "Nueva obra"}</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Label required>Título</Label>
          <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Título de la obra" />
        </div>
        <div>
          <Label required>Tipo</Label>
          <select value={form.type} onChange={e => set("type", e.target.value)}>
            <option value="novel">📖 Novela</option>
            <option value="comic">🎨 Cómic</option>
          </select>
        </div>
        <div>
          <Label>Estado</Label>
          <select value={form.status} onChange={e => set("status", e.target.value)}>
            <option>En emisión</option>
            <option>Completada</option>
            <option>Pausada</option>
            <option>Próximamente</option>
          </select>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <Label>Género</Label>
          <input value={form.genre} onChange={e => set("genre", e.target.value)} placeholder="Ej: Fantasía oscura, Cyberpunk, Romance..." />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <Label required>Sinopsis</Label>
          <textarea value={form.synopsis} onChange={e => set("synopsis", e.target.value)} placeholder="Descripción de la obra..." rows={4} />
        </div>

        {/* COVER */}
        <div style={{ gridColumn: "1/-1" }}>
          <Label>Portada</Label>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", background: G.surface, border: `2px dashed ${G.border}`, borderRadius: 12, padding: "20px", textAlign: "center", cursor: "pointer", color: G.muted, fontSize: 14, transition: "border-color .2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = G.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = G.border}
                >
                  {uploading ? "⏳ Subiendo..." : "📁 Haz clic para subir imagen"}
                  <input type="file" accept="image/*" onChange={handleCoverFile} style={{ display: "none" }} />
                </label>
              </div>
              <div style={{ fontSize: 12, color: G.muted, marginBottom: 6 }}>O pega una URL:</div>
              <input value={form.cover.startsWith("data:") ? "" : form.cover} onChange={e => set("cover", e.target.value)} placeholder="https://..." />
            </div>
            {form.cover && (
              <img src={form.cover} alt="Portada" style={{ width: 100, height: 140, objectFit: "cover", borderRadius: 10, border: `1px solid ${G.border}` }} />
            )}
          </div>
        </div>

        <div>
          <Label required>Fecha próximo cap.</Label>
          <input type="date" value={form.nextChapterDate} onChange={e => set("nextChapterDate", e.target.value)} />
        </div>
        <div>
          <Label>N° próximo capítulo</Label>
          <input type="number" value={form.nextChapterNumber} min={1} onChange={e => set("nextChapterNumber", Number(e.target.value))} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button onClick={onDone} style={{ flex: 1, background: G.surface, color: G.muted, border: `1px solid ${G.border}`, padding: "14px" }}>Cancelar</button>
        <button onClick={save} style={{ flex: 2, background: G.accent, color: "#fff", padding: "14px", fontSize: 16 }}>
          {isEdit ? "💾 Guardar cambios" : "🚀 Publicar obra"}
        </button>
      </div>
    </div>
  );
}

// ─── CHAPTER FORM ─────────────────────────────────────────────────────────────
function ChapterForm({ data, setData, workId, onDone, showToast }) {
  const work = data.works.find(w => w.id === workId);
  const nextNum = work ? work.chapters.length + 1 : 1;
  const [form, setForm] = useState({
    number: nextNum, title: "", date: new Date().toISOString().split("T")[0], summary: "",
  });
  const [nextDate, setNextDate] = useState(work?.nextChapterDate || "");
  const [nextNum2, setNextNum2] = useState(work ? work.nextChapterNumber + 1 : nextNum + 1);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.title.trim()) { showToast("El capítulo necesita título", "err"); return; }
    const newChap = { ...form, id: uid(), number: Number(form.number) };
    setData(d => {
      const nd = {
        ...d, works: d.works.map(w => w.id === workId ? {
          ...w,
          chapters: [...w.chapters, newChap],
          nextChapterDate: nextDate,
          nextChapterNumber: Number(nextNum2),
        } : w),
      };
      saveData(nd); return nd;
    });
    showToast("¡Capítulo publicado! 🎉");
    onDone();
  };

  const Label = ({ children }) => (
    <div style={{ fontSize: 12, color: G.muted, fontFamily: "'Space Mono'", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{children}</div>
  );

  return (
    <div style={{ maxWidth: 620, animation: "fadeUp .4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button onClick={onDone} style={{ background: "none", color: G.muted, border: `1px solid ${G.border}`, padding: "8px 16px", borderRadius: 8, fontSize: 13 }}>← Volver</button>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display'", fontSize: 28 }}>Nuevo capítulo</h2>
          <div style={{ color: G.muted, fontSize: 13 }}>{work?.title}</div>
        </div>
      </div>

      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16 }}>
          <div>
            <Label>N° Capítulo</Label>
            <input type="number" value={form.number} min={1} onChange={e => set("number", e.target.value)} />
          </div>
          <div>
            <Label>Título del capítulo</Label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ej: El despertar..." />
          </div>
        </div>
        <div>
          <Label>Fecha de publicación</Label>
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
        </div>
        <div>
          <Label>Resumen / descripción</Label>
          <textarea value={form.summary} onChange={e => set("summary", e.target.value)} placeholder="Breve descripción de lo que ocurre en este capítulo..." rows={3} />
        </div>

        <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 20 }}>
          <div style={{ fontSize: 13, color: G.gold, fontWeight: 700, marginBottom: 14 }}>📅 Actualizar fecha del próximo capítulo</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <Label>Fecha próximo cap.</Label>
              <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} />
            </div>
            <div>
              <Label>N° próximo cap.</Label>
              <input type="number" value={nextNum2} min={1} onChange={e => setNextNum2(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onDone} style={{ flex: 1, background: G.surface, color: G.muted, border: `1px solid ${G.border}`, padding: "14px" }}>Cancelar</button>
          <button onClick={save} style={{ flex: 2, background: G.accent, color: "#fff", padding: "14px", fontSize: 16 }}>
            📤 Publicar capítulo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(() => {
    const stored = loadData();
    if (!stored.works.length) { saveData(SAMPLE); return SAMPLE; }
    return stored;
  });
  const [showLogin, setShowLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <>
      <style>{css}</style>
      {showLogin && !isAdmin && (
        <LoginModal
          onSuccess={() => { setIsAdmin(true); setShowLogin(false); }}
          onCancel={() => setShowLogin(false)}
        />
      )}
      {isAdmin ? (
        <AdminView data={data} setData={setData} onLogout={() => setIsAdmin(false)} />
      ) : (
        <PublicView works={data.works} onAdminLogin={() => setShowLogin(true)} />
      )}
    </>
  );
}
