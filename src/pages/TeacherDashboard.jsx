import { useState, useEffect } from "react";
import { getStudents } from "../api";

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await getStudents({ class: "11А" });
        const sorted = [...all].sort((a, b) => (b.currentAvg || 0) - (a.currentAvg || 0));
        setStudents(sorted);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: "#7c7891" }}>Загрузка...</div>;

  const atRiskCount = students.filter(s => s.currentAvg < 7.5).length;
  const topAvg = students[0]?.currentAvg ?? 0;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1625", marginBottom: 4 }}>Панель учителя</h1>
        <p style={{ fontSize: 15, color: "#7c7891" }}>Класс 11А · {students.length} учеников</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Учеников в классе", value: students.length },
          { label: "В зоне риска", value: atRiskCount },
          { label: "Лучший средний балл", value: topAvg.toFixed(2) },
        ].map((c) => (
          <div key={c.label} style={{ background: "#fff", padding: "20px 24px", borderRadius: 2 }}>
            <div style={{ fontSize: 12, color: "#9490a3", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1625" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Ranking panel — all 11А students by currentAvg */}
      <div style={{ background: "#fff", padding: "24px", borderRadius: 2, marginBottom: 32 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>Рейтинг класса 11А — средний балл за четверть</h2>
        {students.map((s, i) => {
          const isRisk = s.currentAvg < 7.5;
          return (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0eef5" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                  background: i === 0 ? "#570589" : i === 1 ? "#7c3aed" : i === 2 ? "#a78bfa" : "#f0eef5",
                  color: i < 3 ? "#fff" : "#3d3654",
                  fontSize: 13, fontWeight: 600, borderRadius: 2,
                }}>{i + 1}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1625" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#9490a3" }}>{s.class}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {isRisk && (
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#b91c1c", background: "#fef2f2", padding: "2px 8px", borderRadius: 2 }}>риск</span>
                )}
                <div style={{ fontSize: 15, fontWeight: 600, color: isRisk ? "#b91c1c" : "#570589" }}>
                  {s.currentAvg?.toFixed(2) ?? "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Students table */}
      <div style={{ background: "#fff", padding: "24px", borderRadius: 2 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "#1a1625", marginBottom: 16 }}>Ученики 11А</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f0eef5" }}>
              {["№", "Имя", "Средний балл", "Рейтинг"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#9490a3", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #f0eef5" }}>
                <td style={{ padding: "12px 12px", color: "#9490a3", width: 40 }}>{i + 1}</td>
                <td style={{ padding: "12px 12px", fontWeight: 500, color: "#1a1625" }}>{s.name}</td>
                <td style={{ padding: "12px 12px", color: s.currentAvg < 7.5 ? "#b91c1c" : "#1a1625", fontWeight: 600 }}>
                  {s.currentAvg?.toFixed(2) ?? "—"}
                </td>
                <td style={{ padding: "12px 12px", color: "#570589", fontWeight: 600 }}>{s.compositeScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
