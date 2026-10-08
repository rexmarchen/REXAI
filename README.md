# REXION AI — Autonomous Career Platform

REXION AI is an intelligent, agentic career operating system designed to automate job discovery, ATS resume matching, cold outreach sequencing, LinkedIn network engagement, and high-velocity applications.

---

## 🏗 Architecture & Project Structure

The codebase is organized into clean, isolated modules and microservices:

```text
rexionAI/
├── frontend/             # Primary Vite + React web application (Port 5173)
├── backend/              # Node.js + Express API server (Port 5000)
│   └── intern-hub/       # Micro-internships & gig discovery service (Port 5051)
├── ml_service/           # Python FastAPI Machine Learning & ATS Engine (Port 8000)
├── agents/               # Autonomous AI Agents
│   ├── apply-flow-agent/ # 1-Click Multi-platform Job Apply Flow Agent
│   ├── job-agentic-ai/   # Autonomous Job Discovery & Scraping Agent
│   ├── linkedin-rag-agent/ # LinkedIn RAG & Smart Outreach Network Agent
│   └── mail-outreach-agent/ # Cold Email Generation & Outreach Sequencing Agent
├── scripts/              # Orchestration & Dev Runners
└── docs/                 # Architecture, Integration & Reference Guides
```

---

## 🚀 Services & Ports

| Service | Technology | Port | URL / Health |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vite + React | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | Node.js / Express | `5000` | [http://localhost:5000/api/health](http://localhost:5000/api/health) |
| **Intern Hub API** | Node.js / Express | `5051` | [http://localhost:5051/api/health](http://localhost:5051/api/health) |
| **ML Engine** | Python / FastAPI | `8000` | [http://localhost:8000/health](http://localhost:8000/health) |

---

## 🛠 Running the Development Stack

To launch all services (Frontend, Backend, Intern Hub, ML Service):

```bash
# Start unified dev runner
npm run dev

# Start MongoDB backend
npm run dev:mongo
```

### Individual Agent Commands
```bash
# Run LinkedIn RAG Agent
npm run agent:linkedin
npm run agent:linkedin:auto

# Run Outreach Mail Agent
npm run agent:outreach

# Run 1-Click Apply Flow Agent
npm run agent:apply

# Run Job Discovery Agent
npm run agent:discovery
```
