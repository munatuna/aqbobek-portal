# Aqbobek Portal

Школьный портал для Aqbobek International School (Астана, Казахстан).

Создан в рамках хакатона JasImpact.

## Что делает

Единая платформа для всех участников учебного процесса:

- **Ученик** — дашборд с оценками и динамикой по четвертям, AI-наставник BilimPath даёт персональные советы на основе реальных данных
- **Учитель** — рейтинг класса 11А по среднему баллу, ученики в зоне риска выделены
- **Родитель** — успеваемость ребёнка в реальном времени
- **Админ** — публикация новостей и мероприятий, которые сразу появляются на школьной стенгазете

## Стек

**Frontend:** React 18, Vite, React Router v6, Context API

**Backend:** Node.js, Express, db.json (файловая БД с персистентностью)

**ИИ:** Google Gemini 2.0 Flash — при недоступности API работает умный fallback на основе анализа оценок

## Запуск

**1. Клонировать репозиторий**
```bash
git clone https://github.com/munatuna/aqbobek-portal.git
cd aqbobek-portal
```

**2. Запустить API сервер**
```bash
cd aqbobek-api
npm install
node server.js
```

**3. Запустить фронтенд** (в отдельном терминале)
```bash
cd ..
npm install
npm run dev
```

Открыть `http://localhost:5173`

## Демо-аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Ученик | aidar@aqbobek.kz | demo |
| Учитель | nurlan.t@aqbobek.kz | demo |
| Родитель | parent@aqbobek.kz | demo |
| Админ | admin@aqbobek.kz | demo |

## API ключ Gemini

Для работы AI-наставника добавь ключ в `aqbobek-api/server.js` строка 10:

```js
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "ТВОЙ_КЛЮЧ";
```

Бесплатный ключ: [aistudio.google.com](https://aistudio.google.com).
Без ключа BilimPath работает на основе анализа оценок без Gemini.

## Структура проекта

```
aqbobek-portal/
├── aqbobek-api/        # Express бэкенд
│   ├── server.js       # API маршруты
│   ├── bilimpath.js    # Логика AI-наставника
│   └── db.json         # Данные (ученики, оценки, новости, мероприятия)
└── src/
    ├── pages/          # Дашборды по ролям
    ├── components/     # Layout, сайдбар
    ├── context/        # Auth контекст
    └── api.js          # API клиент
```
