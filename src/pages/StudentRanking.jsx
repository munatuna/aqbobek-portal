import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getRanking } from "../api";

export default function StudentRanking() {
  const { user } = useAuth();
  const [classRanking, setClassRanking] = useState([]);
  const [parallelRanking, setParallelRanking] = useState([]);
  const [tab, setTab] = useState("class");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const userClass = user.userClass || "11А";
        const grade = userClass.replace(/[А-Яа-яA-Za-z]+$/, "");
        const [cls, parallel] = await Promise.all([
          getRanking(userClass),
          getRanking(null, grade),
        ]);
        setClassRanking(cls);
        setParallelRanking(parallel);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  if (loading) return <div style={{ padding: 40, color: "#7c7891" }}>Загрузка рейтинга...</div>;

  const ranking = tab === "class" ? classRanking : parallelRanking;
  const myIdx = ranking.findIndex((s) => s.email === user.email);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#1a1625", marginBottom: 4 }}>Рейтинг</h1>
          <p style={{ fontSize: 13, color: "#7c7891" }}>60% средний балл + 40% СОР/СОЧ</p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setTab("class")} style={{ padding: "6px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", background: tab === "class" ? "#570589" : "#fff", color: tab === "class" ? "#fff" : "#3d3654", border: "none", borderRadius: 2, fontFamily: "'Outfit', sans-serif" }}>Мой класс</button>
          <button onClick={() => setTab("parallel")} style={{ padding: "6px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", background: tab === "parallel" ? "#570589" : "#fff", color: tab === "parallel" ? "#fff" : "#3d3654", border: "none", borderRadius: 2, fontFamily: "'Outfit', sans-serif" }}>Параллель</button>
        </div>
      </div>

      {/*my position*/}
      {myIdx >= 0 && (
        <div style={{ background: "#570589", color: "#fff", padding: "16px 22px", borderRadius: 2, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Твоя позиция{tab === "class" ? " в классе" : " в параллели"}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>#{myIdx + 1} из {ranking.length}</div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{ranking[myIdx].currentAvg}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>ср. балл</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{ranking[myIdx].currentSorPct}%</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>СОР/СОЧ</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{ranking[myIdx].compositeScore}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>итого</div>
            </div>
          </div>
        </div>
      )}

      {/*табл*/}
      <div style={{ background: "#fff", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 90px 90px 90px", padding: "10px 18px", background: "#1a1625", color: "#fff", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, alignItems: "center" }}>
          <span>#</span>
          <span>Ученик</span>
          <span style={{ textAlign: "right" }}>Ср. балл</span>
          <span style={{ textAlign: "right" }}>СОР/СОЧ</span>
          <span style={{ textAlign: "right" }}>Итого</span>
        </div>

        {ranking.length === 0 && (
          <div style={{ padding: "32px 18px", color: "#9490a3", fontSize: 14, textAlign: "center" }}>Нет данных</div>
        )}

        {ranking.map((s, i) => {
          const isMe = s.email === user.email;
          return (
            <div key={s.id} style={{
              display: "grid", gridTemplateColumns: "40px 1fr 90px 90px 90px",
              padding: "11px 18px", alignItems: "center",
              background: isMe ? "rgba(87,5,137,0.05)" : "transparent",
              borderBottom: "1px solid #f5f3f8",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: i < 3 ? "#570589" : "#9490a3" }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: isMe ? 600 : 400, color: "#1a1625", display: "flex", alignItems: "center", gap: 6 }}>
                  {s.name}
                  {isMe && <span style={{ fontSize: 10, color: "#570589", background: "rgba(87,5,137,0.08)", padding: "1px 5px", borderRadius: 1 }}>ты</span>}
                </div>
                {tab === "parallel" && <div style={{ fontSize: 10, color: "#9490a3" }}>{s.class}</div>}
              </div>
              <div style={{ textAlign: "right", fontSize: 14, fontWeight: 600, color: s.currentAvg >= 8 ? "#16a34a" : s.currentAvg >= 6 ? "#d97706" : "#b91c1c" }}>{s.currentAvg ?? "—"}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: s.currentSorPct >= 80 ? "#16a34a" : s.currentSorPct >= 65 ? "#d97706" : "#b91c1c" }}>{s.currentSorPct != null ? `${s.currentSorPct}%` : "—"}</div>
              <div style={{ textAlign: "right", fontSize: 14, fontWeight: 700, color: "#1a1625" }}>{s.compositeScore ?? "—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}