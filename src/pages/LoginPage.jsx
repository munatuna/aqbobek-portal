import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { login as apiLogin } from "../api";

const DEMO_ACCOUNTS = [
  { role: "Ученик", email: "aidar@aqbobek.kz", password: "demo", redirect: "/student" },
  { role: "Учитель", email: "nurlan.t@aqbobek.kz", password: "demo", redirect: "/teacher" },
  { role: "Родитель", email: "parent@aqbobek.kz", password: "demo", redirect: "/parent" },
  { role: "Админ", email: "admin@aqbobek.kz", password: "demo", redirect: "/admin" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) { setError("Введите email и пароль"); return; }
    setError("");
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      const u = data.user;
      login(u.role, u.email, u.studentId, u.name);
      const redirect = DEMO_ACCOUNTS.find((a) => a.role === u.role)?.redirect || "/student";
      navigate(redirect);
    } catch (err) {
      setError("Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => { setEmail(acc.email); setPassword(acc.password); setShowDemo(false); setError(""); };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
      <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Outfit', sans-serif", background: "#f9f8fc" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 60px", background: "#fff", minHeight: "100vh" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 4, background: "#570589", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>AQ</div>
            <span style={{ fontSize: 17, fontWeight: 600, color: "#1a1625" }}>Aqbobek Portal</span>
          </div>
          <div style={{ width: "100%", maxWidth: 440, margin: "0 auto", animation: "fadeIn .5s ease" }}>
            <h1 style={{ fontSize: 34, fontWeight: 600, color: "#1a1625", marginBottom: 8 }}>С возвращением</h1>
            <p style={{ fontSize: 17, color: "#7c7891", marginBottom: 36 }}>Войдите в школьный портал Aqbobek</p>
            <label style={{ display: "block", fontSize: 15, fontWeight: 500, color: "#3d3654", marginBottom: 6 }}>Email</label>
            <input type="email" placeholder="name@aqbobek.kz" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && handleLogin()} style={{ width: "100%", padding: "14px 16px", borderRadius: 2, border: `1.5px solid ${error ? "#e24b4a" : "#e6dff0"}`, fontSize: 16, outline: "none", marginBottom: 24, fontFamily: "'Outfit', sans-serif", color: "#1a1625" }} />
            <label style={{ display: "block", fontSize: 15, fontWeight: 500, color: "#3d3654", marginBottom: 6 }}>Пароль</label>
            <input type="password" placeholder="Введите пароль" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && handleLogin()} style={{ width: "100%", padding: "14px 16px", borderRadius: 2, border: `1.5px solid ${error ? "#e24b4a" : "#e6dff0"}`, fontSize: 16, outline: "none", marginBottom: 20, fontFamily: "'Outfit', sans-serif", color: "#1a1625" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, color: "#5c5672", cursor: "pointer" }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#570589" }} />Запомнить меня
              </label>
              <span style={{ fontSize: 15, color: "#570589", fontWeight: 500, cursor: "pointer" }}>Забыли пароль?</span>
            </div>
            {error && <div style={{ padding: "12px 16px", borderRadius: 2, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 14, marginBottom: 20 }}>{error}</div>}
            <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: 2, border: "none", background: loading ? "#8a5caf" : "#570589", color: "#fff", fontSize: 17, fontWeight: 600, cursor: loading ? "wait" : "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
              {loading && <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite" }} />}
              {loading ? "Входим..." : "Войти"}
            </button>
            <button onClick={() => setShowDemo(!showDemo)} style={{ width: "100%", padding: "14px", borderRadius: 2, border: "1.5px solid #e6dff0", background: "#fff", color: "#5c5672", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Демо-аккаунты для жюри</button>
            {showDemo && (
              <div style={{ marginTop: 12, border: "1.5px solid #e6dff0", borderRadius: 2, overflow: "hidden" }}>
                {DEMO_ACCOUNTS.map((acc, i) => (
                  <button key={acc.role} onClick={() => fillDemo(acc)} style={{ width: "100%", padding: "12px 16px", border: "none", borderBottom: i < 3 ? "1px solid #f0eef5" : "none", background: "#fff", cursor: "pointer", display: "flex", justifyContent: "space-between", fontFamily: "'Outfit', sans-serif", fontSize: 15 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ff")} onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                    <span style={{ fontWeight: 600, color: "#3d3654" }}>{acc.role}</span>
                    <span style={{ color: "#9490a3", fontSize: 14 }}>{acc.email}</span>
                  </button>
                ))}
              </div>
            )}
            <p style={{ textAlign: "center", fontSize: 15, color: "#9490a3", marginTop: 24 }}>Нет аккаунта? <span style={{ color: "#570589", fontWeight: 500, cursor: "pointer" }}>Обратитесь к администрации</span></p>
          </div>
          <div style={{ fontSize: 14, color: "#b8b3c7" }}>Aqbobek International School 2025</div>
        </div>
        <div style={{ flex: 1, background: "#f3edf9", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ textAlign: "center", animation: "float 4s ease-in-out infinite" }}>
            <img src="/logo.png" alt="Aqbobek" style={{ width: 380, height: "auto", filter: "drop-shadow(0 4px 20px rgba(74, 29, 150, 0.15))" }} />
          </div>
        </div>
      </div>
    </>
  );
}
