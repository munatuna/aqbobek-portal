import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getKioskFeed } from "../api";

export default function KioskPage() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [time, setTime] = useState(new Date());
  const [feed, setFeed] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    getKioskFeed().then(setFeed).catch(console.error);
    const refresh = setInterval(() => {
      getKioskFeed().then(setFeed).catch(console.error);
    }, 30000);
    return () => clearInterval(refresh);
  }, []);

  const paused = useRef(false);
  const resumeTimer = useRef(null);
  const direction = useRef(1);
  const rafId = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const step = () => {
      if (!paused.current) {
        el.scrollTop += direction.current * 0.8;
        if (el.scrollTop >= el.scrollHeight - el.clientHeight - 2) direction.current = -1;
        if (el.scrollTop <= 2) direction.current = 1;
      }
      rafId.current = requestAnimationFrame(step);
    };
    rafId.current = requestAnimationFrame(step);
    const pause = () => { paused.current = true; clearTimeout(resumeTimer.current); };
    const resume = () => { clearTimeout(resumeTimer.current); resumeTimer.current = setTimeout(() => { paused.current = false; }, 3000); };
    const onWheel = () => { pause(); resume(); };
    el.addEventListener("mousedown", pause);
    el.addEventListener("mouseup", resume);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause);
    el.addEventListener("touchend", resume);
    el.addEventListener("wheel", onWheel);
    return () => {
      cancelAnimationFrame(rafId.current);
      clearTimeout(resumeTimer.current);
      el.removeEventListener("mousedown", pause);
      el.removeEventListener("mouseup", resume);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  const formatTime = (d) => d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d) => d.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (!feed) return <div style={{ background: "#0f0a18", width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Outfit', sans-serif", fontSize: 18 }}>Загрузка стенгазеты...</div>;

  const { topStudents, events, news } = feed;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .kiosk-scroll::-webkit-scrollbar { display: none; }
        .kiosk-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div style={{ width: "100vw", height: "100vh", background: "#0f0a18", fontFamily: "'Outfit', sans-serif", color: "#fff", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", background: "rgba(87,5,137,0.15)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, background: "#570589", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, borderRadius: 2 }}>AQ</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>AQBOBEK INTERNATIONAL SCHOOL</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase" }}>Школьная стенгазета</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{formatTime(time)}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }}>{formatDate(time)}</div>
          </div>
          <button onClick={() => navigate(-1)} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>x</button>
        </div>

        <div ref={scrollRef} className="kiosk-scroll" style={{ flex: 1, overflow: "auto", padding: "32px 40px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>Лидеры рейтинга</div>
            <div style={{ display: "flex", gap: 16 }}>
              {topStudents.map((s, i) => (
                <div key={s.id} style={{ flex: 1, background: i === 0 ? "linear-gradient(135deg, #570589, #2d0348)" : "rgba(255,255,255,0.04)", padding: "24px", borderRadius: 2, animation: `fadeUp .5s ease ${i * 0.1}s both` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: i === 0 ? 32 : 24, fontWeight: 800, color: "rgba(255,255,255,0.2)" }}>{i + 1}</span>
                    <div style={{ width: i === 0 ? 48 : 40, height: i === 0 ? 48 : 40, background: i === 0 ? "rgba(255,255,255,0.2)" : "rgba(87,5,137,0.3)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: i === 0 ? 20 : 16, fontWeight: 700 }}>{s.name.split(" ").map(n => n[0]).join("")}</div>
                  </div>
                  <div style={{ fontSize: i === 0 ? 20 : 16, fontWeight: 600, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{s.class} · {s.points} баллов</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>Мероприятия</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {events.map((e, i) => (
                <div key={e.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden", animation: `fadeUp .5s ease ${0.2 + i * 0.1}s both` }}>
                  <div style={{ height: 160, background: `url(${e.photo}) center/cover`, position: "relative" }}>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(transparent, rgba(15,10,24,0.9))" }} />
                    <span style={{ position: "absolute", top: 10, left: 10, padding: "4px 10px", background: "#570589", fontSize: 11, fontWeight: 600, textTransform: "uppercase", borderRadius: 1 }}>{e.category}</span>
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{e.title}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{e.date}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{e.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>Новости школы</div>
            {news.map((n, i) => (
              <div key={n.id} style={{ background: "rgba(255,255,255,0.04)", padding: "20px 24px", borderRadius: 2, display: "flex", gap: 24, alignItems: "center", marginBottom: 12, animation: `fadeUp .5s ease ${0.4 + i * 0.1}s both` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{n.title}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{n.text}</div>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{n.date}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 100 }} />
        </div>

        <div style={{ padding: "12px 40px", background: "#570589", fontSize: 14, fontWeight: 500, flexShrink: 0, overflow: "hidden", whiteSpace: "nowrap" }}>
          <div style={{ animation: "pulse 3s ease-in-out infinite" }}>
            Лидер рейтинга — {topStudents[0]?.name} ({topStudents[0]?.points} баллов) --- Ближайшее: {events[0]?.title} — {events[0]?.date} --- {news[0]?.title}
          </div>
        </div>
      </div>
    </>
  );
}
