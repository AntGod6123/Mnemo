# 📚 Mnemo: The Offline AI-Powered ZIM Browser

**Mnemo** is a modern, mobile-friendly offline browser platform for exploring massive ZIM file collections like Wikipedia, Wikivoyage, and more — enriched with AI-powered search, tabbed navigation, translation tools, and a plugin-ready architecture.

Built for educators, researchers, archivists, and knowledge enthusiasts who want **complete access to information without internet dependency**.

---

## ✨ Features

- 🔍 **Unified Search** across multiple ZIM files (with fuzzy matching)
- 🤖 **Optional LLM Assistant** (connect your own service)
- 📑 **Tabbed Article Viewer** with rich media handling
- 🗣️ **Translation Plugin** powered by Argos Translate
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
cd mnemo-browser
docker-compose up --build

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

### Enabling LLM Features

Open the admin panel and supply the URL and API key of your own LLM service.
Unchecking the option hides these fields and disables AI responses in the
search interface.
