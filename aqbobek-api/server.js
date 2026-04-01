require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bilimpath = require("./bilimpath");

const app = express();
const PORT = 3001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "db.json");
let db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

function saveDb() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
}

//авторизация
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser, token: "mock-jwt-token-" + Date.now() });
});

//"билимкласс"
app.get("/api/bilimclass/grades/:studentId", (req, res) => {
  const grades = db.grades[req.params.studentId];
  if (!grades) return res.status(404).json({ error: "Ученик не найден" });
  
  const { quarter } = req.query; 
  if (quarter) {
    const q = parseInt(quarter);
    const filtered = grades.find((g) => g.quarter === q);
    return res.json(filtered || { error: "Четверть не найдена" });
  }
  res.json(grades);
});

app.get("/api/bilimclass/schedule/:classId", (req, res) => {
  const schedule = db.schedule[req.params.classId];
  if (!schedule) return res.status(404).json({ error: "Класс не найден" });
  res.json(schedule);
});

app.get("/api/bilimclass/analytics/:studentId", (req, res) => {
  const grades = db.grades[req.params.studentId];
  if (!grades) return res.status(404).json({ error: "Ученик не найден" });
  
  const analytics = grades.map((q) => {
    const withAvg = q.subjects.filter((s) => s.average !== null);
    const overallAvg = withAvg.length > 0
      ? (withAvg.reduce((sum, s) => sum + s.average, 0) / withAvg.length).toFixed(2)
      : null;
    return {
      quarter: q.quarter,
      overallAverage: overallAvg ? parseFloat(overallAvg) : null,
      totalAbsences: q.subjects.reduce((sum, s) => sum + s.absences, 0),
    };
  });
  res.json(analytics);
});

app.get("/api/school/students", (req, res) => {
  const { class: cls } = req.query;
  let students = db.students;
  if (cls) students = students.filter((s) => s.class === cls);
  res.json(students);
});

app.get("/api/school/students/:id", (req, res) => {
  const student = db.students.find((s) => s.id === req.params.id || s.studentId === req.params.id);
  if (!student) return res.status(404).json({ error: "Ученик не найден" });
  res.json(student);
});

app.get("/api/school/at-risk", (req, res) => {
  res.json(db.students.filter((s) => s.currentAvg < 7.5));
});

app.get("/api/school/ranking", (req, res) => {
  const { class: cls, grade } = req.query;
  let students = [...db.students];
  if (cls) students = students.filter((s) => s.class === cls);
  else if (grade) students = students.filter((s) => s.class.replace(/[А-Яа-яA-Za-z]+$/, "") === grade);
  students.sort((a, b) => b.currentAvg - a.currentAvg);
  students.forEach((s, i) => { s.rank = i + 1; });
  res.json(students);
});

app.get("/api/school/events", (req, res) => {
  res.json(db.events);
});

app.get("/api/school/news", (req, res) => {
  res.json(db.news);
});

app.post("/api/school/news", (req, res) => {
  const { title, text, date } = req.body;
  if (!title || !text) return res.status(400).json({ error: "title и text обязательны" });
  const item = { id: Date.now(), title, text, date: date || new Date().toISOString().slice(0, 10) };
  db.news.unshift(item);
  saveDb();
  res.status(201).json(item);
});

app.delete("/api/school/news/:id", (req, res) => {
  const id = parseInt(req.params.id);
  db.news = db.news.filter((n) => n.id !== id);
  saveDb();
  res.json({ ok: true });
});

app.post("/api/school/events", (req, res) => {
  const { title, description, date, category, photo } = req.body;
  if (!title || !date) return res.status(400).json({ error: "title и date обязательны" });
  const item = { id: Date.now(), title, description: description || "", date, category: category || "school", photo: photo || "" };
  db.events.unshift(item);
  saveDb();
  res.status(201).json(item);
});

app.delete("/api/school/events/:id", (req, res) => {
  const id = parseInt(req.params.id);
  db.events = db.events.filter((e) => e.id !== id);
  saveDb();
  res.json({ ok: true });
});

//киоск
app.get("/api/kiosk/feed", (req, res) => {
  const ranking = [...db.students].sort((a, b) => b.compositeScore - a.compositeScore).slice(0, 5);
  res.json({
    topStudents: ranking,
    events: db.events,
    news: db.news,
    updatedAt: new Date().toISOString(),
  });
});


//ии
app.post("/api/ai/chat", async (req, res) => {
  const { studentId, message, history = [] } = req.body;

  try {
    const grades = db.grades[studentId];
    const student = db.students.find(s => s.studentId === studentId || s.id === studentId);
    if (!grades) return res.status(404).json({ error: "Ученик не найден" });

    const analysis = bilimpath.runAnalysis({
      gradesAllQuarters: grades,
      studentName: student?.name || "Ученик",
      news: db.news || [],
      events: db.events || [],
      userMessage: message,
    });

    // Попытка вызвать Gemini
    if (GEMINI_API_KEY) {
      try {
        const contents = history
          .filter(msg => msg.role !== "system")
          .map(msg => ({ role: msg.role === "assistant" ? "model" : "user", parts: [{ text: msg.content }] }));
        contents.push({ role: "user", parts: [{ text: message }] });

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              system_instruction: { parts: [{ text: analysis.systemPrompt }] },
              generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
            }),
          }
        );

        const data = await response.json();
        if (!data.error) {
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return res.json({ reply, trends: analysis.trends, matchedItems: analysis.matchedItems });
        }
        console.warn("[BilimPath] Gemini недоступен, используется fallback:", data.error?.message);
      } catch (geminiErr) {
        console.warn("[BilimPath] Gemini fetch error:", geminiErr.message);
      }
    }

    // Fallback — умный ответ без Gemini
    const reply = bilimpath.buildFallbackReply(analysis, message);
    res.json({ reply, trends: analysis.trends, matchedItems: analysis.matchedItems });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.listen(PORT, () => {
  console.log(`\nhttp://localhost:${PORT}`);
  console.log(`http://localhost:${PORT}/api/school/news`);
});
