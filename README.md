# divine-web

The responsive single-page web client for the Divine Garbh Sanskar application. Built with React (Vite), Ant Design, Apollo Client, and Firebase Authentication.

## Core Layout Features

- **Top Horizontal Navbar**: Desktop view features a clean, horizontal top-navigation bar centered with routing links.
- **Scrollable Sidebar Navigation**: Side navigation layout includes an independently scrollable navigation container (`.sidebar-nav-container`). This prevents menu overflow issues when logged in with accounts with high privilege roles (like Admin or Staff) and keeps helper/version components visible without overlapping.
- **Swipable Mobile Tabs**: Mobile view features a swipable horizontal sub-navigation tab bar just below the header, allowing quick one-tap page transitions.
- **Responsive Drawer**: Mobile layout includes a sliding navigation drawer triggered by the top-left hamburger menu.
- **Theme Variables**: Customized color styles configured in `src/index.css` matching the saffron gold (`--color-brand-primary`) and mahogany brown (`--color-brand-secondary`) brand logo palette.

## Keep-Alive Ping Loop

- The frontend incorporates a background ping task that runs on client initialization inside [main.jsx](file:///d:/WEBSITE%20DEVELOPMENT/thedivinegarbhsanskar/divine-web/src/main.jsx).
- It pings the backend `/ping` endpoint immediately on load and then every 5 minutes in the background to ensure the Render server stays active during active user sessions.
- Logs and status can be inspected in the browser **Console** and **Network** tabs.

## Local Configuration

Create a `.env` file in the `divine-web` directory:

```env
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GRAPHQL_API_URL=http://localhost:4000/graphql
```

## Available Scripts

- **`npm run dev`**: Launch the client development server on port `3000`.
- **`npm run build`**: Compile the production asset bundle.
- **`npm run preview`**: Review the compiled production build locally.

