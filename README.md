# Daymark task manager

A from-scratch, responsive task management app built with React and Vite in the browser and Express on the server. It includes account registration and sign-in, private per-user task lists, task creation/editing/deletion, due dates, priority, completion, search, and filters.

## 1. What is in the project?

```text
task-management-app/
├── server/
│   ├── data/              # JSON data files are created on first use
│   ├── auth.js            # Checks the signed-in user's access token
│   ├── index.js           # Express API routes and validation
│   └── store.js           # Small JSON-file data store
├── src/
│   ├── api.js             # Browser-to-server requests
│   ├── App.jsx            # Screens, task list, and app state
│   ├── main.jsx           # React entry point
│   └── styles.css         # Responsive layout and visual styling
├── .env.example           # Server settings template
├── index.html             # Browser page shell
├── package.json           # Dependencies and run commands
└── vite.config.js         # Frontend development server and API proxy
```

## 2. How the app works

1. **The browser starts in `src/main.jsx`.** It mounts the main React component and loads the styles.
2. **`src/App.jsx` chooses the screen.** A visitor sees sign-in or account creation. After signing in, the task workspace shows counts, filters, search, and task cards.
3. **`src/api.js` talks to the API.** It sends JSON requests to `/api/...` and adds the user's access token to private task requests.
4. **`server/index.js` handles the work.** It validates sign-in and task data, routes task operations, and ensures each task belongs to the signed-in user.
5. **`server/auth.js` protects private routes.** The browser sends a signed token; the API checks it before allowing access to a user's tasks.
6. **`server/store.js` saves data.** User accounts and tasks are stored in `server/data/users.json` and `server/data/tasks.json`, created automatically. Passwords are hashed before saving.

## 3. Run it locally

Install Node.js 20 or newer, then open a terminal in this project folder.

```bash
npm install
```

Copy `.env.example` to `.env`. Set `JWT_SECRET` to a long random value for your local setup. Then start both the browser app and API:

```bash
npm run dev
```

Open the Vite address shown in the terminal (usually `http://localhost:5173`). Create an account with a password of at least eight characters. The API listens at `http://localhost:4000`; the Vite proxy forwards `/api` requests to it.

To create a production browser bundle, use `npm run build`. To start just the API, use `npm start`.

## 4. Follow one task through the app

When you add a task, the form in `TaskDialog` calls `saveTask` in `src/App.jsx`. `saveTask` calls `api.createTask` in `src/api.js`, which sends `POST /api/tasks`. The server checks the token with `requireAuth`, validates the title, assigns the signed-in user's ID, saves the task, and returns it. The app refreshes the list with `GET /api/tasks`. Editing, completing, and deleting use `PATCH` and `DELETE` routes in the same way.

## 5. Main API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account and return a session token |
| `POST` | `/api/auth/login` | Sign in and return a session token |
| `GET` | `/api/tasks` | List the signed-in user's tasks |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Edit a task or mark it complete |
| `DELETE` | `/api/tasks/:id` | Delete a task |

## 6. Good next steps for a real deployment

This is a learning starter. Before hosting it for real users, replace the JSON file store with a database such as PostgreSQL, set a strong private `JWT_SECRET`, add rate limiting and stricter input validation, and serve the site over HTTPS. JSON files are suitable for learning and a single local process, not concurrent production writes. Live WebSocket updates are left as an optional extension; task changes appear after each API request.
