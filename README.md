# AyurSutra

AyurSutra is a full-stack Ayurvedic wellness and Panchakarma management platform. It supports patients, practitioners, and admins with therapy booking, doctor approval, notifications, Python-backed ML analytics, AI guidance, and MongoDB-backed content for herbs and wellness centers.

## Tech Stack

- Frontend: React 19, Vite, React Router, Axios, Recharts, Lucide icons
- Backend: Node.js, Express 5, MongoDB, Mongoose, JWT auth
- ML layer: Python scripts called from Node.js
- AI advisor: Gemini API through backend service
- Notifications: in-app alerts, email through SMTP, SMS through Twilio
- Scheduling: appointment booking, approval, reminders, and care instructions

## Main Features

- User authentication with access token and refresh cookie
- Patient, practitioner, and admin dashboards
- Dosha/Prakriti assessment with Python decision-tree classification
- Therapy recommendations using Python cosine similarity
- Patient progress prediction using Python linear regression
- Feedback anomaly detection using Python z-score analysis
- Patient analytics: dosha radar chart, therapy progress bar, health improvement line chart
- Admin analytics: total bookings, popular therapies pie chart, monthly sessions bar chart
- Patient appointment booking with pre-care and post-care instructions
- Practitioner appointment approval and cancellation workflow
- Patient detail page for doctors with appointments, therapy history, progress, and anomaly alerts
- In-app notification bell and notifications page
- Appointment booking/cancellation notifications
- Therapy reminder alerts 24 hours and 15 minutes before sessions
- Optional email notifications with Gmail SMTP
- Optional SMS reminders with Twilio
- AI Advisor for patient-context Ayurvedic guidance
- Seeded herbs and wellness centers

## Project Structure

```text
AyurSutra_Capstone/
  src/
    components/          Reusable React components
    context/             Auth context
    pages/               App pages and dashboards
    services/api.js      Axios API client
  server/
    config/              DNS/Mongo helper config
    controllers/         Express route controllers
    middleware/          Auth, validation, errors, rate limit
    ml/
      python/ml_engine.py  Python ML and analytics engine
      *.js                 Node wrappers for Python ML
    models/              Mongoose schemas
    routes/              Express routes
    scripts/             Database seed scripts
    services/            Gemini, notifications, cron jobs
```

## Prerequisites

- Node.js 18 or newer
- Python 3.10 or newer
- MongoDB Atlas URI or local MongoDB
- Optional: Gemini API key
- Optional: Gmail app password for email notifications
- Optional: Twilio credentials for SMS reminders

## Installation

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
cd ..
```

## Environment Setup

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ayursutra
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_DNS_SERVERS=8.8.8.8,1.1.1.1

SMS_ENABLED=true
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_PHONE=+1234567890

MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1
```

Create root `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

If you only want in-app notifications during development:

```env
EMAIL_ENABLED=false
SMS_ENABLED=false
```

## Running the App

Run frontend and backend together:

```bash
npm run dev:all
```

Run frontend only:

```bash
npm run dev
```

Run backend only:

```bash
cd server
npm run dev
```

Build frontend:

```bash
npm run build
```

## Database Seeding

Seed herbs and centers:

```bash
npm run seed
```

The seed script uses `server/.env` and connects to `MONGODB_URI`.

## Python ML Engine

The backend calls Python through `server/ml/pythonBridge.js`.

Main Python file:

```text
server/ml/python/ml_engine.py
```

Implemented ML commands:

- `classify-prakriti`: decision-tree Prakriti classification
- `recommend-therapy`: cosine-similarity therapy recommendation
- `predict-progress`: linear regression progress prediction
- `score-slots`: appointment slot ranking
- `find-anomalies`: z-score anomaly detection
- `patient-analytics`: dashboard radar/progress/trend datasets
- `admin-analytics`: admin booking and therapy chart datasets

If Python is not available as `python`, set:

```env
PYTHON_BIN=python
```

## API Overview

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Patients:

- `GET /api/patients`
- `POST /api/patients`
- `GET /api/patients/me`
- `PUT /api/patients/me`
- `GET /api/patients/:id`
- `PUT /api/patients/:id`
- `DELETE /api/patients/:id`

Appointments:

- `GET /api/appointments`
- `GET /api/appointments/my`
- `POST /api/appointments`
- `GET /api/appointments/:id`
- `PUT /api/appointments/:id/approve`
- `PUT /api/appointments/:id/cancel`

Therapies:

- `GET /api/therapies`
- `POST /api/therapies`
- `PUT /api/therapies/:id`
- `DELETE /api/therapies/:id`
- `GET /api/therapies/availability`
- `GET /api/therapies/practitioners`

ML and analytics:

- `POST /api/ml/prakriti`
- `GET /api/ml/patient-analytics`
- `POST /api/ml/recommend-therapy`
- `POST /api/ml/predict-progress`
- `POST /api/ml/optimal-slots`
- `GET /api/ml/anomalies/:patientId`

Notifications:

- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`

Other:

- `GET /api/herbs`
- `GET /api/centers`
- `POST /api/feedback`
- `POST /api/advisor/chat`
- `GET /api/admin/overview`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id/role`

## Roles

Patient:

- Book appointments
- View upcoming sessions
- Complete Prakriti assessment
- View therapy progress and health improvement charts
- Submit feedback
- Use AI Advisor
- Receive notifications and reminders

Practitioner:

- View patients
- Open patient details
- Approve or cancel pending appointments
- Review patient progress and anomaly alerts
- View weekly session stats

Admin:

- View platform analytics
- See total bookings and monthly sessions
- View popular therapies
- Manage user roles

## Notifications

In-app notifications are stored in MongoDB and shown through the notification bell and notifications page.

Email notifications use SMTP:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

SMS reminders use Twilio:

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_PHONE=+1234567890
```

Reminder alerts:

- 24 hours before therapy
- 15 minutes before therapy

## Troubleshooting

MongoDB Atlas DNS issues:

```env
MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1
```

Email DNS issues:

```env
EMAIL_DNS_SERVERS=8.8.8.8,1.1.1.1
```

Disable email or SMS locally:

```env
EMAIL_ENABLED=false
SMS_ENABLED=false
```

Gemini model errors:

```env
GEMINI_MODEL=gemini-2.5-flash
```

Rate limiting in development is relaxed automatically unless `NODE_ENV=production`.
