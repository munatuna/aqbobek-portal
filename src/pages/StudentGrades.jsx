import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getGrades } from "../api";

export default function StudentGrades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(3);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGrades(user.studentId || "STU001").then(setGrades).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div style={{ padding: 40, color: "#7c7891" }}>Загрузка оценок...</div>;

  const currentQ = grades?.find((q) => q.quarter === selectedQuarter);
  const subjects = currentQ?.subjects || [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: "#1a1625", marginBottom: 4 }}>Оценки</h1>
        <p style={{ fontSize: 14, color: "#7c7891" }}>Формативные, СОР, СОЧ и итоговые</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((q) => (
          <button key={q} onClick={() => { setSelectedQuarter(q); setExpandedSubject(null); }}
            style={{ padding: "8px 20px", background: selectedQuarter === q ? "#570589" : "#fff", color: selectedQuarter === q ? "#fff" : "#3d3654", border: "none", borderRadius: 2, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            {q} четверть
          </button>
        ))}
      </div>

      {subjects.length === 0 && (
        <div style={{ background: "#f5f3f8", padding: "48px 20px", borderRadius: 2, textAlign: "center", color: "#9490a3", fontSize: 15 }}>
          Данные за {selectedQuarter} четверть пока недоступны
        </div>
      )}

      {subjects.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px 60px", padding: "10px 20px", background: "#1a1625", color: "#fff", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, borderRadius: 2 }}>
          <span>Предмет</span>
          <span style={{ textAlign: "center" }}>Средняя</span>
          <span style={{ textAlign: "center" }}>СОР / СОЧ</span>
          <span style={{ textAlign: "center" }}>Итог</span>
          <span style={{ textAlign: "center" }}>Н/Б</span>
        </div>

        {subjects.map((s) => {
          const isExpanded = expandedSubject === s.name;
          const hasSummatives = s.summatives.length > 0;
          const hasFormatives = s.formatives.length > 0;

          return (
            <div key={s.name}>
              <div
                onClick={() => setExpandedSubject(isExpanded ? null : s.name)}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 80px 120px 80px 60px",
                  padding: "12px 20px", background: "#fff", cursor: "pointer",
                  borderBottom: isExpanded ? "none" : "1px solid #f5f3f8",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#faf5ff"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "#9490a3", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "none" }}>&#9654;</span>
                  <span style={{ fontSize: 14, color: "#1a1625", fontWeight: isExpanded ? 600 : 400 }}>{s.name}</span>
                </div>
                <div style={{ textAlign: "center", fontSize: 15, fontWeight: 600, color: s.average ? (s.average >= 9 ? "#570589" : s.average >= 8 ? "#3d3654" : "#b91c1c") : "#9490a3" }}>
                  {s.average || "-"}
                </div>
                <div style={{ textAlign: "center", fontSize: 12, color: "#3d3654" }}>
                  {s.summatives.length > 0 ? s.summatives.map((sm) => `${sm.value}/${sm.maxValue}`).join(", ") : "-"}
                </div>
                <div style={{ textAlign: "center" }}>
                  {s.finalMark ? (
                    <span style={{ fontSize: 14, fontWeight: 600, padding: "2px 10px", background: s.finalMark === "5" ? "rgba(87,5,137,0.1)" : "#f0eef5", color: s.finalMark === "5" ? "#570589" : "#3d3654", borderRadius: 2 }}>{s.finalMark}</span>
                  ) : <span style={{ color: "#9490a3" }}>-</span>}
                </div>
                <div style={{ textAlign: "center", fontSize: 13, color: s.absences > 5 ? "#b91c1c" : "#9490a3" }}>
                  {s.absences || 0}
                </div>
              </div>

              {isExpanded && (
                <div style={{ background: "#faf8fd", padding: "16px 20px 16px 40px", borderBottom: "1px solid #f0eef5" }}>
                  {hasFormatives && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#7c7891", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Формативные оценки</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {s.formatives.map((f, i) => (
                          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 10px", background: "#fff", borderRadius: 2, minWidth: 50 }}>
                            <span style={{ fontSize: 16, fontWeight: 600, color: f.value >= 9 ? "#570589" : f.value >= 7 ? "#3d3654" : "#b91c1c" }}>{f.value}</span>
                            <span style={{ fontSize: 9, color: "#9490a3", marginTop: 2 }}>{f.date?.slice(5) || ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasSummatives && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#7c7891", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Суммативные</div>
                      <div style={{ display: "flex", gap: 12 }}>
                        {s.summatives.map((sm, i) => (
                          <div key={i} style={{ background: "#fff", padding: "10px 16px", borderRadius: 2 }}>
                            <div style={{ fontSize: 11, color: "#9490a3", marginBottom: 4 }}>{sm.type}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: sm.percent >= 80 ? "#570589" : "#b91c1c" }}>{sm.value}/{sm.maxValue}</div>
                            <div style={{ fontSize: 11, color: sm.percent >= 80 ? "#7c7891" : "#b91c1c" }}>{sm.percent}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!hasFormatives && !hasSummatives && (
                    <div style={{ fontSize: 13, color: "#9490a3" }}>Нет данных по этому предмету</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>}
    </div>
  );
}
