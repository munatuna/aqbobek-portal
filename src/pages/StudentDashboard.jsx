import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getGrades, getSchedule, getAnalytics } from "../api";

const WEEKDAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"];
const SHORT_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт"];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [grades, setGrades] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(3);
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 ? d - 1 : 0;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [g, s, a] = await Promise.all([
          getGrades(user.studentId || "STU001"),
          getSchedule("11А"),
          getAnalytics(user.studentId || "STU001"),
        ]);
        setGrades(g); setSchedule(s); setAnalytics(a);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  if (loading) return <div style={{ padding: 40, color: "#7c7891", fontSize: 16 }}>Загрузка данных из BilimClass...</div>;

  const currentQ = grades?.find((q) => q.quarter === selectedQuarter);
  const currentA = analytics?.find((a) => a.quarter === selectedQuarter);
  const subjects = currentQ?.subjects?.filter((s) => s.average !== null) || [];
  const daySchedule = schedule?.[WEEKDAYS[selectedDay]] || [];

  const currentWeak = currentQ?.subjects?.flatMap((s) =>
    s.summatives.filter((sm) => sm.percent < 65).map((sm) => ({ subject: s.name, ...sm }))
  ) || [];

  const lastSummatives = subjects
    .filter((s) => s.summatives.length > 0)
    .map((s) => ({ subject: s.name, ...s.summatives[s.summatives.length - 1] }));

  const avgColor = (v) => v >= 8 ? "#16a34a" : v >= 6 ? "#d97706" : "#b91c1c";
  const chartData = analytics?.map((a) => ({ label: a.name, avg: a.overallAverage })) || [];

  const LineChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    const svgW = 500, svgH = 160;
    const pad = { top: 28, right: 30, bottom: 30, left: 44 };
    const cW = svgW - pad.left - pad.right;
    const cH = svgH - pad.top - pad.bottom;
    const vals = data.map((d) => d.avg).filter(Boolean);
    if (!vals.length) return null;
    const minV = 1;
    const maxV = 10;
    const xPos = (i) => pad.left + (data.length === 1 ? cW / 2 : (i / (data.length - 1)) * cW);
    const yPos = (v) => pad.top + cH - ((v - minV) / (maxV - minV)) * cH;
    const pts = data.map((d, i) => ({ x: xPos(i), y: yPos(d.avg || 0), ...d }));
    const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const areaPath = `${linePath} L${pts[pts.length - 1].x},${pad.top + cH} L${pts[0].x},${pad.top + cH} Z`;
    const gridLines = Array.from({ length: 10 }, (_, i) => {
      const v = i + 1;
      return { v, y: yPos(v) };
    });
    return (
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#570589" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#570589" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={pad.left} y1={g.y} x2={pad.left + cW} y2={g.y} stroke="#f0eef5" strokeWidth="1" />
            <text x={pad.left - 6} y={g.y + 4} textAnchor="end" fontSize="9" fill="#c4bed0">{g.v}</text>
          </g>
        ))}
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#570589" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#570589" strokeWidth="1.5" />
            <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="13" fontWeight="700" fontFamily="'Outfit', sans-serif" fill={i === pts.length - 1 ? "#570589" : "#3d3654"}>{p.avg}</text>
            <text x={p.x} y={pad.top + cH + 18} textAnchor="middle" fontSize="10" fontFamily="'Outfit', sans-serif" fill="#9490a3">{p.label?.replace(" четверть", " чтв")}</text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#1a1625", marginBottom: 4 }}>Привет, {user.name?.split(" ")[0] || "Ученик"}</h1>
          <p style={{ fontSize: 13, color: "#7c7891" }}>Данные из BilimClass</p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4].map((q) => (
            <button key={q} onClick={() => setSelectedQuarter(q)} style={{ padding: "5px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", background: selectedQuarter === q ? "#570589" : "#fff", color: selectedQuarter === q ? "#fff" : "#3d3654", border: "none", borderRadius: 2, fontFamily: "'Outfit', sans-serif" }}>{q} чтв</button>
          ))}
        </div>
      </div>

      {selectedQuarter === 4 && !currentQ && (
        <div style={{ background: "#f5f3f8", padding: "40px 20px", borderRadius: 2, textAlign: "center", color: "#9490a3", fontSize: 15, marginBottom: 10 }}>
          Данные за 4 четверть пока недоступны
        </div>
      )}

      {(selectedQuarter !== 4 || currentQ) && (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div style={{ background: "#fff", padding: "14px 20px", borderRadius: 2 }}>
          <div style={{ fontSize: 10, color: "#9490a3", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Средний балл</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: avgColor(currentA?.overallAverage || 0) }}>{currentA?.overallAverage || "-"}</div>
        </div>
        <div style={{ background: "#fff", padding: "14px 20px", borderRadius: 2 }}>
          <div style={{ fontSize: 10, color: "#9490a3", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Пропуски за четверть</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: (currentA?.totalAbsences || 0) > 10 ? "#b91c1c" : (currentA?.totalAbsences || 0) > 5 ? "#d97706" : "#1a1625" }}>{currentA?.totalAbsences || 0}</div>
        </div>
      </div>)}

      {/*график*/}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 10, marginBottom: 10 }}>
        <div style={{ background: "#fff", padding: "18px 20px", borderRadius: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1625", marginBottom: 12 }}>Динамика среднего балла</div>
          <LineChart data={chartData} />
        </div>

        {/*расписание*/}
        <div style={{ background: "#fff", padding: "18px 18px", borderRadius: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1625", marginBottom: 10 }}>Расписание</div>
          <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
            {SHORT_DAYS.map((d, i) => (
              <button key={i} onClick={() => setSelectedDay(i)} style={{
                flex: 1, padding: "5px 0", fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: selectedDay === i ? "#570589" : "#f5f3f8",
                color: selectedDay === i ? "#fff" : "#9490a3",
                border: "none", borderRadius: 2, fontFamily: "'Outfit', sans-serif",
              }}>{d}</button>
            ))}
          </div>
          {daySchedule.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9490a3", padding: "8px 0" }}>Нет уроков</div>
          ) : daySchedule.map((l, i) => (
            <div key={i} style={{ padding: "7px 0", borderBottom: i < daySchedule.length - 1 ? "1px solid #f5f3f8" : "none" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1625" }}>{l.subject}</div>
              <div style={{ fontSize: 11, color: "#9490a3", marginTop: 2 }}>{l.time} · {l.room}</div>
            </div>
          ))}
        </div>
      </div>

      {/*обрати внимание*/}
      {currentWeak.length > 0 && (
        <div style={{ background: "#f3edf9", padding: "14px 20px", borderRadius: 2, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#570589", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, background: "#b91c1c", borderRadius: 1, display: "inline-block" }} />
            Обрати внимание — СОР/СОЧ ниже 65%
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {currentWeak.map((w, i) => (
              <div key={i} style={{ background: "#fff", padding: "8px 14px", borderRadius: 2, minWidth: 140 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#3d3654", marginBottom: 3 }}>{w.subject}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#9490a3" }}>{w.type}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: w.percent < 50 ? "#b91c1c" : "#d97706" }}>{w.value}/{w.maxValue}</span>
                </div>
                <div style={{ width: "100%", height: 3, background: "#e6dff0", borderRadius: 1, marginTop: 4 }}>
                  <div style={{ width: `${w.percent}%`, height: "100%", background: w.percent < 50 ? "#b91c1c" : "#d97706", borderRadius: 1 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*предметы и последние СОР/СОЧ*/}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: "#fff", padding: "18px 20px", borderRadius: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1625", marginBottom: 10 }}>Предметы — {currentQ?.name || `${selectedQuarter} четверть`}</div>
          {subjects.length === 0 && <div style={{ fontSize: 13, color: "#9490a3", padding: "12px 0" }}>Нет данных за эту четверть</div>}
          {subjects.map((s) => (
            <div key={s.name} style={{ display: "grid", gridTemplateColumns: "1fr 52px 32px 28px", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: "1px solid #f5f3f8" }}>
              <span style={{ fontSize: 12, color: "#3d3654" }}>{s.name}</span>
              <div style={{ height: 4, background: "#f0eef5", borderRadius: 1, overflow: "hidden" }}>
                <div style={{ width: `${(s.average / 10) * 100}%`, height: "100%", background: avgColor(s.average), borderRadius: 1 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: avgColor(s.average), textAlign: "right" }}>{s.average}</span>
              <div>
                {s.finalMark && s.finalMark !== "ЗЧ" && (
                  <span style={{ fontSize: 10, padding: "1px 5px", background: "rgba(87,5,137,0.08)", color: "#570589", borderRadius: 1 }}>{s.finalMark}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", padding: "18px 20px", borderRadius: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1625", marginBottom: 10 }}>Последние СОР / СОЧ</div>
          {lastSummatives.length === 0 && <div style={{ fontSize: 13, color: "#9490a3", padding: "12px 0" }}>Нет данных за эту четверть</div>}
          {lastSummatives.map((sm, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f5f3f8" }}>
              <div>
                <span style={{ fontSize: 12, color: "#3d3654" }}>{sm.subject}</span>
                <span style={{ fontSize: 10, color: "#9490a3", marginLeft: 6 }}>{sm.type}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: sm.percent >= 80 ? "#16a34a" : sm.percent >= 65 ? "#d97706" : "#b91c1c" }}>{sm.value}/{sm.maxValue}</span>
                <span style={{ fontSize: 10, color: sm.percent >= 80 ? "#16a34a" : sm.percent >= 65 ? "#d97706" : "#b91c1c" }}>{sm.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
