const BASE_URL = "http://localhost:3001/api";


async function request(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

// auth
export const login = (email, password) => post("/auth/login", { email, password });

// bilimclass
export const getGrades = (studentId, quarter) =>
  request(`/bilimclass/grades/${studentId}${quarter ? `?quarter=${quarter}` : ""}`);

export const getSubjectGrades = (studentId, subjectName) =>
  request(`/bilimclass/grades/${studentId}/${encodeURIComponent(subjectName)}`);

export const getSchedule = (classId, day) =>
  request(`/bilimclass/schedule/${encodeURIComponent(classId)}${day ? `?day=${encodeURIComponent(day)}` : ""}`);

export const getAnalytics = (studentId) =>
  request(`/bilimclass/analytics/${studentId}`);

// school
export const getStudents = (params) => {
  const query = new URLSearchParams(params).toString();
  return request(`/school/students${query ? `?${query}` : ""}`);
};

export const getStudent = (id) => request(`/school/students/${id}`);

export const getRanking = (cls, grade) =>
  request(`/school/ranking${cls ? `?class=${encodeURIComponent(cls)}` : grade ? `?grade=${encodeURIComponent(grade)}` : ""}`);

export const getAtRiskStudents = () => request("/school/at-risk");

export const getEvents = () => request("/school/events");

export const getNews = () => request("/school/news");

//kiosk
export const getKioskFeed = () => request("/kiosk/feed");

//bilimpath 
export const getAIContext = (studentId) => request(`/ai/context/${studentId}`);
export const aiChat = (studentId, message, history) =>
  post("/ai/chat", { studentId, message, history });

export const postNews = (data) => post("/school/news", data);
export const deleteNews = (id) => fetch(`${BASE_URL}/school/news/${id}`, { method: "DELETE" }).then(r => r.json());
export const postEvent = (data) => post("/school/events", data);
export const deleteEvent = (id) => fetch(`${BASE_URL}/school/events/${id}`, { method: "DELETE" }).then(r => r.json());