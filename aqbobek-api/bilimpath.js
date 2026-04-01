/**
 * BilimPath — AI Mentor
 */

const SUBJECT_TAGS = {
  "Алгебра":           ["#STEM", "#Математика"],
  "Геометрия":         ["#STEM", "#Математика"],
  "Физика":            ["#STEM", "#Наука", "#Робототехника"],
  "Химия":             ["#STEM", "#Наука"],
  "Информатика":       ["#STEM", "#IT", "#Робототехника"],
  "Английский язык":   ["#Языки", "#Международный"],
  "Казахский язык":    ["#Языки", "#Культура"],
  "Русский язык":      ["#Языки"],
  "Русская литература":["#Гуманитарные", "#Культура"],
  "История Казахстана":["#Гуманитарные", "#Культура"],
  "Всемирная история": ["#Гуманитарные"],
  "Основы права":      ["#Гуманитарные", "#Право"],
  "Физкультура":       ["#Спорт"],
};

const CAREER_MAP = {
  "#STEM":         ["Инженер", "Data Scientist", "Разработчик"],
  "#Математика":   ["Финансовый аналитик", "Актуарий"],
  "#IT":           ["Программист", "ML-инженер", "DevOps"],
  "#Наука":        ["Учёный-исследователь", "Фармацевт"],
  "#Робототехника":["Инженер-робототехник", "Мехатроник"],
  "#Языки":        ["Переводчик", "Дипломат", "Журналист"],
  "#Гуманитарные": ["Юрист", "Политолог", "Педагог"],
  "#Право":        ["Юрист", "Прокурор", "Нотариус"],
};

const STRESS_KEYWORDS = [
  "устал","устала","не могу","сложно","трудно","плохо","грустно",
  "депрессия","тяжело","не понимаю","боюсь","стресс","выгора",
  "не справляюсь","давление","перегруж","нервы","паника","тревога",
  "опускаются руки","не хочу","зачем","бессмысленно","всё плохо",
];

function slope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xm = (n - 1) / 2;
  const ym = values.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  values.forEach((v, i) => { num += (i - xm) * (v - ym); den += (i - xm) ** 2; });
  return den === 0 ? 0 : parseFloat((num / den).toFixed(3));
}

