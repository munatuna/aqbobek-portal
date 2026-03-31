/**
 * BilimPath — AI Mentor analytics module
 * Improved: natural conversation, no repetition, context-aware
 */

const SUBJECT_TAGS = {
  "Алгебра": ["#STEM", "#Математика"],
  "Геометрия": ["#STEM", "#Математика"],
  "Физика": ["#STEM", "#Наука", "#Робототехника"],
  "Химия": ["#STEM", "#Наука"],
  "Информатика": ["#STEM", "#IT", "#Робототехника"],
  "Английский язык": ["#Языки", "#Международный"],
  "Казахский язык": ["#Языки", "#Культура"],
  "Русский язык": ["#Языки"],
  "Русская литература": ["#Гуманитарные", "#Культура"],
  "История Казахстана": ["#Гуманитарные", "#Культура"],
  "Всемирная история": ["#Гуманитарные"],
  "Основы права": ["#Гуманитарные", "#Право"],
  "Физкультура": ["#Спорт"],
};

const CAREER_MAP = {
  "#STEM": ["Инженер", "Data Scientist", "Разработчик"],
  "#Математика": ["Финансовый аналитик", "Актуарий"],
  "#IT": ["Программист", "ML-инженер", "DevOps"],
  "#Наука": ["Учёный-исследователь", "Фармацевт"],
  "#Робототехника": ["Инженер-робототехник", "Мехатроник"],
  "#Языки": ["Переводчик", "Дипломат", "Журналист"],
  "#Гуманитарные": ["Юрист", "Политолог", "Педагог"],
  "#Право": ["Юрист", "Прокурор", "Нотариус"],
};

const STRESS_KEYWORDS = [
  "устал", "устала", "не могу", "сложно", "трудно", "плохо", "грустно",
  "депрессия", "тяжело", "не понимаю", "боюсь", "стресс", "выгора",
  "не справляюсь", "давление", "перегруж", "нервы", "паника", "тревога",
];

function calculateSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  values.forEach((v, i) => {
    num += (i - xMean) * (v - yMean);
    den += (i - xMean) ** 2;
  });
  return den === 0 ? 0 : parseFloat((num / den).toFixed(3));
}

function analyzeStudentTrends(gradesAllQuarters) {
  const subjectMap = {};
  for (const quarter of gradesAllQuarters) {
    for (const subj of quarter.subjects) {
      if (!subjectMap[subj.name]) subjectMap[subj.name] = [];
      subjectMap[subj.name].push({
        quarter: quarter.quarter,
        average: subj.average,
        formatives: subj.formatives.map((f) => f.value),
        sorPct: subj.summatives.length > 0
          ? Math.round(subj.summatives.reduce((s, sm) => s + sm.percent, 0) / subj.summatives.length)
          : null,
      });
    }
  }

  return Object.entries(subjectMap).map(([name, entries]) => {
    const avgs = entries.filter((e) => e.average !== null).map((e) => e.average);
    const crossSlope = calculateSlope(avgs);
    const lastEntry = entries[entries.length - 1];
    const intraSlope = calculateSlope(lastEntry.formatives);
    const latestAvg = avgs.length > 0 ? avgs[avgs.length - 1] : null;

    let zone;
    if (crossSlope <= -0.5 || (latestAvg !== null && latestAvg < 6)) zone = "red";
    else if (crossSlope >= 0.3 || (latestAvg !== null && latestAvg >= 9)) zone = "green";
    else zone = "yellow";

    return { name, entries, crossSlope, intraSlope, latestAvg, zone, tags: SUBJECT_TAGS[name] || [] };
  });
}

