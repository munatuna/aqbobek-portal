import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents, getAtRiskStudents, getEvents, getNews, postNews, deleteNews, postEvent, deleteEvent } from "../api";

const CATEGORIES = ["school", "science", "sport", "tech", "culture", "competition"];

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 2,
  border: "1.5px solid #e6dff0", fontSize: 14, fontFamily: "'Outfit', sans-serif",
  color: "#1a1625", outline: "none", marginBottom: 10,
};

const btnStyle = (color = "#570589") => ({
  padding: "10px 20px", background: color, color: "#fff", border: "none",
  borderRadius: 2, fontSize: 14, fontWeight: 600, cursor: "pointer",
  fontFamily: "'Outfit', sans-serif",
});

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  // active tab: "news" | "events"
  const [tab, setTab] = useState("news");

  // news form
  const [newsForm, setNewsForm] = useState({ title: "", text: "", date: "" });
  const [newsLoading, setNewsLoading] = useState(false);

  // event form
  const [eventForm, setEventForm] = useState({ title: "", description: "", date: "", category: "school", photo: "" });
  const [eventLoading, setEventLoading] = useState(false);

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

  const handleAddNews = async () => {
    if (!newsForm.title || !newsForm.text) return;
    setNewsLoading(true);
    try {
      const created = await postNews(newsForm);
      setNews((prev) => [created, ...prev]);
      setNewsForm({ title: "", text: "", date: "" });
    } catch (err) { console.error(err); }
    finally { setNewsLoading(false); }
  };

  const handleDeleteNews = async (id) => {
    try {
      await deleteNews(id);
      setNews((prev) => prev.filter((n) => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleAddEvent = async () => {
    if (!eventForm.title || !eventForm.date) return;
    setEventLoading(true);
    try {
      const created = await postEvent(eventForm);
      setEvents((prev) => [created, ...prev]);
      setEventForm({ title: "", description: "", date: "", category: "school", photo: "" });
    } catch (err) { console.error(err); }
    finally { setEventLoading(false); }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ padding: 40, color: "#7c7891" }}>Загрузка...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1625", marginBottom: 4 }}>Администрирование</h1>
          <p style={{ fontSize: 15, color: "#7c7891" }}>Aqbobek International School</p>
        </div>
        <button onClick={() => navigate("/kiosk")} style={btnStyle()}>Открыть стенгазету</button>
      </div>

      {/* Stat cards */}
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #f0eef5" }}>
        {[{ key: "news", label: "Новости" }, { key: "events", label: "Мероприятия" }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "10px 24px", border: "none", background: "transparent",
            fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            color: tab === key ? "#570589" : "#9490a3",
            borderBottom: tab === key ? "2px solid #570589" : "2px solid transparent",
            marginBottom: -2,
          }}>{label}</button>
        ))}
      </div>

      {tab === "news" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Add news form */}
          <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>Добавить новость</h2>
            <input style={inputStyle} placeholder="Заголовок *" value={newsForm.title}
              onChange={(e) => setNewsForm((f) => ({ ...f, title: e.target.value }))} />
            <textarea style={{ ...inputStyle, height: 100, resize: "vertical" }} placeholder="Текст новости *"
              value={newsForm.text} onChange={(e) => setNewsForm((f) => ({ ...f, text: e.target.value }))} />
            <input style={inputStyle} type="date" value={newsForm.date}
              onChange={(e) => setNewsForm((f) => ({ ...f, date: e.target.value }))} />
            <button onClick={handleAddNews} disabled={newsLoading || !newsForm.title || !newsForm.text}
              style={{ ...btnStyle(), opacity: (!newsForm.title || !newsForm.text) ? 0.5 : 1 }}>
              {newsLoading ? "Сохраняем..." : "Опубликовать"}
            </button>
          </div>

          {/* News list */}
          <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>Опубликованные новости</h2>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {news.map((n) => (
                <div key={n.id} style={{ padding: "12px 0", borderBottom: "1px solid #f0eef5", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1625" }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "#9490a3", marginTop: 2 }}>{n.date}</div>
                  </div>
                  <button onClick={() => handleDeleteNews(n.id)}
                    style={{ padding: "4px 10px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 2, fontSize: 12, cursor: "pointer", flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "events" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Add event form */}
          <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>Добавить мероприятие</h2>
            <input style={inputStyle} placeholder="Название *" value={eventForm.title}
              onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} />
            <textarea style={{ ...inputStyle, height: 80, resize: "vertical" }} placeholder="Описание"
              value={eventForm.description} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} />
            <input style={inputStyle} type="date" value={eventForm.date}
              onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))} />
            <select style={{ ...inputStyle }} value={eventForm.category}
              onChange={(e) => setEventForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={inputStyle} placeholder="Ссылка на фото (необязательно)" value={eventForm.photo}
              onChange={(e) => setEventForm((f) => ({ ...f, photo: e.target.value }))} />
            <button onClick={handleAddEvent} disabled={eventLoading || !eventForm.title || !eventForm.date}
              style={{ ...btnStyle(), opacity: (!eventForm.title || !eventForm.date) ? 0.5 : 1 }}>
              {eventLoading ? "Сохраняем..." : "Опубликовать"}
            </button>
          </div>

          {/* Events list */}
          <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>Запланированные мероприятия</h2>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {events.map((e) => (
                <div key={e.id} style={{ padding: "12px 0", borderBottom: "1px solid #f0eef5", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1625" }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: "#9490a3", marginTop: 2 }}>{e.date} · {e.category}</div>
                  </div>
                  <button onClick={() => handleDeleteEvent(e.id)}
                    style={{ padding: "4px 10px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 2, fontSize: 12, cursor: "pointer", flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
