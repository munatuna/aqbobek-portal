import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { aiChat } from "../api";

export default function StudentAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Привет, ${user?.name?.split(" ")[0] || ""}! Я BilimPath — твой AI-наставник. Анализирую твои оценки и готов помочь.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newHistory = [...messages, { role: "user", content: text }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const data = await aiChat(
        user.studentId,
        text,
        messages.map((m) => ({ role: m.role, content: m.content }))
      );
      setMessages([...newHistory, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...newHistory,
        { role: "assistant", content: "Что-то пошло не так. Попробуй ещё раз." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ height: "calc(100vh - 96px)", overflow: "hidden" }}>

      {/* ── Chat panel ───────────────────────────────────────────────────── */}
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff", borderRadius: 2, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #f5f3f8", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: "#570589", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>AI</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1625" }}>BilimPath · AI Наставник</div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && (
                <div style={{ width: 28, height: 28, background: "#570589", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0, marginRight: 8, alignSelf: "flex-end" }}>AI</div>
              )}
              <div style={{
                maxWidth: "72%",
                padding: "10px 14px",
                borderRadius: 2,
                fontSize: 14,
                lineHeight: 1.55,
                background: m.role === "user" ? "#570589" : "#f5f3f8",
                color: m.role === "user" ? "#fff" : "#1a1625",
                whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, background: "#570589", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>AI</div>
              <div style={{ background: "#f5f3f8", padding: "10px 16px", borderRadius: 2, display: "flex", gap: 4 }}>
                {[0, 1, 2].map((d) => (
                  <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: "#9490a3", animation: `bounce 1.2s ease-in-out ${d * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "14px 22px", borderTop: "1px solid #f5f3f8", display: "flex", gap: 10, flexShrink: 0 }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Напиши вопрос или поделись, как дела..."
            style={{
              flex: 1,
              resize: "none",
              border: "1.5px solid #e6dff0",
              borderRadius: 2,
              padding: "10px 14px",
              fontSize: 14,
              fontFamily: "'Outfit', sans-serif",
              color: "#1a1625",
              outline: "none",
              lineHeight: 1.4,
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              padding: "0 20px",
              background: loading || !input.trim() ? "#c4b5d4" : "#570589",
              color: "#fff",
              border: "none",
              borderRadius: 2,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !input.trim() ? "default" : "pointer",
              fontFamily: "'Outfit', sans-serif",
              flexShrink: 0,
            }}
          >
            →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