function matchNewsAndEvents(trends, news, events) {
  const studentTags = new Set();
  for (const t of trends) {
    if (t.zone !== "red" && (t.latestAvg === null || t.latestAvg >= 7)) {
      t.tags.forEach((tag) => studentTags.add(tag));
    }
  }
  const allItems = [
    ...news.map((n) => ({ ...n, kind: "news" })),
    ...events.map((e) => ({ ...e, kind: "event" })),
  ];
  return allItems
    .map((item) => ({ ...item, score: (item.tags || []).filter((tag) => studentTags.has(tag)).length }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function buildCareerRecommendations(trends) {
  const topSubjects = trends
    .filter((t) => t.zone === "green" || (t.latestAvg !== null && t.latestAvg >= 8.5))
    .sort((a, b) => (b.latestAvg || 0) - (a.latestAvg || 0))
    .slice(0, 4);
  const careerSet = new Set();
  for (const t of topSubjects) {
    for (const tag of t.tags) {
      (CAREER_MAP[tag] || []).slice(0, 2).forEach((c) => careerSet.add(c));
    }
  }
  return [...careerSet].slice(0, 6);
}

function detectStress(message) {
  const lower = message.toLowerCase();
  return STRESS_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * IMPROVED system prompt - conversational, not template-following
 */
function buildSystemPrompt({ studentName, trends, matchedItems, careers, stressDetected }) {
  const redSubjects = trends.filter((t) => t.zone === "red");
  const greenSubjects = trends.filter((t) => t.zone === "green");
  const yellowSubjects = trends.filter((t) => t.zone === "yellow");

  // Compact data summary
  const subjectLines = trends
    .filter(t => t.latestAvg !== null)
    .sort((a, b) => (b.latestAvg || 0) - (a.latestAvg || 0))
    .map((t) => {
      const trend = t.crossSlope > 0.2 ? "растёт" : t.crossSlope < -0.2 ? "падает" : "стабильно";
      return `${t.name}: ${t.latestAvg} (${trend})`;
    })
    .join("; ");

  const weakSors = trends
    .flatMap(t => (t.entries[t.entries.length - 1]?.sorPct !== null && t.entries[t.entries.length - 1]?.sorPct < 65)
      ? [`${t.name}: ${t.entries[t.entries.length - 1].sorPct}%`] : [])
    .join("; ");

  const eventsList = matchedItems.slice(0, 3).map(i => `"${i.title}" (${i.date})`).join("; ");

  return `Ты BilimPath — AI-наставник ученика ${studentName} в школе Aqbobek International School.

ДАННЫЕ УЧЕНИКА:
Предметы (3 четверть): ${subjectLines}
${weakSors ? `Слабые СОР/СОЧ (<65%): ${weakSors}` : "Все СОР/СОЧ выше 65%."}
${redSubjects.length > 0 ? `Падение: ${redSubjects.map(t => t.name).join(", ")}` : ""}
${greenSubjects.length > 0 ? `Рост: ${greenSubjects.map(t => t.name).join(", ")}` : ""}
${eventsList ? `Подходящие мероприятия: ${eventsList}` : ""}
${careers.length > 0 ? `Возможные профессии: ${careers.join(", ")}` : ""}
${stressDetected ? `ВНИМАНИЕ: ученик проявляет признаки стресса. Прояви эмпатию. Если серьёзно — предложи школьного психолога (каб. 108).` : ""}

ПРАВИЛА:
- Говори как живой наставник, НЕ как бот. Без шаблонов, без списков, без эмодзи в начале строк.
- Отвечай коротко: 2-4 предложения. Не перечисляй все предметы — фокусируйся на вопросе.
- Не повторяй то что уже говорил в этом разговоре. Смотри историю чата.
- Если спрашивают про конкретный предмет — отвечай только про него.
- Если спрашивают про стресс/усталость — сначала поддержи, потом дай один совет.
- Если спрашивают про профориентацию — свяжи с реальными оценками ученика.
- Если просто "привет" — коротко поздоровайся и спроси чем помочь, не вываливай всю аналитику.
- Пиши на русском, обращайся на "ты".
- НЕ начинай каждый ответ с анализа оценок. Отвечай по существу вопроса.`;
}

function runAnalysis({ gradesAllQuarters, studentName, news, events, userMessage }) {
  const trends = analyzeStudentTrends(gradesAllQuarters);
  const matchedItems = matchNewsAndEvents(trends, news, events);
  const careers = buildCareerRecommendations(trends);
  const stressDetected = detectStress(userMessage || "");
  const systemPrompt = buildSystemPrompt({ studentName, trends, matchedItems, careers, stressDetected });
  return { trends, matchedItems, careers, stressDetected, systemPrompt };
}

module.exports = {
  calculateSlope,
  analyzeStudentTrends,
  matchNewsAndEvents,
  buildCareerRecommendations,
  detectStress,
  buildSystemPrompt,
  runAnalysis,
};