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


// Fallback — работает без Gemini на основе анализа оценок
function buildFallbackReply(analysis, message) {
  const { trends, stressDetected, careers, matchedItems } = analysis;
  const msg = message.toLowerCase();

  const red = trends.filter(t => t.zone === "red");
  const green = trends
    .filter(t => t.zone === "green" && t.latestAvg !== null)
    .sort((a, b) => (b.latestAvg || 0) - (a.latestAvg || 0));
  const all = trends
    .filter(t => t.latestAvg !== null)
    .sort((a, b) => (b.latestAvg || 0) - (a.latestAvg || 0));

  // Стресс/усталость
  if (stressDetected) {
    return `Слышу тебя. ${green[0] ? `Смотри — по ${green[0].name} у тебя ${green[0].latestAvg}, это реально сильно.` : ""} Попробуй разбить задачи на маленькие шаги и дать себе передышку. Если совсем тяжело, поговори со школьным психологом (каб. 108). Что сейчас давит больше всего?`;
  }

  // Приветствие
  if (/^(привет|здравствуй|салем|hi|hello|даров|хай)/.test(msg) || msg.length < 10) {
    const summary = green.length
      ? `Сильные стороны: ${green.slice(0, 2).map(t => `${t.name} (${t.latestAvg})`).join(", ")}.`
      : "";
    const warn = red.length ? ` Есть снижение по ${red.map(t => t.name).join(", ")}.` : "";
    return `Привет! ${summary}${warn} Чем могу помочь?`;
  }

  // Конкретный предмет упомянут
  const mentionedSubject = all.find(t => msg.includes(t.name.toLowerCase()));
  if (mentionedSubject) {
    const t = mentionedSubject;
    const trend = t.crossSlope > 0.2 ? "растёт" : t.crossSlope < -0.2 ? "падает" : "стабильный";
    const sor = t.entries[t.entries.length - 1]?.sorPct;
    return `По ${t.name}: средний балл ${t.latestAvg ?? "н/д"}, тренд — ${trend}${sor !== null && sor !== undefined ? `, СОР/СОЧ ${sor}%` : ""}. ${t.zone === "red" ? "Стоит уделить этому приоритет — разбери слабые темы перед следующим СОР." : t.zone === "green" ? "Хороший результат, продолжай в том же темпе." : "Есть потенциал для роста — стабильность хорошо, но можно выше."}`;
  }

  // Профориентация / профессия
  if (/профессия|профориент|куда поступ|специальност|карьер|университет|вуз|факульт/.test(msg)) {
    return `По твоим оценкам вижу склонность к: ${careers.slice(0, 4).join(", ")}. ${green[0] ? `Особенно выделяется ${green[0].name} (${green[0].latestAvg}) — это может стать твоей базой.` : ""} Какое направление интересует больше всего?`;
  }

  // Робототехника, физика, IT, STEM темы
  if (/робот|физик|програм|it\b|информат|stem|инженер|разработ|код|it/.test(msg)) {
    const stemSubjects = all.filter(t => t.tags && (t.tags.includes("#STEM") || t.tags.includes("#IT") || t.tags.includes("#Робототехника")));
    if (stemSubjects.length) {
      return `По STEM-предметам у тебя: ${stemSubjects.map(t => `${t.name} — ${t.latestAvg}`).join(", ")}. ${stemSubjects[0].latestAvg >= 8.5 ? "Хорошая база для инженерного или IT направления." : "Есть куда расти — подтяни базу и будут варианты."} Из мероприятий рекомендую: ${matchedItems.filter(i => i.tags?.includes("#STEM") || i.tags?.includes("#IT")).slice(0, 1).map(i => `"${i.title}"`)[0] || "следи за хакатонами и олимпиадами"}.`;
    }
  }

  // Оценки / успеваемость
  if (/оценк|успеваем|балл|четверт|сор|соч|итог/.test(msg)) {
    const parts = [];
    if (green.length) parts.push(`Лучшие предметы: ${green.slice(0, 3).map(t => `${t.name} (${t.latestAvg})`).join(", ")}.`);
    if (red.length) parts.push(`Требуют внимания: ${red.map(t => `${t.name} (${t.latestAvg ?? "н/д"})`).join(", ")}.`);
    parts.push("По какому предмету чувствуешь наибольшую трудность?");
    return parts.join(" ");
  }

  // Мероприятия / олимпиады
  if (/мероприяти|олимпиад|конкурс|хакатон|событи|участ/.test(msg)) {
    const events = matchedItems.filter(i => i.kind === "event").slice(0, 2);
    if (events.length) return `Подходящие мероприятия по твоим интересам: ${events.map(e => `"${e.title}" — ${e.date}`).join("; ")}. Стоит попробовать!`;
    return "Следи за школьными объявлениями — там регулярно появляются олимпиады и конкурсы по твоим предметам.";
  }

  // Советы по учёбе
  if (/как учить|как запомн|как подготов|совет|помог|не понима|объясн/.test(msg)) {
    return `Хороший вопрос. ${red.length ? `Начни с ${red[0].name} — там сейчас снижение, лучше не запускать.` : `У тебя нет критических проблем — сосредоточься на поддержании темпа.`} Попробуй метод интервальных повторений: разбирай материал небольшими блоками каждый день, а не всё перед СОР.`;
  }

  // Если ничего не подошло — осмысленный дефолт
  return `Смотрю твои данные: ${all.slice(0, 3).map(t => `${t.name} — ${t.latestAvg}`).join(", ")}. Задай вопрос по конкретному предмету, или спроси про профессии, мероприятия, или как подготовиться к СОР.`;
}

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
    const reply = buildFallbackReply(analysis, message);
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