function analyzeStudentTrends(gradesAllQuarters) {
  const map = {};
  for (const quarter of gradesAllQuarters) {
    for (const subj of quarter.subjects) {
      if (!map[subj.name]) map[subj.name] = [];
      map[subj.name].push({
        quarter: quarter.quarter,
        average: subj.average,
        formatives: subj.formatives.map(f => f.value),
        sorPct: subj.summatives.length > 0
          ? Math.round(subj.summatives.reduce((s, sm) => s + sm.percent, 0) / subj.summatives.length)
          : null,
      });
    }
  }

  return Object.entries(map).map(([name, entries]) => {
    const avgs = entries.filter(e => e.average !== null).map(e => e.average);
    const crossSlope = slope(avgs);
    const lastEntry = entries[entries.length - 1];
    const intraSlope = slope(lastEntry.formatives);
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
    if (t.latestAvg !== null && t.latestAvg >= 7) {
      t.tags.forEach(tag => studentTags.add(tag));
    }
  }
  const allItems = [
    ...news.map(n => ({ ...n, kind: "news" })),
    ...events.map(e => ({ ...e, kind: "event" })),
  ];
  return allItems
    .map(item => ({ ...item, score: (item.tags || []).filter(tag => studentTags.has(tag)).length }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function buildCareerRecommendations(trends) {
  const top = trends
    .filter(t => t.latestAvg !== null && t.latestAvg >= 7.5)
    .sort((a, b) => (b.latestAvg || 0) - (a.latestAvg || 0));
  const careerSet = new Set();
  for (const t of top) {
    for (const tag of t.tags) {
      (CAREER_MAP[tag] || []).slice(0, 2).forEach(c => careerSet.add(c));
    }
  }
  return [...careerSet].slice(0, 6);
}

function detectStress(message) {
  const lower = message.toLowerCase();
  return STRESS_KEYWORDS.some(kw => lower.includes(kw));
}

function buildSystemPrompt({ studentName, trends, matchedItems, careers, stressDetected }) {
  const withAvg = trends.filter(t => t.latestAvg !== null).sort((a, b) => (b.latestAvg || 0) - (a.latestAvg || 0));
  const green = withAvg.filter(t => t.zone === "green");
  const red = withAvg.filter(t => t.zone === "red");

  const subjectLines = withAvg.map(t => {
    const tr = t.crossSlope > 0.2 ? "↑" : t.crossSlope < -0.2 ? "↓" : "→";
    const sor = t.entries[t.entries.length - 1]?.sorPct;
    return `  ${t.name}: ${t.latestAvg} ${tr}${sor != null ? `, СОР ${sor}%` : ""}`;
  }).join("\n");

  const recommendations = matchedItems.slice(0, 3).map(i =>
    `  - "${i.title}" (${i.date}) — подходит по: ${i.tags?.join(", ") || ""}`
  ).join("\n");

  return `Ты BilimPath — AI-наставник ученика ${studentName} в школе Aqbobek International School (Астана).

ОЦЕНКИ УЧЕНИКА (текущая четверть, отсортированы от высоких к низким):
${subjectLines}

Сильные предметы (зона green, балл ≥ 9): ${green.map(t => `${t.name} (${t.latestAvg})`).join(", ") || "нет"}
Требуют внимания (зона red): ${red.map(t => `${t.name} (${t.latestAvg})`).join(", ") || "нет"}
Карьерные направления по профилю: ${careers.join(", ") || "не определены"}

Актуальные мероприятия/новости подходящие этому ученику:
${recommendations || "  нет актуальных"}

${stressDetected ? "⚠️ СТРЕСС: ученик проявляет признаки усталости или стресса. Начни с эмпатии. Если серьёзно — предложи психолога (каб. 108)." : ""}

ПРАВИЛА:
- Говори как живой наставник, коротко: 2-4 предложения.
- Обращайся на "ты", иногда по имени (${studentName.split(" ")[0]}).
- ВАЖНО: когда описываешь сильные стороны — называй ВСЕ сильные предметы, не один.
- При профориентации: дай 2-3 конкретных направления с объяснением почему они подходят.
- При рекомендации мероприятия — объясни связь с конкретными предметами ученика.
- Если написал просто "привет" — коротко поздоровайся, не вываливай всю аналитику.
- Не повторяй уже сказанное, смотри историю диалога.
- Только русский язык.`;
}

function buildFallbackReply(analysis, message) {
  const { trends, stressDetected, careers, matchedItems } = analysis;
  const msg = message.toLowerCase();

  const withAvg = trends.filter(t => t.latestAvg !== null).sort((a, b) => (b.latestAvg || 0) - (a.latestAvg || 0));
  const green = withAvg.filter(t => t.zone === "green");
  const red = withAvg.filter(t => t.zone === "red");

  // Стресс
  if (stressDetected) {
    const support = green.length
      ? `Но смотри на свои оценки: ${green.slice(0, 3).map(t => `${t.name} (${t.latestAvg})`).join(", ")} — это реально сильно.`
      : "";
    return `Слышу тебя, и это нормально — иногда бывает тяжело. ${support} Попробуй разбить задачи на маленькие части и не брать всё сразу. Если совсем давит — поговори с психологом (каб. 108). Что сейчас больше всего беспокоит?`;
  }

  // Приветствие
  if (/^(привет|здравствуй|салем|hi|hello|даров|хай)/.test(msg) || msg.trim().length < 10) {
    const warn = red.length ? ` Стоит подтянуть ${red.map(t => t.name).join(", ")}.` : "";
    return `Привет! Чем могу помочь?${warn}`;
  }

  // Конкретный предмет
  const mentionedSubject = withAvg.find(t => msg.includes(t.name.toLowerCase()));
  if (mentionedSubject) {
    const t = mentionedSubject;
    const trendStr = t.crossSlope > 0.2 ? "растёт" : t.crossSlope < -0.2 ? "падает" : "стабильный";
    const sor = t.entries[t.entries.length - 1]?.sorPct;
    const advice = t.zone === "red"
      ? "Рекомендую разобрать слабые темы до следующего СОР."
      : t.zone === "green" ? "Отличный результат, продолжай в том же темпе."
      : "Есть потенциал вырасти ещё выше.";
    return `По ${t.name}: балл ${t.latestAvg}, тренд — ${trendStr}${sor != null ? `, СОР/СОЧ ${sor}%` : ""}. ${advice}`;
  }

  // Профориентация
  if (/професси|профориент|куда поступ|специальност|карьер|универс|вуз|факульт|кем стать|выбор/.test(msg)) {
    if (!green.length) return `По твоим оценкам ещё сложно определить одно направление. Есть предмет который нравится больше всего?`;
    const groups = {};
    for (const t of green) {
      for (const tag of t.tags) {
        if (CAREER_MAP[tag]) {
          if (!groups[tag]) groups[tag] = { subjects: [], careers: CAREER_MAP[tag] };
          if (!groups[tag].subjects.includes(t.name)) groups[tag].subjects.push(t.name);
        }
      }
    }
    const lines = Object.values(groups).slice(0, 3)
      .map(g => `• ${g.subjects.join(", ")} → ${g.careers.slice(0, 2).join(", ")}`);
    return `По твоим сильным предметам вижу несколько направлений:\n${lines.join("\n")}\nКакое из них интереснее?`;
  }

  // STEM / конкретные интересы
  if (/робот|программ|it\b|it-|информат|stem|инженер|разработ|код|физик|химия|математ|алгебр/.test(msg)) {
    const tagMap = { робот: "#Робототехника", программ: "#IT", информат: "#IT", "it": "#IT", инженер: "#STEM", разработ: "#IT", код: "#IT", физик: "#Наука", химия: "#Наука", математ: "#Математика", алгебр: "#Математика" };
    const relatedTag = Object.entries(tagMap).find(([kw]) => msg.includes(kw))?.[1];
    const relatedSubjects = withAvg.filter(t => relatedTag ? t.tags.includes(relatedTag) : t.tags.includes("#STEM"));
    const relatedEvents = matchedItems.filter(i => relatedTag ? (i.tags || []).includes(relatedTag) : (i.tags || []).some(tag => ["#STEM","#IT","#Робототехника"].includes(tag))).slice(0, 2);
    const subStr = relatedSubjects.length ? `По смежным предметам у тебя: ${relatedSubjects.map(t => `${t.name} (${t.latestAvg})`).join(", ")}.` : "";
    const evStr = relatedEvents.length ? ` Из актуального: ${relatedEvents.map(i => `"${i.title}"`).join(", ")} — советую обратить внимание.` : "";
    const advice = relatedSubjects.some(t => t.latestAvg >= 8.5) ? "Хорошая база для этого направления." : "Подтяни смежные предметы — это откроет больше возможностей.";
    return `${subStr} ${advice}${evStr}`;
  }

  // Мероприятия
  if (/мероприяти|олимпиад|конкурс|хакатон|событи|участ|записаться/.test(msg)) {
    const items = matchedItems.slice(0, 3);
    if (!items.length) return "Следи за объявлениями в школьной стенгазете — там появляются мероприятия по твоим предметам.";
    return `Вот что сейчас актуально для тебя:\n${items.map(i => `• "${i.title}" (${i.date})`).join("\n")}\nПодходит по твоим предметам. Хочешь узнать про какое-то подробнее?`;
  }

  // Оценки
  if (/оценк|успеваем|балл|четверт|сор|соч|как у меня/.test(msg)) {
    const parts = [];
    if (green.length) parts.push(`Сильные: ${green.map(t => `${t.name} (${t.latestAvg})`).join(", ")}.`);
    if (red.length) parts.push(`Требуют внимания: ${red.map(t => `${t.name}`).join(", ")}.`);
    return parts.join(" ") + " По какому предмету нужна помощь?";
  }

  // Дефолт
  const topStr = withAvg.slice(0, 4).map(t => `${t.name} (${t.latestAvg})`).join(", ");
  return `Смотрю твои оценки: ${topStr}. Спроси про конкретный предмет, профессии или мероприятия — помогу.`;
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
  analyzeStudentTrends,
  matchNewsAndEvents,
  buildCareerRecommendations,
  detectStress,
  buildSystemPrompt,
  buildFallbackReply,
  runAnalysis,
};
