# Project Overview

This document explains the purpose and connections of every file, folder, and package in this repository.

## Root
- `temp.excalidraw`: Temporary whiteboard/sketch file used during design or planning.
- `Backend/`: Node.js + Express server with authentication, chat APIs, Socket.IO, AI and vector services.
- `Frontend/`: React (Vite) single-page app with Redux, Socket.IO client, routing, and PWA setup.

---
## Backend

- `.env`: Environment variables consumed server-side (e.g., `PORT`, `MONGO_URI`, `JWT_SECRET`, Google/Pinecone keys, `CLIENT_URL`, etc.). Not committed.
- `.gitignore`: Ignore rules for the backend project (e.g., `node_modules`, local env files, etc.).
- `package.json`: Backend package metadata, dependencies, and scripts.
  - Scripts:
    - `dev`: Starts the server with `nodemon` (`server.js`).
  - Dependencies:
    - `express`: HTTP server and routing framework (v5). Core of the API.
    - `mongoose`: ODM for MongoDB, defines schemas/models and queries.
    - `jsonwebtoken`: Issues and verifies JWTs for auth.
    - `bcryptjs`: Hashes and compares passwords.
    - `cors`: Configures cross-origin resource sharing for the API.
    - `cookie-parser`: Parses cookies from requests (used for JWT cookie auth).
    - `dotenv`: Loads `.env` variables.
    - `socket.io`: Real-time WebSocket server for live chat.
    - `@google/genai`: Google Gemini SDK for AI text/embeddings.
    - `@pinecone-database/pinecone`: Pinecone vector DB SDK for memory/search.
    - `cookie`: Utility for cookie parsing/serialization (low-level helper where needed).
- `server.js`: Entry point. Creates HTTP server, initializes DB connection, mounts Socket.IO, then listens on `PORT`.
- `public/`: Static build artifacts served if needed (contains `index.html`, `assets/`, `vite.svg`).
- `src/`: Backend source code.
  - `app.js`: Builds the Express app with middlewares and routes.
    - Middlewares: `cors`, `express.json`, `cookieParser`, `express.static` for `public/`.
    - Routes mounted under `/api`: `auth`, `chat`, and `gov` endpoints. Wildcard `*` serves `public/index.html` for SPA fallback.
  - `db/db.js`: Connects to MongoDB via `mongoose.connect(MONGO_URI, ...)` and exports the connection helper.
  - `middlewares/auth.middleware.js`: Verifies JWT from HTTP cookie, attaches `req.user`, rejects unauthorized requests.
  - `models/`:
    - `user.model.js`: User schema (email, name, password hash, timestamps, etc.).
    - `chat.model.js`: Chat schema (title, owner, timestamps, message relations, etc.).
    - `message.model.js`: Message schema (role, content, chat, user, AI annotations, vector references, etc.).
  - `routes/`:
    - `auth.routes.js`: Auth endpoints: register, login, logout, me.
    - `chat.routes.js`: Chat CRUD and message endpoints: create chat, rename, delete, list messages, etc.
    - `gov.routes.js`: Government-only config/classification endpoints.
  - `controllers/`:
    - `auth.controller.js`: Register/login/logout logic; password hashing; JWT issuance in cookie; get current user.
    - `chat.controller.js`: CRUD for chats/messages; emits message-related operations; may coordinate vector delete when removing content.
  - `services/`:
    - `ai.service.js`: Integrates Google GenAI:
      - Government classifier (enforcing gov-only usage, confidence, method metadata).
      - Response generation conditioned on classification and KB.
      - Embedding generation for vector memory.
    - `vector.service.js`: Pinecone integration for embeddings:
      - `createMemory`: Upserts vectors with sanitized metadata and namespace.
      - `queryMemory`: Vector similarity query with optional filters.
      - `deleteMemoriesByMessageIds` / `deleteMemoriesByFilter`: Currently no-op to avoid SDK incompatibility errors (safe to ignore for functionality).
    - `gov.semantic.js`: Additional helpers for government domain semantics (labels, mappings, or KB glue).
  - `config/`:
    - `gov.config.js`: Government-specific configuration (portals, feature flags, allowlist behavior, etc.).
    - `gov.kb.json`: Knowledge-base JSON used by classification/AI service.
  - `sockets/socket.server.js`: Socket.IO server wiring and events:
    - Auth via cookie JWT on connection.
    - Handles message creation events; persists messages; retrieves long-term memory; obtains AI response; emits events to clients; stores embeddings.

---
## Frontend

