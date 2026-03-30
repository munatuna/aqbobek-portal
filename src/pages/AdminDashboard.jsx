import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents, getAtRiskStudents, getEvents, getNews, getRanking } from "../api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, r, e, n] = await Promise.all([
          getStudents(), getAtRiskStudents(), getEvents(), getNews(),
        ]);
        setStudents(s); setAtRisk(r); setEvents(e); setNews(n);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: "#7c7891" }}>Загрузка...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1625", marginBottom: 4 }}>Администрирование</h1>
          <p style={{ fontSize: 15, color: "#7c7891" }}>Aqbobek International School</p>
        </div>
        <button onClick={() => navigate("/kiosk")} style={{ padding: "10px 20px", background: "#570589", color: "#fff", border: "none", borderRadius: 2, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
          Открыть стенгазету
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Учеников", value: students.length },
          { label: "В зоне риска", value: atRisk.length },
          { label: "Мероприятий", value: events.length },
          { label: "Новостей", value: news.length },
        ].map((c) => (
          <div key={c.label} style={{ background: "#fff", padding: "20px 24px", borderRadius: 2 }}>
            <div style={{ fontSize: 12, color: "#9490a3", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1625" }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>Последние новости</h2>
          {news.map((n) => (
            <div key={n.id} style={{ padding: "12px 0", borderBottom: "1px solid #f0eef5" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1625" }}>{n.title}</div>
              <div style={{ fontSize: 12, color: "#9490a3", marginTop: 4 }}>{n.date}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>Мероприятия</h2>
          {events.slice(0, 4).map((e) => (
            <div key={e.id} style={{ padding: "12px 0", borderBottom: "1px solid #f0eef5" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1625" }}>{e.title}</div>
              <div style={{ fontSize: 12, color: "#9490a3", marginTop: 4 }}>{e.date} · {e.category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
