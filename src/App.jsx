import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { key: "ai", label: "AI Chat", icon: "🧠" },
  { key: "predictions", label: "Predictions", icon: "🎯" },
  { key: "scores", label: "Scores & Box", icon: "📋" },
  { key: "stats", label: "Player Stats", icon: "📊" },
  { key: "situational", label: "Situational", icon: "🔬" },
  { key: "odds", label: "Odds & Lines", icon: "💰" },
];
const SAMPLE_Q = [
  "How do the Yankees perform on Sundays in day games?",
  "Compare Shohei Ohtani 2023 vs 2024 batting stats",
  "What team has the best record after being shutout?",
  "Top 5 pitchers by ERA in cold weather games",
  "Aaron Judge splits vs left-handed pitching L3 seasons",
  "Dodgers over/under trends at home this month",
  "Which closers have the best save % on the road?",
  "Teams that cover the run line most as road underdogs",
];
const TEAMS = [
  {id:109,name:"Arizona Diamondbacks",abbr:"ARI"},{id:144,name:"Atlanta Braves",abbr:"ATL"},{id:110,name:"Baltimore Orioles",abbr:"BAL"},{id:111,name:"Boston Red Sox",abbr:"BOS"},{id:112,name:"Chicago Cubs",abbr:"CHC"},{id:145,name:"Chicago White Sox",abbr:"CWS"},{id:113,name:"Cincinnati Reds",abbr:"CIN"},{id:114,name:"Cleveland Guardians",abbr:"CLE"},{id:115,name:"Colorado Rockies",abbr:"COL"},{id:116,name:"Detroit Tigers",abbr:"DET"},{id:117,name:"Houston Astros",abbr:"HOU"},{id:118,name:"Kansas City Royals",abbr:"KC"},{id:108,name:"Los Angeles Angels",abbr:"LAA"},{id:119,name:"Los Angeles Dodgers",abbr:"LAD"},{id:146,name:"Miami Marlins",abbr:"MIA"},{id:158,name:"Milwaukee Brewers",abbr:"MIL"},{id:142,name:"Minnesota Twins",abbr:"MIN"},{id:121,name:"New York Mets",abbr:"NYM"},{id:147,name:"New York Yankees",abbr:"NYY"},{id:133,name:"Oakland Athletics",abbr:"OAK"},{id:143,name:"Philadelphia Phillies",abbr:"PHI"},{id:134,name:"Pittsburgh Pirates",abbr:"PIT"},{id:135,name:"San Diego Padres",abbr:"SD"},{id:137,name:"San Francisco Giants",abbr:"SF"},{id:136,name:"Seattle Mariners",abbr:"SEA"},{id:138,name:"St. Louis Cardinals",abbr:"STL"},{id:139,name:"Tampa Bay Rays",abbr:"TB"},{id:140,name:"Texas Rangers",abbr:"TEX"},{id:141,name:"Toronto Blue Jays",abbr:"TOR"},{id:120,name:"Washington Nationals",abbr:"WSH"},
];
const MLB = "https://statsapi.mlb.com/api/v1";

// ═══════════════════════════════════════════════════════════════
// API HELPER
// ═══════════════════════════════════════════════════════════════
// When running on Vercel, Claude API calls go through a serverless
// proxy at /api/claude to keep your key secret.
// When running locally with VITE_ANTHROPIC_API_KEY set, calls go direct.

const claudeCall = async (system, messages, maxTok = 1000) => {
  // Try the serverless proxy first (production on Vercel)
  const useProxy = !import.meta.env.VITE_ANTHROPIC_API_KEY;

  const url = useProxy ? "/api/claude" : "https://api.anthropic.com/v1/messages";
  const headers = { "Content-Type": "application/json" };
  if (!useProxy) {
    headers["x-api-key"] = import.meta.env.VITE_ANTHROPIC_API_KEY;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }

  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTok,
    system,
    messages,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  };

  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const d = await r.json();
  return d.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "Error.";
};