- `.gitignore`: Ignore rules (e.g., build artifacts, env files).
- `package.json`: Frontend package metadata, dependencies, and scripts.
  - Scripts:
    - `dev`: Vite dev server.
    - `build`: Bundles production build.
    - `preview`: Serves production build locally.
    - `lint`: Runs eslint on the project.
  - Dependencies:
    - `react`, `react-dom`: UI library.
    - `react-router-dom`: Client-side routing.
    - `@reduxjs/toolkit`, `react-redux`: App state management.
    - `socket.io-client`: Real-time client for chat events.
    - `axios`: HTTP client for REST APIs.
  - DevDependencies:
    - `vite`, `@vitejs/plugin-react`: Build tooling and React integration.
    - `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`: Linting stack.
- `vite.config.js`: Vite configuration (plugins, dev server options if any).
- `README.md`: Notes and instructions for the frontend app.
- `index.html`: Root HTML shell loaded by Vite; links manifest and sets PWA meta tags.
- `public/`: Static assets.
- `src/`: Frontend application source.
  - `main.jsx`: React entry point. Mounts the app, Redux provider, router; registers service worker for PWA.
  - `App.jsx`: Root layout and top-level UI composition.
  - `App.css`: Global app styles (base layout, resets, helpers).
  - `AppRoutes.jsx`: Defines route mapping for pages (e.g., Home, Login, Register).
  - `styles/theme.css`: CSS variables and theme tokens; supports light/dark theme.
  - `lib/http.js`: Axios instance setup pointing to backend, interceptors for auth cookies, etc.
  - `store/`:
    - `store.js`: Configures Redux store and middleware.
    - `chatSlice.js`: Chat state slice (chats, messages, active chat, async thunks to call APIs, reducers for UI states).
  - `pages/`:
    - `Home.jsx`: Main chat page; renders layout, top bar, sidebar, message feed, composer; initializes socket; handles mobile close toggle; shows active chat title.
    - `Login.jsx`: Login form; sends credentials to backend; sets auth state on success.
    - `Register.jsx`: Registration form; creates an account via backend.
  - `components/`:
    - `ThemeToggle.jsx`: Switches between themes; reads/writes preference to storage.
    - `account/`:
      - `AccountPanel.jsx` + `AccountPanel.css`: Account dropdown/panel UI with profile/logout actions.
    - `chat/`:
      - `aiClient.js`: Socket/AI client helpers (emit/send, receive events, formatting utilities).
      - `ChatLayout.css`: Page layout styles for chat view (grid/flex, responsive adjustments).
      - `ChatSidebar.jsx` + `ChatSidebar.css`: Chat list, new chat, rename/delete actions; mobile close button inline.
      - `ChatMobileBar.jsx` + `ChatMobileBar.css`: Top mobile bar; hamburger/close toggle; shows active chat title.
      - `ChatMessages.jsx` + `ChatMessages.css`: Message feed rendering; role-based styles; mobile spacing and heading sizing.
      - `ChatComposer.jsx` + `ChatComposer.css`: Input, send button, toolbar; responsive padding and margins.
      - `NewChatPanel.jsx` + `NewChatPanel.css`: New chat form/panel UI.
      - `RenameChatPanel.jsx`: Rename chat modal or inline panel.
      - `DeleteChatConfirm.jsx`: Confirmation component for chat deletion.

---
## PWA Files (Frontend)
- `public/manifest.webmanifest`: App manifest with name, icons (SVG), theme colors, categories, and screenshots.
- `public/sw.js`: Service worker with cache-first strategy for GET requests.
- `index.html` (Frontend root): Links the manifest and sets PWA meta tags (theme-color, Apple support).
- `public/icons/icon.svg`: Primary SVG icon used by the manifest.
- `public/icons/screenshot-wide.png`: Screenshot asset to enrich install prompt.

---
## How pieces connect
- Frontend uses `axios` (`lib/http.js`) for REST calls to Backend `/api/*` routes.
- Real-time chat uses `socket.io-client` to connect to Server (`sockets/socket.server.js`).
- Server authenticates via cookie JWT (set on login) and exposes routes in `routes/*` handled by `controllers/*`.
- AI flows go through `services/ai.service.js` using `@google/genai` for classification and responses.
- Vector memory persists and retrieves embeddings using `services/vector.service.js` with Pinecone.
- MongoDB persistence (Users, Chats, Messages) via Mongoose models in `models/*`.

---
## Environment variables (Backend examples)
- `PORT`: HTTP server port (default often 3000).
- `CLIENT_URL`: CORS allowlist origin for the frontend.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: JWT signing secret.
- `GOOGLE_GENAI_API_KEY`: Google GenAI API key.
- `PINECONE_API_KEY`: Pinecone API key.
- `PINECONE_INDEX`: Pinecone index name.
- `PINECONE_NAMESPACE`: Namespace for vector memory (default `default`).

---
## Backend Scripts
- `npm run dev`: Start backend in development using `nodemon`.

## Frontend Scripts
- `npm run dev`: Start Vite dev server.
- `npm run build`: Build production bundle.
- `npm run preview`: Preview built app locally.
- `npm run lint`: Lint project with ESlint.

