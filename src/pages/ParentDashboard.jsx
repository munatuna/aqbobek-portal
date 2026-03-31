import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getGrades, getAnalytics, getStudent } from "../api";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [grades, setGrades] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [child, setChild] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(3);
  const [loading, setLoading] = useState(true);

  const studentId = user.studentId || "STU001";

  useEffect(() => {
    async function load() {
      try {
        const [g, a, c] = await Promise.all([
          getGrades(studentId),
          getAnalytics(studentId),
          getStudent(studentId),
        ]);
        setGrades(g);
        setAnalytics(a);
        setChild(c);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [studentId]);

  if (loading) return <div style={{ padding: 40, color: "#7c7891" }}>Загрузка данных ребёнка...</div>;

  const currentQ = grades?.find((q) => q.quarter === selectedQuarter);
  const currentA = analytics?.find((a) => a.quarter === selectedQuarter);
  const subjects = currentQ?.subjects?.filter((s) => s.average !== null) || [];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1625", marginBottom: 4 }}>Динамика ученика</h1>
        <p style={{ fontSize: 15, color: "#7c7891" }}>{child?.name} · {child?.class}</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[1, 2, 3].map((q) => (
          <button key={q} onClick={() => setSelectedQuarter(q)} style={{ padding: "8px 20px", background: selectedQuarter === q ? "#570589" : "#fff", color: selectedQuarter === q ? "#fff" : "#3d3654", border: "none", borderRadius: 2, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            {q} четверть
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Средний балл", value: currentA?.overallAverage || "-" },
          { label: "Пятерки", value: currentA?.fivesCount || 0 },
          { label: "Пропуски", value: currentA?.totalAbsences || 0 },
          { label: "Место", value: `#${child?.rank || "-"}` },
        ].map((c) => (
          <div key={c.label} style={{ background: "#fff", padding: "20px 24px", borderRadius: 2 }}>
            <div style={{ fontSize: 12, color: "#9490a3", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1625" }}>{c.value}</div>
          </div>
        ))}
      </div>

      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>Предметы — {currentQ?.name}</h2>
          {subjects.map((s) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0eef5" }}>
              <span style={{ fontSize: 14, color: "#3d3654" }}>{s.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: s.average >= 9 ? "#570589" : s.average >= 8 ? "#3d3654" : "#b91c1c" }}>{s.average}</span>
                {s.finalMark && <span style={{ fontSize: 12, padding: "2px 8px", background: s.finalMark === "5" ? "rgba(87,5,137,0.1)" : "#f0eef5", color: s.finalMark === "5" ? "#570589" : "#3d3654", borderRadius: 2 }}>{s.finalMark}</span>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>Динамика по четвертям</h2>
          {analytics?.map((a) => (
            <div key={a.quarter} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f0eef5" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1625" }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "#9490a3" }}>{a.fivesCount} пятёрок, {a.totalAbsences} пропусков</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: a.overallAverage >= 9 ? "#570589" : "#3d3654" }}>
                {a.overallAverage || "-"}
              </div>
            </div>
          ))}
          {currentA?.weakSummatives?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#b91c1c", marginBottom: 8 }}>Слабые СОР/СОЧ (ниже 80%)</div>
              {currentA.weakSummatives.map((w, i) => (
                <div key={i} style={{ fontSize: 13, color: "#7c7891", padding: "4px 0" }}>{w.subject} — {w.type}: {w.value}/{w.maxValue} ({w.percent}%)</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
