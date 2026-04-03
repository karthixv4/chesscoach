# Chess Coach API Reference

Base URL: `http://localhost:3000`  
All protected routes require: `Authorization: Bearer <token>`

---

## 1. Auth

### `POST /api/auth/register`
**Auth:** Public

**Body:**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "pass123", "role": "trainer" }
```
> `role` must be `"trainer"` or `"student"`

**201 Created:**
```json
{
  "token": "<jwt>",
  "user": { "id": "c-123", "name": "John Doe", "email": "john@example.com", "role": "trainer", "avatar": "https://ui-avatars.com/..." }
}
```

| Status | Scenario |
|---|---|
| `400` | Missing fields / invalid role |
| `409` | Email already registered |

---

### `POST /api/auth/login`
**Auth:** Public

**Body:**
```json
{ "email": "john@example.com", "password": "pass123" }
```

**200 OK:** Same shape as register response.

| Status | Scenario |
|---|---|
| `400` | Missing email or password |
| `401` | Wrong email or password |

---

### `GET /api/auth/me`
**Auth:** Any role

**200 OK:**
```json
{ "id": "c-123", "name": "John Doe", "email": "john@example.com", "role": "trainer", "avatar": "..." }
```

| Status | Scenario |
|---|---|
| `401` | No / invalid token |
| `404` | User not found |

---

## 2. Classrooms

### `POST /api/classrooms`
**Auth:** Trainer

**Body:**
```json
{ "studentEmail": "alex@example.com" }
```

**201 Created:**
```json
{
  "id": "cl-1", "trainerId": "t-1", "studentId": "s-1",
  "studentName": "Alex", "studentAvatar": "...", "trainerName": "Bob",
  "progress": 0, "recentActivity": null
}
```

| Status | Scenario |
|---|---|
| `400` | Missing `studentEmail` / target user is not a student |
| `403` | Caller is not a trainer |
| `404` | No user with that email |
| `409` | Student is already in a classroom |

---

### `GET /api/classrooms`
**Auth:** Any role

**200 OK:** Array of classroom summaries (trainer sees all theirs; student sees their own).
```json
[{
  "id": "cl-1", "trainerId": "t-1", "studentId": "s-1",
  "studentName": "Alex", "studentAvatar": "...", "trainerName": "Bob",
  "progress": 75, "recentActivity": "2 sessions, 4 homework"
}]
```

---

### `GET /api/classrooms/:classroomId`
**Auth:** Must be part of the classroom

**200 OK:**
```json
{
  "id": "cl-1", "trainerId": "t-1", "studentId": "s-1",
  "studentName": "Alex", "trainerName": "Bob", "progress": 75,
  "notes": "Only returned if caller is trainer",
  "sessions": [ ... ],
  "lessons": [ ... ],
  "homework": [ ... ],
  "materials": [ ... ]
}
```

| Status | Scenario |
|---|---|
| `403` | Caller not in this classroom |
| `404` | Classroom not found |

---

### `PATCH /api/classrooms/:classroomId/notes`
**Auth:** Trainer

**Body:**
```json
{ "notes": "Needs to work on Sicilian Defense." }
```

**200 OK:**
```json
{ "success": true, "notes": "Needs to work on Sicilian Defense." }
```

| Status | Scenario |
|---|---|
| `400` | `notes` field missing |
| `403` | Caller is not this classroom's trainer |
| `404` | Classroom not found |

---

## 3. Sessions

### `POST /api/classrooms/:classroomId/sessions`
**Auth:** Trainer

**Body:**
```json
{
  "title": "Weekly Review", "date": "2026-03-25",
  "startTime": "10:00 AM", "endTime": "11:00 AM",
  "link": "https://meet.google.com/abc"
}
```
> `link` is optional

**201 Created:** Full session object.

| Status | Scenario |
|---|---|
| `400` | Missing `title`, [date](file:///c:/VK/hobby-projects/chess-coach-backend/src/controllers/lesson.controller.js#62-90), `startTime`, or `endTime` |
| `403` | Not this classroom's trainer |
| `404` | Classroom not found |

---

### `PATCH /api/classrooms/:classroomId/sessions/:sessionId/status`
**Auth:** Trainer

**Body:**
```json
{
  "status": "completed",
  "notes": "Great session, covered endgames.",
  "cancellationReason": "Trainer sick",
  "rescheduledTo": { "date": "2026-03-26", "startTime": "10:00 AM", "endTime": "11:00 AM" },
  "materials": ["m-1", "m-2"],
  "homeworkIds": ["h-1"]
}
```
> All fields except `status` are **optional and conditional** (e.g. `cancellationReason` only for `cancelled`)  
> Valid statuses: `scheduled` · `ongoing` · `completed` · `cancelled` · `postponed` · `preponed`

**200 OK:** Updated session object with attached materials and homework.

| Status | Scenario |
|---|---|
| `400` | Invalid or missing `status` |
| `403` | Not this classroom's trainer |
| `404` | Session or classroom not found |

---

### `DELETE /api/classrooms/:classroomId/sessions/:sessionId`
**Auth:** Trainer

**200 OK:** `{ "success": true }`

| Status | Scenario |
|---|---|
| `403` | Not this classroom's trainer |
| `404` | Session or classroom not found |

---

## 4. Lessons

### `POST /api/classrooms/:classroomId/lessons`
**Auth:** Trainer

**Body:**
```json
{
  "title": "Sicilian Defense", "date": "2026-03-20",
  "summary": "Basic concepts.",
  "detailedNotes": "## Markdown notes...",
  "videoUrl": "https://youtube.com/...",
  "pgn": "1. e4 c5 2. Nf3 d6..."
}
```
> Only `title` and [date](file:///c:/VK/hobby-projects/chess-coach-backend/src/controllers/lesson.controller.js#62-90) are required. Rest are optional.

**201 Created:** Lesson object with `status: "NEW"`.

---

### `PATCH /api/classrooms/:classroomId/lessons/:lessonId`
**Auth:** Trainer

**Body:** Any partial subset of lesson fields (`title`, [date](file:///c:/VK/hobby-projects/chess-coach-backend/src/controllers/lesson.controller.js#62-90), `summary`, `detailedNotes`, `videoUrl`, `pgn`).

**200 OK:** Updated lesson object.

| Status | Scenario |
|---|---|
| `403` | Not this classroom's trainer |
| `404` | Lesson or classroom not found |

---

### `PATCH /api/classrooms/:classroomId/lessons/:lessonId/read`
**Auth:** Student

No body required.

**200 OK:** `{ "success": true, "status": "reviewed" }`

| Status | Scenario |
|---|---|
| `403` | Caller is not this classroom's student |
| `404` | Lesson or classroom not found |

---

## 5. Homework

### `POST /api/classrooms/:classroomId/homework`
**Auth:** Trainer

**Body:**
```json
{
  "title": "Mate in 2", "type": "board", "dueDate": "2026-03-25",
  "description": "Find the forced mate.",
  "challenge": {
    "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    "winningMoves": ["Qxf7#"]
  }
}
```
> `type`: `board` · `text` · `video`  
> `challenge` is only used when `type` is `"board"`

**201 Created:** Homework object with `status: "ASSIGNED"`.

---

### `POST /api/classrooms/:classroomId/homework/:homeworkId/submit`
**Auth:** Student

**Body:**
```json
{ "submission": "Qxf7#" }
```

**200 OK:** Homework object with `status: "SUBMITTED"`.

| Status | Scenario |
|---|---|
| `400` | Missing `submission` / already evaluated |
| `403` | Caller is not this classroom's student |
| `404` | Homework or classroom not found |

---

### `POST /api/classrooms/:classroomId/homework/:homeworkId/evaluate`
**Auth:** Trainer

**Body:**
```json
{ "score": 100, "feedback": "Excellent vision!" }
```
> `score` must be 0–100. `feedback` is optional.

**200 OK:** Homework object with `status: "EVALUATED"` + updated classroom `progress`.

| Status | Scenario |
|---|---|
| `400` | Missing score / score out of range |
| `403` | Not this classroom's trainer |
| `404` | Homework or classroom not found |

---

## 6. Materials

### `POST /api/classrooms/:classroomId/materials`
**Auth:** Trainer

**Body:**
```json
{ "title": "Endgame Manual", "type": "pdf", "url": "https://example.com/endgame.pdf" }
```
> `type`: `pdf` · `video` · `link`

**201 Created:** Material object.

---

### `DELETE /api/classrooms/:classroomId/materials/:materialId`
**Auth:** Trainer

**200 OK:** `{ "success": true }`

| Status | Scenario |
|---|---|
| `403` | Not this classroom's trainer |
| `404` | Material or classroom not found |

---

## 7. Notifications

### `POST /api/classrooms/:classroomId/notifications`
**Auth:** Student

**Body:**
```json
{
  "message": "Should I move the Knight here?",
  "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/... (optional)"
}
```

**201 Created:** Notification object.

| Status | Scenario |
|---|---|
| `400` | Missing `message` |
| `403` | Caller is not this classroom's student |
| `404` | Classroom not found |

---

### `GET /api/notifications`
**Auth:** Trainer

**200 OK:** Array of unread notifications across all the trainer's classrooms, newest first.
```json
[{
  "id": "n-1", "message": "...", "fen": "...", "isRead": false,
  "createdAt": "...",
  "sender": { "id": "s-1", "name": "Alex", "avatar": "..." },
  "classroom": { "id": "cl-1" }
}]
```

---

### `PATCH /api/notifications/:notificationId/read`
**Auth:** Trainer

No body required.

**200 OK:** `{ "success": true }`

| Status | Scenario |
|---|---|
| `403` | Trainer does not own this notification's classroom |
| `404` | Notification not found |

---

## Standard Error Response

All errors follow this shape:
```json
{ "error": "ErrorType", "message": "Human-readable explanation." }
```

| Code | Type | Meaning |
|---|---|---|
| `400` | `BadRequest` | Invalid / missing input |
| `401` | `Unauthorized` | No token or invalid token |
| `403` | `Forbidden` | Wrong role or not in classroom |
| `404` | `NotFound` | Resource doesn't exist |
| `409` | `Conflict` | Duplicate resource |
| `500` | `InternalServerError` | Unexpected server error |
