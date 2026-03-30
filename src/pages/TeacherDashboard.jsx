import { useState, useEffect } from "react";
import { getStudents, getAtRiskStudents, getRanking } from "../api";

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, r, t] = await Promise.all([
          getStudents(),
          getAtRiskStudents(),
          getRanking(5),
        ]);
        setStudents(s);
        setAtRisk(r);
        setTop(t);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: "#7c7891" }}>Загрузка...</div>;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1625", marginBottom: 4 }}>Панель учителя</h1>
        <p style={{ fontSize: 15, color: "#7c7891" }}>{students.length} учеников · {atRisk.length} в зоне риска</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Всего учеников", value: students.length },
          { label: "В зоне риска", value: atRisk.length },
          { label: "Топ-5 баллов", value: top[0]?.points || 0 },
        ].map((c) => (
          <div key={c.label} style={{ background: "#fff", padding: "20px 24px", borderRadius: 2 }}>
            <div style={{ fontSize: 12, color: "#9490a3", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1625" }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#b91c1c", marginBottom: 16 }}>Зона риска</h2>
          {atRisk.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0eef5" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1625" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#9490a3" }}>{s.class}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#b91c1c" }}>{s.gpa}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>Лидеры</h2>
          {top.map((s, i) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0eef5" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: i === 0 ? "#570589" : "#f0eef5", color: i === 0 ? "#fff" : "#3d3654", fontSize: 13, fontWeight: 600, borderRadius: 2 }}>{i + 1}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1625" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#9490a3" }}>{s.class}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#570589" }}>{s.points} pts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
