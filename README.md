# 📚 Mnemo: The Offline AI-Powered ZIM Browser

**Mnemo** is a modern, mobile-friendly offline browser platform for exploring massive ZIM file collections like Wikipedia, Wikivoyage, and more — enriched with AI-powered search, tabbed navigation, translation tools, and a plugin-ready architecture.

Built for educators, researchers, archivists, and knowledge enthusiasts who want **complete access to information without internet dependency**.

---

## ✨ Features

- 🔍 **Unified Search** across multiple ZIM files (with fuzzy matching)
- 🤖 **Local LLM Assistant** (via Ollama, llama.cpp, etc.)
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
- **Deployment**: Docker Compose with support for NGINX + Ollama

---

## 🚀 Quick Start

```bash
git clone https://github.com/AntGod6123/Mnemo.git
cd mnemo-browser
docker-compose up --build

``` 

This command builds the backend, frontend, and LLM containers and then starts
them. Once the build completes, visit <http://localhost:3000> to use the
interface. The FastAPI backend is available at <http://localhost:8000> and the
LLM service runs on <http://localhost:11434>. When you're done, stop the stack
with <kbd>Ctrl</kbd>+<kbd>C</kbd> and clean up the containers using:

```bash
docker-compose down

```
