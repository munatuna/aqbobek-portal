import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const MENU = {
  "Ученик": [
    { label: "Дашборд", path: "/student", icon: "◻" },
    { label: "Оценки", path: "/student/grades", icon: "▦" },
    { label: "Рейтинг", path: "/student/ranking", icon: "▲" },
    { label: "AI Наставник", path: "/student/ai", icon: "◈" },
  ],
  "Учитель": [
    { label: "Дашборд", path: "/teacher", icon: "◻" },
    { label: "Ученики", path: "/teacher/students", icon: "▦" },
    { label: "Зона риска", path: "/teacher/risk", icon: "▼" },
  ],
  "Родитель": [
    { label: "Дашборд", path: "/parent", icon: "◻" },
    { label: "Динамика", path: "/parent/progress", icon: "▲" },
  ],
  "Админ": [
    { label: "Дашборд", path: "/admin", icon: "◻" },
    { label: "Аналитика", path: "/admin/analytics", icon: "▦" },
    { label: "Новости", path: "/admin/news", icon: "◈" },
    { label: "Стенгазета", path: "/kiosk", icon: "▣" },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const menu = MENU[user.role] || [];

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          fontFamily: "'Outfit', sans-serif",
          background: "#f5f3f8",
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            width: 240,
            background: "#1a1625",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "24px 0",
            flexShrink: 0,
          }}
        >
          <div>
            {/* Logo */}
            <div
              style={{
                padding: "0 20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#570589",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  borderRadius: 4,
                }}
              >
                AQ
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>
                  Aqbobek Portal
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                  {user.role}
                </div>
              </div>
            </div>

            {/* Menu */}
            <nav style={{ padding: "8px 10px" }}>
              {menu.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "10px 14px",
                      border: "none",
                      background: active ? "rgba(87, 5, 137, 0.5)" : "transparent",
                      color: active ? "#fff" : "rgba(255,255,255,0.55)",
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                      borderRadius: 2,
                      transition: "all .15s",
                      textAlign: "left",
                      marginBottom: 2,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ fontSize: 16, opacity: 0.7 }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom - logout */}
          <div style={{ padding: "0 10px" }}>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 14px",
                border: "none",
                background: "transparent",
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                borderRadius: 2,
                transition: "all .15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              ← Выйти
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            padding: "32px 40px",
            overflowY: "auto",
            maxHeight: "100vh",
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}
