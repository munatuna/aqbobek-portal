import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getGrades, getSchedule, getAnalytics } from "../api";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [grades, setGrades] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [g, s, a] = await Promise.all([
          getGrades(user.studentId || "STU001"),
          getSchedule("11А"),
          getAnalytics(user.studentId || "STU001"),
        ]);
        setGrades(g);
        setSchedule(s);
        setAnalytics(a);
      } catch (err) {
        console.error("API error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) return <div style={{ padding: 40, color: "#7c7891", fontSize: 16 }}>Загрузка данных из BilimClass...</div>;

  const currentQ = grades?.find((q) => q.quarter === selectedQuarter);
  const currentAnalytics = analytics?.find((a) => a.quarter === selectedQuarter);
  const subjects = currentQ?.subjects?.filter((s) => s.average !== null) || [];
  const today = new Date().toLocaleDateString("ru-RU", { weekday: "long" });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);
  const todaySchedule = schedule?.[todayCapitalized] || schedule?.["Понедельник"] || [];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1625", marginBottom: 4 }}>
          Привет, {user.name?.split(" ")[0] || "Ученик"}
        </h1>
        <p style={{ fontSize: 15, color: "#7c7891" }}>Данные загружены из BilimClass</p>
      </div>

      {/* Quarter selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[1, 2, 3].map((q) => (
          <button
            key={q}
            onClick={() => setSelectedQuarter(q)}
            style={{
              padding: "8px 20px",
              background: selectedQuarter === q ? "#570589" : "#fff",
              color: selectedQuarter === q ? "#fff" : "#3d3654",
              border: "none",
              borderRadius: 2,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {q} четверть
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Средний балл", value: currentAnalytics?.overallAverage || "-" },
          { label: "Пятерки", value: currentAnalytics?.fivesCount || 0, sub: `из ${currentAnalytics?.totalSubjects || 0}` },
          { label: "Пропуски", value: currentAnalytics?.totalAbsences || 0, sub: "за четверть" },
          { label: "Слабые СОР/СОЧ", value: currentAnalytics?.weakSummatives?.length || 0, sub: "ниже 80%" },
        ].map((card) => (
          <div key={card.label} style={{ background: "#fff", padding: "20px 24px", borderRadius: 2 }}>
            <div style={{ fontSize: 12, color: "#9490a3", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1625" }}>{card.value}</div>
            {card.sub && <div style={{ fontSize: 13, color: "#7c7891", marginTop: 4 }}>{card.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Grades */}
        <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>
            Оценки — {currentQ?.name}
          </h2>
          {subjects.map((s) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0eef5" }}>
              <div>
                <div style={{ fontSize: 14, color: "#3d3654" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#9490a3", marginTop: 2 }}>
                  Ф: {s.formatives.map((f) => f.value).join(", ") || "-"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: s.average >= 9 ? "#570589" : s.average >= 8 ? "#3d3654" : "#b91c1c" }}>
                  {s.average}
                </div>
                <div style={{ fontSize: 11, color: "#9490a3" }}>
                  {s.finalMark ? `итог: ${s.finalMark}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Schedule */}
          <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>
              Расписание — {todayCapitalized}
            </h2>
            {todaySchedule.map((lesson, i) => (
              <div key={i} style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: i < todaySchedule.length - 1 ? "1px solid #f0eef5" : "none" }}>
                <div style={{ fontSize: 12, color: "#9490a3", width: 90, flexShrink: 0 }}>{lesson.time}</div>
                <div>
                  <div style={{ fontSize: 14, color: "#1a1625", fontWeight: 500 }}>{lesson.subject}</div>
                  <div style={{ fontSize: 12, color: "#9490a3" }}>{lesson.teacher} · {lesson.room}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Summatives */}
          <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>СОР / СОЧ</h2>
            {subjects.flatMap((s) => s.summatives.map((sm, i) => ({ ...sm, subject: s.name, key: `${s.name}-${i}` }))).slice(0, 10).map((sm) => (
              <div key={sm.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0eef5" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#3d3654" }}>{sm.subject}</div>
                  <div style={{ fontSize: 11, color: "#9490a3" }}>{sm.type}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: sm.percent >= 80 ? "#570589" : "#b91c1c" }}>
                  {sm.value}/{sm.maxValue} ({sm.percent}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
