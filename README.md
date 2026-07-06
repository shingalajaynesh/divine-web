# divine-web

The responsive single-page web client for the Divine Garbh Sanskar application. Built with React (Vite), Ant Design, Apollo Client, and Firebase Authentication.

## Core Layout Features

- **Top Horizontal Navbar**: Desktop view features a clean, horizontal top-navigation bar centered with routing links.
- **Swipable Mobile Tabs**: Mobile view features a swipable horizontal sub-navigation tab bar just below the header, allowing quick one-tap page transitions.
- **Responsive Drawer**: Mobile layout includes a sliding navigation drawer triggered by the top-left hamburger menu.
- **Theme Variables**: Customized color styles configured in `src/index.css` matching the saffron gold (`--color-brand-primary`) and mahogany brown (`--color-brand-secondary`) brand logo palette.

## Local Configuration

Create a `.env` file in the `divine-web` directory:

```env
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
```

## Available Scripts

- **`npm run dev`**: Launch the client development server on port `3000`.
- **`npm run build`**: Compile the production asset bundle.
- **`npm run preview`**: Review the compiled production build locally.
