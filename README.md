# 📚 Mnemo: The Offline AI-Powered ZIM Browser

**Mnemo** is a modern, mobile-friendly offline browser platform for exploring massive ZIM file collections like Wikipedia, Wikivoyage, and more — enriched with AI-powered search, tabbed navigation, translation tools, and a plugin-ready architecture.

Built for educators, researchers, archivists, and knowledge enthusiasts who want **complete access to information without internet dependency**.

---

## ✨ Features

- 🔍 **Unified Search** across multiple ZIM files (with fuzzy matching)
- 🤖 **Optional LLM Assistant** (connect your own service)
- 📑 **Tabbed Article Viewer** with rich media handling
- 🗣️ **Translation Plugin** powered by Argos Translate
- 🌐 **One-Click Page Translation** with automatic language detection
- 📄 **Export to PDF** for offline sharing of any open article
- 💡 **LAN Sharing** for offline local networks
- 🧩 **Plugin System** for extensions like summaries, translations, filters
- 🔒 **Admin-Only Controls** for plugin and ZIM management
- 🌙 **Dark Mode + Mobile-First UI** with full offline functionality

---

## 🧠 Architecture

- **Backend**: Python FastAPI with modular services (ZIM loader, search, LLM, translation)
- **Frontend**: React + Vite + TailwindCSS for a fast, responsive UI
- **Storage**: SQLite (bookmarks, user profiles, config)
- **Deployment**: Docker Compose for backend and frontend

---

## 🚀 Quick Start

```bash
git clone https://github.com/AntGod6123/Mnemo.git
cd Mnemo
sudo docker compose up --build

``` 

This command builds the backend and frontend containers. After they start,
visit <http://localhost:3000> to use the interface. The FastAPI backend is
available at <http://localhost:8000>. If you want LLM features, run your own
service separately (for example an Ollama container) and configure its URL in
the admin panel. When you're done, stop the stack with <kbd>Ctrl</kbd>+<kbd>C</kbd>
and clean up the containers using:

```bash
docker-compose down

```

### Environment Variables

Set the `SECRET_KEY` environment variable before starting the backend. This
key signs session cookies, and the server will fail to launch if it is not
provided.

```bash
export SECRET_KEY=your-secret-key
```

You can override where ZIM archives are read from:

```bash
export ZIM_DIR=/app/data/zim
export SESSION_TIMEOUT=30
```

`SESSION_TIMEOUT` sets how many minutes an idle login remains valid. If not
specified, the default is 30 minutes.

#### Building the Frontend

Running `npm run build` will now prompt you for the backend host IP address. The
script lists detected local IPs and sets `VITE_BACKEND_URL` accordingly before
invoking the Vite build. You can skip the prompt by setting the `HOST_IP`
environment variable or by calling `npm run build:actual` directly.

The provided URL becomes the API endpoint that the browser communicates with.

### Default Admin Login

An initial administrator account is preconfigured in `data/users.json`:

- **Username**: `admin`
- **Password**: `admin123`

Edit this file and restart the backend if you need to change the credentials.

Translation support is optional. Install the Argos Translate models from the
**Server Settings** dialog by clicking <kbd>Install Translation</kbd>.

### Adding ZIM Files

Place your ZIM archives in `./data/zim` on the host. This folder is mounted into
the backend container at `/app/data/zim`. Any `.zim` files you drop there will
be loaded automatically when the stack starts.

Place additional ZIM archives in the configured `ZIM_DIR` folder and restart the backend to load them.

### Enabling LLM Features

Open the admin panel and supply the URL and API key of your own LLM service.
Unchecking the option hides these fields and disables AI responses in the
search interface. Searches now open a dedicated results page that lists
matching articles and, when enabled, the LLM's response. Clicking a result
opens that article in a new browser tab.

### Customizing Collections

Admins can provide custom titles and images for each ZIM file. In the server
settings dialog, edit the **Collection Overrides** JSON field. Keys are the
ZIM filenames and values may include `title` and `image` URLs:

```json
{
  "wikipedia_en.zim": { "title": "Wikipedia", "image": "/static/wiki.png" }
}
```
These overrides appear on the home page grid after saving and reloading.

### Frontend Development

The React interface relies on TailwindCSS. Styles are processed via PostCSS during the Vite build. For local development run:

```bash
cd frontend
npm install
npm run dev
```

To generate the production assets manually use:

```bash
npm run build
```

You will be asked for the backend IP address unless the `HOST_IP` environment
variable is already set. The command runs Tailwind through `postcss.config.js`
so all utility classes compile correctly.