// ═══════════════════════════════════════════════════════════════
// MARKDOWN
// ═══════════════════════════════════════════════════════════════
function Md({ text }) {
  if (!text) return null;
  const lines = text.split("\n"), el = []; let tR = [];
  const il = s => s.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff">$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code style="background:#1a1a1a;padding:1px 5px;border-radius:3px;font-size:0.88em;font-family:var(--mono)">$1</code>');
  const fT = () => {
    if (tR.length < 2) { tR = []; return; } const h = tR[0].split("|").filter(c => c.trim()), r = tR.slice(2);
    el.push(<div key={`t${el.length}`} style={{ overflowX: "auto", margin: "10px 0", borderRadius: 8, border: "1px solid var(--border)" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85em" }}><thead><tr style={{ background: "var(--surface)" }}>{h.map((c, i) => <th key={i} style={{ padding: "8px 12px", textAlign: "left", fontFamily: "var(--mono)", fontWeight: 700, color: "var(--red)", fontSize: "0.85em", borderBottom: "2px solid var(--red)", whiteSpace: "nowrap" }}>{c.trim()}</th>)}</tr></thead><tbody>{r.map((row, ri) => { const cells = row.split("|").filter(c => c.trim()); return <tr key={ri} style={{ borderBottom: "1px solid var(--border)" }}>{cells.map((c, ci) => <td key={ci} style={{ padding: "7px 12px", color: "var(--muted)", whiteSpace: "nowrap", fontFamily: ci > 0 ? "var(--mono)" : "var(--body)" }} dangerouslySetInnerHTML={{ __html: il(c.trim()) }} />)}</tr> })}</tbody></table></div>); tR = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]; if (l.includes("|") && l.trim().startsWith("|")) { tR.push(l); continue; } if (tR.length) fT();
    if (l.startsWith("### ")) el.push(<h4 key={i} style={{ color: "var(--red)", margin: "14px 0 4px", fontFamily: "var(--display)", fontSize: "0.95em" }}>{l.slice(4)}</h4>);
    else if (l.startsWith("## ")) el.push(<h3 key={i} style={{ color: "var(--red)", margin: "16px 0 6px", fontFamily: "var(--display)", fontSize: "1.05em" }}>{l.slice(3)}</h3>);
    else if (l.startsWith("# ")) el.push(<h2 key={i} style={{ color: "#fff", margin: "18px 0 8px", fontFamily: "var(--display)", fontSize: "1.2em" }}>{l.slice(2)}</h2>);
    else if (l.startsWith("- ") || l.startsWith("* ")) el.push(<div key={i} style={{ display: "flex", gap: 8, margin: "3px 0 3px 4px" }}><span style={{ color: "var(--red)", flexShrink: 0 }}>◆</span><span style={{ color: "var(--muted)", lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: il(l.slice(2)) }} /></div>);
    else if (l.match(/^\d+\.\s/)) { const n = l.match(/^(\d+)\.\s/)[1]; el.push(<div key={i} style={{ display: "flex", gap: 8, margin: "3px 0 3px 4px" }}><span style={{ color: "var(--red)", fontWeight: 700, fontFamily: "var(--mono)", minWidth: 18 }}>{n}.</span><span style={{ color: "var(--muted)", lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: il(l.replace(/^\d+\.\s/, "")) }} /></div>); }
    else if (l.trim() === "") el.push(<div key={i} style={{ height: 6 }} />);
    else el.push(<p key={i} style={{ margin: "3px 0", color: "var(--muted)", lineHeight: 1.6, fontSize: "0.93em" }} dangerouslySetInnerHTML={{ __html: il(l) }} />);
  } if (tR.length) fT(); return <>{el}</>;
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════
const CS = { padding: "5px 10px", fontFamily: "var(--mono)", fontSize: "0.78em", textAlign: "center", color: "var(--muted)" };
const HS = { ...CS, color: "var(--red)", fontWeight: 700, borderBottom: "1px solid var(--border)" };
const NS = { ...CS, textAlign: "left", fontFamily: "var(--body)", color: "#fff", fontWeight: 500 };
const Dots = () => <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: 20 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--red)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}</div>;
const Btn = ({ children, onClick, disabled, full }) => <button onClick={onClick} disabled={disabled} style={{ padding: full ? "14px" : "10px 22px", width: full ? "100%" : "auto", borderRadius: full ? 10 : 7, background: disabled ? "#333" : "var(--red)", color: "#fff", border: "none", fontWeight: 600, fontSize: full ? "0.95em" : "0.88em", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--body)", transition: "all 0.15s" }}>{children}</button>;

// ═══════════════ AI CHAT ═══════════════
function AIChat() {
  const [h, sH] = useState([]); const [inp, sI] = useState(""); const [ld, sL] = useState(false); const er = useRef(null);
  useEffect(() => { er.current?.scrollIntoView({ behavior: "smooth" }); }, [h, ld]);
  const send = async t => {
    const q = t || inp; if (!q.trim() || ld) return; const nh = [...h, { role: "user", content: q }]; sH(nh); sI(""); sL(true);
    try { const reply = await claudeCall(`You are an elite MLB analyst powering "Lippy Baseball." Deep expertise in stats, sabermetrics, splits, situational analysis, betting. Be precise. Use markdown tables. No fluff.`, nh.map(m => ({ role: m.role, content: m.content }))); sH(p => [...p, { role: "assistant", content: reply }]); } catch { sH(p => [...p, { role: "assistant", content: "Connection error." }]); } finally { sL(false); }
  };
  return (<div style={{ display: "flex", height: "calc(100vh - 120px)", animation: "fadeUp 0.3s ease" }}><div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
    <div style={{ flex: 1, overflowY: "auto", padding: "8px 0", display: "flex", flexDirection: "column", gap: 14 }}>
      {h.length === 0 && <div style={{ textAlign: "center", padding: "50px 20px" }}><div style={{ fontSize: 52, marginBottom: 14, opacity: 0.2 }}>⚾</div><h2 style={{ fontFamily: "var(--display)", fontSize: "1.5em", color: "#fff", marginBottom: 6 }}>Ask me anything about baseball</h2><p style={{ color: "var(--muted)", fontSize: "0.92em", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.55 }}>Player stats, trends, splits, betting analysis, records.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 560, margin: "0 auto" }}>{SAMPLE_Q.map((sq, i) => <button key={i} onClick={() => send(sq)} style={{ padding: "11px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--muted)", fontSize: "0.83em", cursor: "pointer", textAlign: "left", lineHeight: 1.4, fontFamily: "var(--body)", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--red)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}><span style={{ color: "var(--red)", marginRight: 5 }}>›</span>{sq}</button>)}</div></div>}
      {h.map((m, i) => <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation: "fadeUp 0.25s ease" }}><div style={{ maxWidth: m.role === "user" ? "65%" : "82%", padding: m.role === "user" ? "11px 16px" : "14px 18px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? "var(--red)" : "var(--surface)", border: m.role === "user" ? "none" : "1px solid var(--border)" }}>{m.role === "user" ? <p style={{ color: "#fff", lineHeight: 1.5, fontSize: "0.93em" }}>{m.content}</p> : <Md text={m.content} />}</div></div>)}
      {ld && <div style={{ display: "flex" }}><div style={{ padding: "14px 18px", borderRadius: "14px 14px 14px 4px", background: "var(--surface)", border: "1px solid var(--border)" }}><div style={{ display: "flex", gap: 6 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)", animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}</div></div></div>}
      <div ref={er} /></div>
    <div style={{ paddingTop: 12, borderTop: "1px solid var(--border)" }}><div style={{ display: "flex", gap: 8, background: "var(--surface)", borderRadius: 10, padding: 5, border: "1px solid var(--border)" }}><input value={inp} onChange={e => sI(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask about players, stats, trends, betting..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "0.95em", padding: "10px 12px", fontFamily: "var(--body)" }} /><Btn onClick={() => send()} disabled={ld || !inp.trim()}>{ld ? "..." : "Send"}</Btn></div></div>
  </div></div>);
}

// ═══════════════ PREDICTIONS ═══════════════
function Predictions() {
  const [aT, sAT] = useState(""); const [hT, sHT] = useState(""); const [pred, sP] = useState(null); const [ld, sL] = useState(false);
  const run = async () => {
    if (!aT || !hT || aT === hT) return; const a = TEAMS.find(t => t.abbr === aT), ho = TEAMS.find(t => t.abbr === hT); sL(true); sP(null);
    try { const tx = await claudeCall(`MLB prediction model. Predict TEAM TOTAL RUNS. Search web. Respond ONLY JSON: {"away_team":"ABBR","away_name":"Name","away_runs":4.5,"away_confidence":72,"home_team":"ABBR","home_name":"Name","home_runs":3.5,"home_confidence":68,"factors":["f1","f2","f3","f4"]}. No other text.`, [{ role: "user", content: `Predict: ${a.name} @ ${ho.name}. ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.` }]); const m = tx.match(/\{[\s\S]*\}/); sP(m ? JSON.parse(m[0]) : { error: "Failed." }); } catch { sP({ error: "Error." }); } finally { sL(false); }
  };
  const cc = c => c >= 75 ? "#22c55e" : c >= 60 ? "#eab308" : "#ef4444";
  const Sel = ({ v, onChange, label }) => <div style={{ flex: 1 }}><label style={{ display: "block", fontSize: "0.7em", color: "var(--muted)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</label><select value={v} onChange={onChange} style={{ width: "100%", padding: "10px 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "#fff", fontSize: "0.9em", fontFamily: "var(--body)", cursor: "pointer", outline: "none" }}><option value="">Select...</option>{TEAMS.map(t => <option key={t.abbr} value={t.abbr}>{t.abbr} — {t.name}</option>)}</select></div>;
  return (<div style={{ animation: "fadeUp 0.4s ease", maxWidth: 700, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: 32 }}><h2 style={{ fontFamily: "var(--display)", fontSize: "1.5em", color: "#fff", marginBottom: 4 }}>Team Total Runs</h2><p style={{ color: "var(--muted)", fontSize: "0.88em" }}>Select a matchup to predict run totals</p></div>
    <div style={{ display: "flex", alignItems: "center", gap: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 24 }}><Sel v={aT} onChange={e => sAT(e.target.value)} label="Away" /><div style={{ fontFamily: "var(--display)", fontSize: "1.3em", color: "var(--red)", fontWeight: 700, paddingTop: 18 }}>@</div><Sel v={hT} onChange={e => sHT(e.target.value)} label="Home" /></div>
    <Btn onClick={run} disabled={!aT || !hT || aT === hT || ld} full>{ld ? "Analyzing..." : "🎯 Predict Team Totals"}</Btn>
    <div style={{ marginBottom: 24 }} />
    {ld && <Dots />}
    {pred && !pred.error && !ld && <div style={{ animation: "fadeUp 0.4s ease" }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>{[{ l: "Away", t: pred.away_team, r: pred.away_runs, c: pred.away_confidence }, { l: "Home", t: pred.home_team, r: pred.home_runs, c: pred.home_confidence }].map((s, i) => <div key={i} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, textAlign: "center", borderTop: "3px solid var(--red)" }}><div style={{ fontFamily: "var(--mono)", fontSize: "0.7em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>{s.l}</div><div style={{ fontFamily: "var(--display)", fontSize: "1.3em", fontWeight: 700, color: "#fff", marginBottom: 12 }}>{s.t}</div><div style={{ fontFamily: "var(--mono)", fontSize: "2.8em", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{s.r}</div><div style={{ fontSize: "0.78em", color: "var(--muted)", marginTop: 4, marginBottom: 12 }}>runs</div><div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: `${cc(s.c)}18`, border: `1px solid ${cc(s.c)}40` }}><span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: "0.9em", color: cc(s.c) }}>{s.c}%</span></div></div>)}</div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}><span style={{ fontFamily: "var(--mono)", fontSize: "0.75em", color: "var(--muted)" }}>COMBINED</span><span style={{ fontFamily: "var(--mono)", fontSize: "1.5em", fontWeight: 700, color: "var(--red)" }}>{pred.away_runs + pred.home_runs}</span></div>
      {pred.factors && <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }}>{pred.factors.map((f, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ color: "var(--red)", flexShrink: 0, fontSize: "0.85em" }}>◆</span><span style={{ color: "var(--muted)", fontSize: "0.88em", lineHeight: 1.45 }}>{f}</span></div>)}</div>}
    </div>}
    {pred?.error && !ld && <div style={{ textAlign: "center", padding: 20, color: "var(--red)", fontFamily: "var(--mono)" }}>{pred.error}</div>}
  </div>);
}

// ═══════════════ ODDS ═══════════════
function OddsPanel() {
  const [od, sO] = useState(null); const [ld, sL] = useState(false); const [lf, sLF] = useState(null);
  const go = async () => {
    sL(true); try { const tx = await claudeCall(`MLB odds analyst. Search web for today's MLB odds. Return ONLY JSON: {"games":[{"away":"NYY","home":"BOS","time":"7:10 PM","away_ml":"-135","home_ml":"+115","away_imp":"57%","home_imp":"47%","rl_fav":"-1.5","rl_fav_o":"+130","rl_dog":"+1.5","rl_dog_o":"-155","total":"8.5","ov":"-110","un":"-110","a_sp":"G. Cole","h_sp":"B. Bello"}],"source":"Src","note":"Note"}. If none: {"games":[]}.`, [{ role: "user", content: `Today's MLB odds. ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.` }]); const m = tx.match(/\{[\s\S]*\}/); if (m) { sO(JSON.parse(m[0])); sLF(new Date().toLocaleTimeString()); } else sO({ error: "Failed." }); } catch { sO({ error: "Error." }); } finally { sL(false); }
  };
  const mc = ml => parseInt(ml) < 0 ? "#22c55e" : "#ef4444";
  return (<div style={{ animation: "fadeUp 0.4s ease" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}><div><h2 style={{ fontFamily: "var(--display)", fontSize: "1.5em", color: "#fff", marginBottom: 2 }}>Odds & Lines</h2><p style={{ color: "var(--muted)", fontSize: "0.85em" }}>{lf ? `Updated ${lf}` : "Click refresh"}</p></div><Btn onClick={go} disabled={ld}>{ld ? "Fetching..." : "🔄 Refresh"}</Btn></div>
    {ld && <Dots />}{!od && !ld && <div style={{ textAlign: "center", padding: "80px 20px" }}><div style={{ fontSize: 52, marginBottom: 14, opacity: 0.2 }}>💰</div><p style={{ color: "var(--muted)" }}>Hit Refresh to load today's lines</p></div>}
    {od?.error && !ld && <div style={{ textAlign: "center", padding: 30, color: "var(--red)" }}>{od.error}</div>}
    {od?.games && !od.error && !ld && <div>{od.games.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>No games today</div> : <>
      <div style={{ marginBottom: 16 }}><span style={{ padding: "4px 12px", borderRadius: 20, background: "var(--red)", fontSize: "0.72em", fontWeight: 600, color: "#fff" }}>{od.source || "Sportsbooks"}</span></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{od.games.map((g, gi) => <div key={gi} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1.05em" }}>{g.away}</span><span style={{ color: "var(--muted)" }}>@</span><span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1.05em" }}>{g.home}</span></div><div style={{ textAlign: "right" }}><div style={{ fontFamily: "var(--mono)", fontSize: "0.78em", color: "var(--muted)" }}>{g.time}</div>{(g.a_sp || g.h_sp) && <div style={{ fontFamily: "var(--mono)", fontSize: "0.68em", color: "rgba(255,255,255,0.3)" }}>{g.a_sp || "TBD"} vs {g.h_sp || "TBD"}</div>}</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div style={{ background: "var(--card)", borderRadius: 8, padding: "10px 14px" }}><div style={{ fontFamily: "var(--mono)", fontSize: "0.62em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>ML</div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: "0.82em", color: "var(--muted)" }}>{g.away}</span><span style={{ fontFamily: "var(--mono)", fontWeight: 600, color: mc(g.away_ml) }}>{g.away_ml}</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.82em", color: "var(--muted)" }}>{g.home}</span><span style={{ fontFamily: "var(--mono)", fontWeight: 600, color: mc(g.home_ml) }}>{g.home_ml}</span></div></div>
          <div style={{ background: "var(--card)", borderRadius: 8, padding: "10px 14px" }}><div style={{ fontFamily: "var(--mono)", fontSize: "0.62em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>RL</div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: "0.82em", color: "var(--muted)" }}>{g.rl_fav}</span><span style={{ fontFamily: "var(--mono)", fontWeight: 600, color: "var(--muted)" }}>{g.rl_fav_o}</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.82em", color: "var(--muted)" }}>{g.rl_dog}</span><span style={{ fontFamily: "var(--mono)", fontWeight: 600, color: "var(--muted)" }}>{g.rl_dog_o}</span></div></div>
          <div style={{ background: "var(--card)", borderRadius: 8, padding: "10px 14px" }}><div style={{ fontFamily: "var(--mono)", fontSize: "0.62em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>O/U</div><div style={{ textAlign: "center", marginBottom: 6 }}><span style={{ fontFamily: "var(--mono)", fontSize: "1.4em", fontWeight: 700, color: "#fff" }}>{g.total}</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.75em", color: "var(--muted)" }}>O {g.ov}</span><span style={{ fontSize: "0.75em", color: "var(--muted)" }}>U {g.un}</span></div></div>
        </div></div>)}</div></>}</div>}
  </div>);
}

// ═══════════════ SCORES ═══════════════
function ScoresPanel() {
  const [date, sD] = useState(new Date().toISOString().split("T")[0]); const [games, sG] = useState([]); const [ld, sL] = useState(false); const [exp, sE] = useState(null); const [box, sB] = useState(null); const [bld, sBL] = useState(false);
  useEffect(() => { sL(true); sE(null); sB(null); fetch(`${MLB}/schedule?sportId=1&date=${date}&hydrate=linescore,probablePitcher,team`).then(r => r.json()).then(d => { sG(d.dates?.[0]?.games || []); sL(false); }).catch(() => { sG([]); sL(false); }); }, [date]);
  const nav = o => { const d = new Date(date + "T12:00:00"); d.setDate(d.getDate() + o); sD(d.toISOString().split("T")[0]); };
  const fmt = d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const loadB = async pk => { if (exp === pk) { sE(null); sB(null); return; } sE(pk); sBL(true); try { const r = await fetch(`${MLB}.1/game/${pk}/feed/live`); sB(await r.json()); } catch { sB(null); } finally { sBL(false); } };
  const st = g => { const s = g.status?.detailedState; if (s === "Final" || s === "Game Over") return "Final"; if (s === "In Progress") return `${g.linescore?.inningHalf === "Top" ? "▲" : "▼"} ${g.linescore?.currentInning}`; if (s === "Scheduled" || s === "Pre-Game") return new Date(g.gameDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); return s || "TBD"; };
  const gB = (bs, s) => { const t = bs?.liveData?.boxscore?.teams?.[s]; if (!t) return []; return (t.battingOrder || []).map(id => { const p = t.players?.[`ID${id}`]; if (!p) return null; const x = p.stats?.batting || {}; return { n: p.person?.fullName, pos: p.position?.abbreviation, ab: x.atBats ?? "-", r: x.runs ?? "-", h: x.hits ?? "-", rbi: x.rbi ?? "-", bb: x.baseOnBalls ?? "-", so: x.strikeOuts ?? "-", avg: x.avg || "-" }; }).filter(Boolean); };
  const gP = (bs, s) => { const t = bs?.liveData?.boxscore?.teams?.[s]; if (!t) return []; return (t.pitchers || []).map(id => { const p = t.players?.[`ID${id}`]; if (!p) return null; const x = p.stats?.pitching || {}; return { n: p.person?.fullName, ip: x.inningsPitched ?? "-", h: x.hits ?? "-", r: x.runs ?? "-", er: x.earnedRuns ?? "-", bb: x.baseOnBalls ?? "-", so: x.strikeOuts ?? "-", era: x.era || "-" }; }).filter(Boolean); };
  return (<div style={{ animation: "fadeUp 0.4s ease" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 28 }}>
      <button onClick={() => nav(-1)} style={{ padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--muted)", cursor: "pointer", fontWeight: 600 }}>←</button>
      <div style={{ textAlign: "center", minWidth: 180 }}><div style={{ fontFamily: "var(--display)", fontSize: "1.2em", fontWeight: 700, color: "#fff" }}>{fmt(date)}</div><input type="date" value={date} onChange={e => sD(e.target.value)} style={{ background: "transparent", border: "none", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "0.72em", cursor: "pointer", textAlign: "center" }} /></div>
      <button onClick={() => nav(1)} style={{ padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--muted)", cursor: "pointer", fontWeight: 600 }}>→</button>
    </div>
    {ld && <Dots />}{!ld && games.length === 0 && <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>No games for this date</div>}
    {!ld && games.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {games.map((g, gi) => {
        const aw = g.teams?.away, hm = g.teams?.home, ls = g.linescore, iF = g.status?.detailedState === "Final" || g.status?.detailedState === "Game Over", iL = g.status?.detailedState === "In Progress", iX = exp === g.gamePk;
        return (<div key={g.gamePk}>
          <div onClick={() => loadB(g.gamePk)} style={{ background: "var(--surface)", border: `1px solid ${iX ? "var(--red)" : "var(--border)"}`, borderRadius: iX ? "12px 12px 0 0" : 12, padding: "14px 20px", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {[{ t: aw, s: "away" }, { t: hm, s: "home" }].map(({ t, s }) => <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontFamily: "var(--display)", fontWeight: 700, minWidth: 36 }}>{t?.team?.abbreviation}</span><span style={{ fontSize: "0.82em", color: "var(--muted)", flex: 1 }}>{t?.team?.name}</span>{(iF || iL) && <span style={{ fontFamily: "var(--mono)", fontSize: "1.3em", fontWeight: 700, color: t?.score > (s === "away" ? hm : aw)?.score ? "#fff" : "var(--muted)" }}>{t?.score}</span>}</div>)}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "0.82em", fontWeight: 600, color: iL ? "#22c55e" : "var(--muted)" }}>{st(g)}</div>
              <div style={{ color: "var(--muted)", fontSize: "0.8em", transform: iX ? "rotate(180deg)" : "" }}>▼</div>
            </div>
            {(iF || iL) && ls?.innings && <div style={{ marginTop: 10, overflowX: "auto" }}><table style={{ borderCollapse: "collapse", fontSize: "0.72em", fontFamily: "var(--mono)", width: "100%" }}><thead><tr><th style={{ padding: "3px 8px", textAlign: "left", color: "var(--muted)" }}></th>{ls.innings.map((_, ii) => <th key={ii} style={{ padding: "3px 6px", textAlign: "center", color: "var(--muted)" }}>{ii + 1}</th>)}<th style={{ padding: "3px 8px", textAlign: "center", color: "var(--red)", fontWeight: 700, borderLeft: "1px solid var(--border)" }}>R</th><th style={{ padding: "3px 8px", textAlign: "center", color: "var(--muted)" }}>H</th><th style={{ padding: "3px 8px", textAlign: "center", color: "var(--muted)" }}>E</th></tr></thead><tbody>
              {[{ t: aw, k: "away" }, { t: hm, k: "home" }].map(({ t, k }) => <tr key={k}><td style={{ padding: "3px 8px", color: "#fff", fontWeight: 600 }}>{t?.team?.abbreviation}</td>{ls.innings.map((inn, ii) => <td key={ii} style={{ padding: "3px 6px", textAlign: "center", color: "var(--muted)" }}>{inn[k]?.runs ?? "-"}</td>)}<td style={{ padding: "3px 8px", textAlign: "center", fontWeight: 700, color: "#fff", borderLeft: "1px solid var(--border)" }}>{ls.teams?.[k]?.runs ?? "-"}</td><td style={{ padding: "3px 8px", textAlign: "center", color: "var(--muted)" }}>{ls.teams?.[k]?.hits ?? "-"}</td><td style={{ padding: "3px 8px", textAlign: "center", color: "var(--muted)" }}>{ls.teams?.[k]?.errors ?? "-"}</td></tr>)}
            </tbody></table></div>}
          </div>
          {iX && <div style={{ background: "var(--card)", border: "1px solid var(--red)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 20 }}>
            {bld && <Dots />}
            {!bld && box && ["away", "home"].map(side => { const b = gB(box, side), p = gP(box, side), tm = side === "away" ? aw : hm; return (<div key={side}>
              {b.length > 0 && <div style={{ marginBottom: 16 }}><div style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--red)", textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>{tm?.team?.abbreviation} Batting</div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{["", "POS", "AB", "R", "H", "RBI", "BB", "SO", "AVG"].map(x => <th key={x} style={x === "" ? { ...HS, textAlign: "left", minWidth: 130 } : HS}>{x}</th>)}</tr></thead><tbody>{b.map((x, i) => <tr key={i}><td style={NS}>{x.n}</td><td style={{ ...CS, fontSize: "0.7em", color: "rgba(255,255,255,0.35)" }}>{x.pos}</td><td style={CS}>{x.ab}</td><td style={CS}>{x.r}</td><td style={CS}>{x.h}</td><td style={CS}>{x.rbi}</td><td style={CS}>{x.bb}</td><td style={CS}>{x.so}</td><td style={{ ...CS, color: "rgba(255,255,255,0.4)" }}>{x.avg}</td></tr>)}</tbody></table></div></div>}
              {p.length > 0 && <div style={{ marginBottom: 16 }}><div style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--red)", textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>{tm?.team?.abbreviation} Pitching</div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{["", "IP", "H", "R", "ER", "BB", "SO", "ERA"].map(x => <th key={x} style={x === "" ? { ...HS, textAlign: "left", minWidth: 130 } : HS}>{x}</th>)}</tr></thead><tbody>{p.map((x, i) => <tr key={i}><td style={NS}>{x.n}</td><td style={CS}>{x.ip}</td><td style={CS}>{x.h}</td><td style={CS}>{x.r}</td><td style={CS}>{x.er}</td><td style={CS}>{x.bb}</td><td style={CS}>{x.so}</td><td style={{ ...CS, color: "rgba(255,255,255,0.4)" }}>{x.era}</td></tr>)}</tbody></table></div></div>}
            </div>); })}
          </div>}
        </div>);
      })}
    </div>}
  </div>);
}

// ═══════════════ PLAYER STATS (ENHANCED) ═══════════════
function PlayerStats() {
  const [search, setSr] = useState(""); const [results, setR] = useState([]); const [sLd, setSLd] = useState(false);
  const [player, setPl] = useState(null); const [stats, setSt] = useState(null); const [splits, setSp] = useState(null);
  const [season, setSn] = useState(2024); const [ld, sL] = useState(false); const [splitTab, setSpT] = useState("season");
  const doSearch = async () => { if (!search.trim()) return; setSLd(true); try { const r = await fetch(`${MLB}/people/search?names=${encodeURIComponent(search)}&sportId=1`); const d = await r.json(); setR((d.people || []).slice(0, 10)); } catch { setR([]); } finally { setSLd(false); } };
  const loadP = async (p, yr) => {
    setPl(p); setR([]); sL(true); const isPit = p.primaryPosition?.code === "1"; const grp = isPit ? "pitching" : "hitting"; const y = yr || season;
    try {
      const [statsR, splitsR] = await Promise.all([
        fetch(`${MLB}/people/${p.id}/stats?stats=season,career,gameLog&group=${grp}&season=${y}&gameType=R`).then(r => r.json()),
        fetch(`${MLB}/people/${p.id}/stats?stats=byMonth,homeAndAway,dayAndNight,byDayOfWeek&group=${grp}&season=${y}&gameType=R`).then(r => r.json())
      ]);
      setSt(statsR); setSp(splitsR);
    } catch { setSt(null); setSp(null); } finally { sL(false); }
  };
  const chSn = y => { setSn(y); if (player) loadP(player, y); };
  const getSplit = (data, type) => { if (!data?.stats) return null; return data.stats.find(s => s.type?.displayName === type); };
  const seasonS = getSplit(stats, "season")?.splits?.[0]?.stat;
  const careerS = getSplit(stats, "career")?.splits?.[0]?.stat;
  const gameLog = (getSplit(stats, "gameLog")?.splits || []).slice(0, 20);
  const monthSplits = getSplit(splits, "byMonth")?.splits || [];
  const haS = getSplit(splits, "homeAndAway")?.splits || [];
  const dnS = getSplit(splits, "dayAndNight")?.splits || [];
  const dowS = getSplit(splits, "byDayOfWeek")?.splits || [];
  const isPit = player?.primaryPosition?.code === "1";
  const HiStat = ({ label, val }) => <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", textAlign: "center", borderTop: "2px solid var(--red)" }}><div style={{ fontFamily: "var(--mono)", fontSize: "0.62em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>{label}</div><div style={{ fontFamily: "var(--mono)", fontSize: "1.6em", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{val ?? "-"}</div></div>;
  const SplitsTable = ({ data, labelKey }) => {
    if (!data || data.length === 0) return <div style={{ color: "var(--muted)", fontSize: "0.85em", padding: 16 }}>No split data for {season}</div>;
    return <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
      {isPit ? <><thead><tr style={{ background: "var(--surface)" }}>{["Split", "G", "W", "L", "ERA", "IP", "H", "BB", "SO", "WHIP"].map(x => <th key={x} style={x === "Split" ? { ...HS, textAlign: "left", minWidth: 100 } : HS}>{x}</th>)}</tr></thead>
        <tbody>{data.map((s, i) => { const st = s.stat || {}; return <tr key={i}><td style={NS}>{s[labelKey] || s.split || "?"}</td><td style={CS}>{st.gamesPlayed ?? "-"}</td><td style={CS}>{st.wins ?? "-"}</td><td style={CS}>{st.losses ?? "-"}</td><td style={CS}>{st.era ?? "-"}</td><td style={CS}>{st.inningsPitched ?? "-"}</td><td style={CS}>{st.hits ?? "-"}</td><td style={CS}>{st.baseOnBalls ?? "-"}</td><td style={CS}>{st.strikeOuts ?? "-"}</td><td style={CS}>{st.whip ?? "-"}</td></tr> })}</tbody></>
        : <><thead><tr style={{ background: "var(--surface)" }}>{["Split", "G", "AB", "H", "HR", "RBI", "BB", "SO", "AVG", "OBP", "SLG", "OPS"].map(x => <th key={x} style={x === "Split" ? { ...HS, textAlign: "left", minWidth: 100 } : HS}>{x}</th>)}</tr></thead>
          <tbody>{data.map((s, i) => { const st = s.stat || {}; return <tr key={i}><td style={NS}>{s[labelKey] || s.split || "?"}</td><td style={CS}>{st.gamesPlayed ?? "-"}</td><td style={CS}>{st.atBats ?? "-"}</td><td style={CS}>{st.hits ?? "-"}</td><td style={CS}>{st.homeRuns ?? "-"}</td><td style={CS}>{st.rbi ?? "-"}</td><td style={CS}>{st.baseOnBalls ?? "-"}</td><td style={CS}>{st.strikeOuts ?? "-"}</td><td style={CS}>{st.avg ?? "-"}</td><td style={CS}>{st.obp ?? "-"}</td><td style={CS}>{st.slg ?? "-"}</td><td style={CS}>{st.ops ?? "-"}</td></tr> })}</tbody></>}
    </table></div>;
  };
  const splitTabs = [{ k: "season", l: "Season" }, { k: "career", l: "Career" }, { k: "gamelog", l: "Game Log" }, { k: "month", l: "By Month" }, { k: "ha", l: "Home/Away" }, { k: "dn", l: "Day/Night" }, { k: "dow", l: "Day of Week" }];
  return (<div style={{ animation: "fadeUp 0.4s ease", maxWidth: 1000, margin: "0 auto" }}>
    <div style={{ marginBottom: 24 }}><h2 style={{ fontFamily: "var(--display)", fontSize: "1.5em", color: "#fff", marginBottom: 12, textAlign: "center" }}>Player Stats</h2>
      <div style={{ display: "flex", gap: 8, background: "var(--surface)", borderRadius: 10, padding: 5, border: "1px solid var(--border)", maxWidth: 500, margin: "0 auto" }}><input value={search} onChange={e => setSr(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="Search player name..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "0.95em", padding: "10px 12px", fontFamily: "var(--body)" }} /><Btn onClick={doSearch} disabled={sLd || !search.trim()}>{sLd ? "..." : "Search"}</Btn></div>
      {results.length > 0 && <div style={{ maxWidth: 500, margin: "8px auto 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>{results.map((p, i) => <div key={p.id} onClick={() => loadP(p)} style={{ padding: "10px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none" }} onMouseEnter={e => e.currentTarget.style.background = "var(--card)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}><div><span style={{ color: "#fff", fontWeight: 600, fontSize: "0.9em" }}>{p.fullName}</span><span style={{ color: "var(--muted)", fontSize: "0.8em", marginLeft: 8 }}>{p.primaryPosition?.abbreviation}</span></div><div style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--muted)" }}>{p.currentTeam?.name || "FA"}</div></div>)}</div>}
    </div>
    {!player && results.length === 0 && <div style={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 48, marginBottom: 14, opacity: 0.2 }}>📊</div><p style={{ color: "var(--muted)" }}>Search for any MLB player</p></div>}
    {player && <div style={{ animation: "fadeUp 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 20px", flexWrap: "wrap", gap: 10 }}>
        <div><h3 style={{ fontFamily: "var(--display)", fontSize: "1.2em", color: "#fff", fontWeight: 700 }}>{player.fullName}</h3><div style={{ display: "flex", gap: 12, marginTop: 2, flexWrap: "wrap" }}><span style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--red)" }}>{player.primaryPosition?.name}</span><span style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--muted)" }}>{player.currentTeam?.name || "FA"}</span>{player.batSide?.code && <span style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--muted)" }}>B:{player.batSide.code}</span>}{player.pitchHand?.code && <span style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--muted)" }}>T:{player.pitchHand.code}</span>}</div></div>
        <div style={{ display: "flex", gap: 8 }}><select value={season} onChange={e => chSn(Number(e.target.value))} style={{ padding: "6px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, color: "#fff", fontSize: "0.85em", fontFamily: "var(--mono)", cursor: "pointer", outline: "none" }}>{[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map(y => <option key={y} value={y}>{y}</option>)}</select><button onClick={() => { setPl(null); setSt(null); setSp(null); setSr(""); }} style={{ padding: "6px 14px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--muted)", fontSize: "0.8em", cursor: "pointer" }}>✕</button></div>
      </div>
      {ld && <Dots />}
      {!ld && seasonS && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>{isPit ? <><HiStat label="ERA" val={seasonS.era} /><HiStat label="W-L" val={`${seasonS.wins}-${seasonS.losses}`} /><HiStat label="SO" val={seasonS.strikeOuts} /><HiStat label="WHIP" val={seasonS.whip} /><HiStat label="IP" val={seasonS.inningsPitched} /></> : <><HiStat label="AVG" val={seasonS.avg} /><HiStat label="OPS" val={seasonS.ops} /><HiStat label="HR" val={seasonS.homeRuns} /><HiStat label="RBI" val={seasonS.rbi} /><HiStat label="H" val={seasonS.hits} /></>}</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>{splitTabs.map(t => <button key={t.k} onClick={() => setSpT(t.k)} style={{ padding: "6px 14px", borderRadius: 6, background: splitTab === t.k ? "var(--red)" : "var(--surface)", color: splitTab === t.k ? "#fff" : "var(--muted)", border: "none", fontSize: "0.76em", fontWeight: splitTab === t.k ? 600 : 400, cursor: "pointer", fontFamily: "var(--body)" }}>{t.l}</button>)}</div>
        {splitTab === "season" && <div><div style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--red)", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>{season} Season</div><div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}><table style={{ width: "100%", borderCollapse: "collapse" }}>{isPit ? <><thead><tr style={{ background: "var(--surface)" }}>{["G", "GS", "W", "L", "ERA", "IP", "H", "R", "ER", "HR", "BB", "SO", "WHIP", "AVG"].map(x => <th key={x} style={HS}>{x}</th>)}</tr></thead><tbody><tr>{[seasonS.gamesPlayed, seasonS.gamesStarted, seasonS.wins, seasonS.losses, seasonS.era, seasonS.inningsPitched, seasonS.hits, seasonS.runs, seasonS.earnedRuns, seasonS.homeRuns, seasonS.baseOnBalls, seasonS.strikeOuts, seasonS.whip, seasonS.avg].map((v, i) => <td key={i} style={CS}>{v ?? "-"}</td>)}</tr></tbody></> : <><thead><tr style={{ background: "var(--surface)" }}>{["G", "AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "SO", "SB", "AVG", "OBP", "SLG", "OPS"].map(x => <th key={x} style={HS}>{x}</th>)}</tr></thead><tbody><tr>{[seasonS.gamesPlayed, seasonS.atBats, seasonS.runs, seasonS.hits, seasonS.doubles, seasonS.triples, seasonS.homeRuns, seasonS.rbi, seasonS.baseOnBalls, seasonS.strikeOuts, seasonS.stolenBases, seasonS.avg, seasonS.obp, seasonS.slg, seasonS.ops].map((v, i) => <td key={i} style={CS}>{v ?? "-"}</td>)}</tr></tbody></>}</table></div></div>}
        {splitTab === "career" && careerS && <div><div style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--red)", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Career</div><div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}><table style={{ width: "100%", borderCollapse: "collapse" }}>{isPit ? <><thead><tr style={{ background: "var(--surface)" }}>{["G", "GS", "W", "L", "ERA", "IP", "H", "R", "ER", "HR", "BB", "SO", "WHIP"].map(x => <th key={x} style={HS}>{x}</th>)}</tr></thead><tbody><tr>{[careerS.gamesPlayed, careerS.gamesStarted, careerS.wins, careerS.losses, careerS.era, careerS.inningsPitched, careerS.hits, careerS.runs, careerS.earnedRuns, careerS.homeRuns, careerS.baseOnBalls, careerS.strikeOuts, careerS.whip].map((v, i) => <td key={i} style={CS}>{v ?? "-"}</td>)}</tr></tbody></> : <><thead><tr style={{ background: "var(--surface)" }}>{["G", "AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "SO", "SB", "AVG", "OBP", "SLG", "OPS"].map(x => <th key={x} style={HS}>{x}</th>)}</tr></thead><tbody><tr>{[careerS.gamesPlayed, careerS.atBats, careerS.runs, careerS.hits, careerS.doubles, careerS.triples, careerS.homeRuns, careerS.rbi, careerS.baseOnBalls, careerS.strikeOuts, careerS.stolenBases, careerS.avg, careerS.obp, careerS.slg, careerS.ops].map((v, i) => <td key={i} style={CS}>{v ?? "-"}</td>)}</tr></tbody></>}</table></div></div>}
        {splitTab === "gamelog" && <div><div style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--red)", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Last {gameLog.length} Games</div><div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10, maxHeight: 400, overflowY: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>{isPit ? <><thead style={{ position: "sticky", top: 0 }}><tr style={{ background: "var(--surface)" }}>{["Date", "vs", "IP", "H", "R", "ER", "BB", "SO", "ERA"].map(x => <th key={x} style={x === "Date" || x === "vs" ? { ...HS, textAlign: "left" } : HS}>{x}</th>)}</tr></thead><tbody>{gameLog.map((g, i) => <tr key={i}><td style={{ ...NS, fontSize: "0.75em", fontFamily: "var(--mono)", color: "var(--muted)" }}>{g.date}</td><td style={{ ...NS, fontSize: "0.82em" }}>{g.opponent?.abbreviation || "-"}</td><td style={CS}>{g.stat?.inningsPitched ?? "-"}</td><td style={CS}>{g.stat?.hits ?? "-"}</td><td style={CS}>{g.stat?.runs ?? "-"}</td><td style={CS}>{g.stat?.earnedRuns ?? "-"}</td><td style={CS}>{g.stat?.baseOnBalls ?? "-"}</td><td style={CS}>{g.stat?.strikeOuts ?? "-"}</td><td style={CS}>{g.stat?.era ?? "-"}</td></tr>)}</tbody></>
          : <><thead style={{ position: "sticky", top: 0 }}><tr style={{ background: "var(--surface)" }}>{["Date", "vs", "AB", "R", "H", "HR", "RBI", "BB", "SO", "AVG"].map(x => <th key={x} style={x === "Date" || x === "vs" ? { ...HS, textAlign: "left" } : HS}>{x}</th>)}</tr></thead><tbody>{gameLog.map((g, i) => <tr key={i}><td style={{ ...NS, fontSize: "0.75em", fontFamily: "var(--mono)", color: "var(--muted)" }}>{g.date}</td><td style={{ ...NS, fontSize: "0.82em" }}>{g.opponent?.abbreviation || "-"}</td><td style={CS}>{g.stat?.atBats ?? "-"}</td><td style={CS}>{g.stat?.runs ?? "-"}</td><td style={CS}>{g.stat?.hits ?? "-"}</td><td style={CS}>{g.stat?.homeRuns ?? "-"}</td><td style={CS}>{g.stat?.rbi ?? "-"}</td><td style={CS}>{g.stat?.baseOnBalls ?? "-"}</td><td style={CS}>{g.stat?.strikeOuts ?? "-"}</td><td style={CS}>{g.stat?.avg ?? "-"}</td></tr>)}</tbody></>}</table></div></div>}
        {splitTab === "month" && <><div style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--red)", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>By Month — {season}</div><SplitsTable data={monthSplits.map(s => ({ ...s, split: s.month || s.split }))} labelKey="split" /></>}
        {splitTab === "ha" && <><div style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--red)", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Home vs Away — {season}</div><SplitsTable data={haS.map(s => ({ ...s, split: s.isHome ? "Home" : "Away" }))} labelKey="split" /></>}
        {splitTab === "dn" && <><div style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--red)", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>Day vs Night — {season}</div><SplitsTable data={dnS.map(s => ({ ...s, split: s.isDayGame ? "Day" : "Night" }))} labelKey="split" /></>}
        {splitTab === "dow" && <><div style={{ fontFamily: "var(--mono)", fontSize: "0.72em", color: "var(--red)", textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>By Day of Week — {season}</div><SplitsTable data={dowS.map(s => ({ ...s, split: s.dayOfWeek || s.split }))} labelKey="split" /></>}
      </>}
      {!ld && !seasonS && stats && <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>No stats for {player.fullName} in {season}. Try another season.</div>}
    </div>}
  </div>);
}

// ═══════════════ SITUATIONAL ═══════════════
function Situational() {
  const [team, setTm] = useState(""); const [result, setRes] = useState(null); const [ld, sL] = useState(false); const [custom, setCust] = useState("");
  const presets = [
    { label: "Day of Week", q: "Break down this team's win-loss record and run scoring by day of week (Mon-Sun). Which day do they perform best and worst?" },
    { label: "Game # in Series", q: "How does this team perform in Game 1 vs Game 2 vs Game 3 of a 3-game series? Show W-L and runs scored for each." },
    { label: "After Being Shutout", q: "How does this team perform in the game immediately after being shutout? Do they bounce back or continue struggling?" },
    { label: "After a Win vs Loss", q: "Compare this team's performance in games following a win vs games following a loss. Momentum analysis." },
    { label: "Home vs Away by Month", q: "Break down this team's home and away record by month. When and where are they strongest?" },
    { label: "Day Games vs Night", q: "Compare this team's record, batting avg, and run scoring in day games vs night games." },
    { label: "vs Division Rivals", q: "How does this team perform against each division rival? Head-to-head records and run differentials." },
    { label: "Bullpen After Short Start", q: "How does this team perform when their starter goes less than 5 innings? Win rate and bullpen ERA in those games." },
  ];
  const runQ = async (q) => {
    if (!team) return; const tm = TEAMS.find(t => t.abbr === team); sL(true); setRes(null);
    try { const reply = await claudeCall(`You are a situational MLB stats analyst for "Lippy Baseball." Provide detailed, data-driven analysis. Search the web for real, current data. Use markdown tables. Be specific about sample sizes and years. Include betting implications where relevant.`, [{ role: "user", content: `Situational analysis for the ${tm.name} (2024 season and recent history):\n\n${q}\n\nSearch for real stats. Use tables. Be specific.` }]); setRes(reply); } catch { setRes("Error running analysis."); } finally { sL(false); }
  };
  return (<div style={{ animation: "fadeUp 0.4s ease", maxWidth: 900, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: 24 }}><h2 style={{ fontFamily: "var(--display)", fontSize: "1.5em", color: "#fff", marginBottom: 4 }}>Situational Analysis</h2><p style={{ color: "var(--muted)", fontSize: "0.88em" }}>Pick a team, then choose an analysis or write your own</p></div>
    <div style={{ maxWidth: 400, margin: "0 auto 24px" }}><select value={team} onChange={e => setTm(e.target.value)} style={{ width: "100%", padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "#fff", fontSize: "0.95em", fontFamily: "var(--body)", cursor: "pointer", outline: "none" }}><option value="">Select a team...</option>{TEAMS.map(t => <option key={t.abbr} value={t.abbr}>{t.abbr} — {t.name}</option>)}</select></div>
    {team && <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        {presets.map((p, i) => <button key={i} onClick={() => runQ(p.q)} disabled={ld} style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--muted)", fontSize: "0.84em", cursor: ld ? "not-allowed" : "pointer", textAlign: "left", fontFamily: "var(--body)", transition: "all 0.15s" }} onMouseEnter={e => { if (!ld) { e.currentTarget.style.borderColor = "var(--red)"; e.currentTarget.style.color = "#fff"; } }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>
          <span style={{ color: "var(--red)", marginRight: 6 }}>◆</span>{p.label}
        </button>)}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input value={custom} onChange={e => setCust(e.target.value)} onKeyDown={e => e.key === "Enter" && custom.trim() && runQ(custom)} placeholder="Or type your own situational query..." style={{ flex: 1, padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "#fff", fontSize: "0.9em", fontFamily: "var(--body)", outline: "none" }} />
        <Btn onClick={() => custom.trim() && runQ(custom)} disabled={ld || !custom.trim()}>Analyze</Btn>
      </div>
    </>}
    {!team && <div style={{ textAlign: "center", padding: "40px 20px" }}><div style={{ fontSize: 48, marginBottom: 14, opacity: 0.2 }}>🔬</div><p style={{ color: "var(--muted)" }}>Select a team above to get started</p></div>}
    {ld && <><Dots /><p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.82em", fontFamily: "var(--mono)" }}>Researching data...</p></>}
    {result && !ld && <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", animation: "fadeUp 0.4s ease" }}><Md text={result} /></div>}
  </div>);
}

// ═══════════════ MAIN ═══════════════
export default function App() {
  const [tab, setTab] = useState("ai");
  return (<div style={{ "--bg": "#0a0a0a", "--surface": "#141414", "--card": "#1a1a1a", "--border": "rgba(255,255,255,0.08)", "--text": "#fff", "--muted": "#999", "--red": "#e51a2c", "--display": "'Libre Baskerville',Georgia,serif", "--body": "'DM Sans','Segoe UI',sans-serif", "--mono": "'IBM Plex Mono','Fira Code',monospace", fontFamily: "var(--body)", background: "var(--bg)", color: "var(--text)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:3px}::selection{background:#e51a2c;color:#fff}select option{background:#1a1a1a;color:#fff}input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.6);cursor:pointer}`}</style>
    <header style={{ background: "var(--surface)", borderBottom: "2px solid var(--red)", position: "sticky", top: 0, zIndex: 100 }}><div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 60, gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}><div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1em" }}>⚾</div><div><div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1.15em", lineHeight: 1 }}>LIPPY<span style={{ color: "var(--red)" }}> BASEBALL</span></div><div style={{ fontFamily: "var(--mono)", fontSize: "0.52em", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Stats • AI • Predictions • Odds</div></div></div>
      <div style={{ flex: 1 }} /><nav style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", background: tab === t.key ? "var(--red)" : "transparent", color: tab === t.key ? "#fff" : "var(--muted)", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "var(--body)", fontWeight: tab === t.key ? 600 : 400, fontSize: "0.78em", transition: "all 0.15s", whiteSpace: "nowrap" }} onMouseEnter={e => { if (tab !== t.key) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; } }} onMouseLeave={e => { if (tab !== t.key) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; } }}><span>{t.icon}</span><span>{t.label}</span></button>)}</nav>
    </div></header>
    <main style={{ flex: 1, maxWidth: 1400, width: "100%", margin: "0 auto", padding: "24px" }}>
      {tab === "ai" && <AIChat />}{tab === "predictions" && <Predictions />}{tab === "scores" && <ScoresPanel />}{tab === "stats" && <PlayerStats />}{tab === "situational" && <Situational />}{tab === "odds" && <OddsPanel />}
    </main>
    <footer style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", textAlign: "center", fontFamily: "var(--mono)", fontSize: "0.65em", color: "rgba(255,255,255,0.2)" }}>Lippy Baseball — Not affiliated with MLB</footer>
  </div>);
}
