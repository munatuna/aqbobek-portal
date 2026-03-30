const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Load database
const db = JSON.parse(fs.readFileSync(path.join(__dirname, "db.json"), "utf-8"));

// ============================================================
// AUTH
// ============================================================
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }
  // В реальном приложении тут будет JWT
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser, token: "mock-jwt-token-" + Date.now() });
});

// ============================================================
// BILIMCLASS API (Mock)
// При подключении реального BilimClass — заменить эти эндпоинты
// ============================================================

// Оценки ученика по четвертям
app.get("/api/bilimclass/grades/:studentId", (req, res) => {
  const { studentId } = req.params;
  const { quarter } = req.query; // ?quarter=1,2,3 или все
  
  const grades = db.grades[studentId];
  if (!grades) {
    return res.status(404).json({ error: "Ученик не найден" });
  }
  
  if (quarter) {
    const q = parseInt(quarter);
    const filtered = grades.find((g) => g.quarter === q);
    return res.json(filtered || { error: "Четверть не найдена" });
  }
  
  res.json(grades);
});

// Оценки по конкретному предмету
app.get("/api/bilimclass/grades/:studentId/:subjectName", (req, res) => {
  const { studentId, subjectName } = req.params;
  const grades = db.grades[studentId];
  if (!grades) {
    return res.status(404).json({ error: "Ученик не найден" });
  }
  
  const result = grades.map((q) => ({
    quarter: q.quarter,
    name: q.name,
    subject: q.subjects.find((s) => s.name === decodeURIComponent(subjectName)) || null,
  })).filter((q) => q.subject);
  
  res.json(result);
});

// Расписание по классу
app.get("/api/bilimclass/schedule/:classId", (req, res) => {
  const { classId } = req.params;
  const { day } = req.query; // ?day=Понедельник
  
  const schedule = db.schedule[classId];
  if (!schedule) {
    return res.status(404).json({ error: "Класс не найден" });
  }
  
  if (day) {
    return res.json({ day, lessons: schedule[day] || [] });
  }
  
  res.json(schedule);
});

// Аналитика ученика (средние, тренды)
app.get("/api/bilimclass/analytics/:studentId", (req, res) => {
  const grades = db.grades[req.params.studentId];
  if (!grades) {
    return res.status(404).json({ error: "Ученик не найден" });
  }
  
  const analytics = grades.map((q) => {
    const withAvg = q.subjects.filter((s) => s.average !== null);
    const overallAvg = withAvg.length > 0
      ? (withAvg.reduce((sum, s) => sum + s.average, 0) / withAvg.length).toFixed(2)
      : null;
    const fives = q.subjects.filter((s) => s.finalMark === "5").length;
    const totalAbsences = q.subjects.reduce((sum, s) => sum + s.absences, 0);
    const weakSummatives = q.subjects
      .flatMap((s) => s.summatives.map((sm) => ({ subject: s.name, ...sm })))
      .filter((sm) => sm.percent < 80);
    
    return {
      quarter: q.quarter,
      name: q.name,
      overallAverage: overallAvg ? parseFloat(overallAvg) : null,
      fivesCount: fives,
      totalSubjects: q.subjects.length,
      totalAbsences,
      weakSummatives,
    };
  });
  
  res.json(analytics);
});

// ============================================================
// SCHOOL API
// ============================================================

// Список учеников
app.get("/api/school/students", (req, res) => {
  const { class: cls, atRisk } = req.query;
  let students = db.students;
  
  if (cls) students = students.filter((s) => s.class === cls);
  if (atRisk === "true") students = students.filter((s) => s.atRisk);
  
  res.json(students);
});

// Конкретный ученик
app.get("/api/school/students/:id", (req, res) => {
  const student = db.students.find((s) => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: "Ученик не найден" });
  res.json(student);
});

// Рейтинг
app.get("/api/school/ranking", (req, res) => {
  const { limit } = req.query;
  let ranking = [...db.students].sort((a, b) => b.points - a.points);
  if (limit) ranking = ranking.slice(0, parseInt(limit));
  res.json(ranking);
});

// Ученики в зоне риска
app.get("/api/school/at-risk", (req, res) => {
  res.json(db.students.filter((s) => s.atRisk));
});

// Мероприятия
app.get("/api/school/events", (req, res) => {
  res.json(db.events);
});

// Новости
app.get("/api/school/news", (req, res) => {
  res.json(db.news);
});

// ============================================================
// KIOSK (стенгазета — всё в одном запросе)
// ============================================================
app.get("/api/kiosk/feed", (req, res) => {
  const ranking = [...db.students].sort((a, b) => b.points - a.points).slice(0, 5);
  res.json({
    topStudents: ranking,
    events: db.events,
    news: db.news,
    updatedAt: new Date().toISOString(),
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Aqbobek Portal API",
    bilimClassIntegration: "mock",
    version: "1.0.0",
    endpoints: [
      "POST /api/auth/login",
      "GET  /api/bilimclass/grades/:studentId",
      "GET  /api/bilimclass/grades/:studentId/:subject",
      "GET  /api/bilimclass/schedule/:classId",
      "GET  /api/bilimclass/analytics/:studentId",
      "GET  /api/school/students",
      "GET  /api/school/ranking",
      "GET  /api/school/at-risk",
      "GET  /api/school/events",
      "GET  /api/school/news",
      "GET  /api/kiosk/feed",
    ],
  });
});

app.listen(PORT, () => {
  console.log(`\nAqbobek Portal API running on http://localhost:${PORT}`);
  console.log(`Docs: http://localhost:${PORT}/api/health`);
  console.log(`BilimClass Mock: http://localhost:${PORT}/api/bilimclass/grades/STU001`);
  console.log(`Schedule: http://localhost:${PORT}/api/bilimclass/schedule/11А`);
  console.log(`Ranking: http://localhost:${PORT}/api/school/ranking?limit=5\n`);
});
