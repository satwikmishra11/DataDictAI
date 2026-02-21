# DataDictAI

AI-enhanced Data Dictionary & Metadata Extraction Platform.

## Tech Stack
- **Frontend**: React (TypeScript), Tailwind CSS, React Flow, Lucide Icons
- **Backend**: FastAPI, Celery, SQLAlchemy, Pandas, NumPy
- **AI**: LangChain (OpenAI/Anthropic)
- **Infrastructure**: PostgreSQL (Metadata), Redis (Task Queue), MinIO (Artifact Storage)

## Getting Started

### 1. Environment Setup
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

### 2. Start Infrastructure (Docker)
```bash
docker-compose up --build
```

### 3. Initialize Database (Optional, if not auto-created)
```bash
docker-compose exec backend python create_tables.py
```

### 4. Start Frontend (Local Dev)
```bash
cd frontend
npm install
npm run dev
```

## Features
- **Auto-Extraction**: Connects to databases via SQLAlchemy and extracts schema metadata.
- **Data Profiling**: Computes null rates, distributions, and basic statistics using Pandas.
- **AI Summaries**: Generates business-friendly documentation using LLMs.
- **Interactive Chat**: Natural language interface to query your database schema.
- **Relationship Visualization**: Entity-Relationship diagrams using React Flow.
- **Versioned Artifacts**: Stores JSON/Markdown documentation in MinIO/S3.
