# divine-web

The responsive web client dashboard for the Divine Garbh Sanskar application. Built with React (Vite), Ant Design, Apollo Client, and Firebase Authentication.

## Core Features

- **Role-Based Consoles**: Custom consoles tailored for Super Admins, Franchise Managers, Staff, and Maternal Patients.
- **Scrollable Sidebar Navigation**: Features an independently scrollable sidebar container that prevents menu overflow on high-privilege accounts.
- **DevOps Control Panel**: Real-time replication lag meters, pool settings, and trigger buttons for database backup snapshot drills.
- **Live Class Webinars Management**: UI tools to schedule live sessions, manage member bookings, send automatic reminders, and mark attendance rosters.

---

## Directory Map

```text
divine-web/
├── src/
│   ├── components/      # Reusable widgets (Audio/Video Modals, Welcome screen)
│   ├── config/          # Firebase and Apollo Client configs
│   ├── graphql/         # Operations (queries & mutations)
│   ├── routes/          # Application routes configuration
│   ├── views/           # Primary page views (StaffConsole, TodayDashboard, etc.)
│   └── index.css        # Core stylesheet and layout variable tokens
└── vite.config.js       # Vite configuration with compression plugins
```

---

## Local Configuration

Create a `.env` file in the root of the `divine-web` directory:

```env
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# GraphQL Server Endpoint
VITE_GRAPHQL_API_URL=http://localhost:4000/graphql
```

---

## Available Scripts

- **`npm run dev`**: Start the Vite developer hot-reloading server on `http://localhost:3000`.
- **`npm run build`**: Compile and compress the production asset bundles (with Brotli and Gzip plugins).
- **`npm run preview`**: Review the compiled production build locally.
