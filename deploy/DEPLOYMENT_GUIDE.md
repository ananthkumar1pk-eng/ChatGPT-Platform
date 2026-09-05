# Cloud Deployment Guide — ChatGPT-Style AI Platform

This guide explains how to deploy **ChatGPT-Platform** to production cloud platforms so anyone can access it over the public internet.

---

## Architecture Summary

- **Frontend**: Next.js 14+ (React + TypeScript + Tailwind CSS)
- **Backend**: FastAPI (Python 3.10+) with Server-Sent Events (SSE) streaming
- **Database**: PostgreSQL with async connection pooling
- **LLM Inference**: Hosted cloud endpoints (Groq, OpenAI, Google Gemini, Anthropic, OpenRouter)

---

## Option 1: Full-Stack Deployment on Render (Recommended)

Render allows you to deploy the PostgreSQL database, FastAPI backend, and Next.js frontend with unified orchestration.

### Steps:
1. **Push your repository to GitHub / GitLab**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Blueprint**.
3. Connect your repository and select `deploy/render.yaml`.
4. Fill in the environment variables:
   - `GROQ_API_KEY`: Your Groq Cloud API key (free tier available at [console.groq.com](https://console.groq.com)).
   - `OPENAI_API_KEY`: (Optional) Your OpenAI API key.
   - `GEMINI_API_KEY`: (Optional) Your Google Gemini API key.
5. Click **Apply**. Render will automatically provision:
   - PostgreSQL Database
   - FastAPI Backend Web Service
   - Next.js Frontend Web Service
6. Render will assign you a public URL (e.g., `https://chatgpt-frontend.onrender.com`).

---

## Option 2: Split Deployment (Vercel Frontend + Railway/Render Backend)

For maximum frontend speed and global edge delivery, deploy the frontend on Vercel and the backend on Railway or Render.

### Step 1: Deploy Backend & PostgreSQL on Railway
1. Go to [Railway](https://railway.app/) and create a **New Project**.
2. Add a **PostgreSQL** database service.
3. Add a **GitHub Repo** service pointing to the `/backend` folder.
4. Set the Environment Variables:
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   SECRET_KEY=supersecret_production_key_32_characters_minimum
   APP_ENV=production
   DEBUG=false
   PORT=8000
   GROQ_API_KEY=your_groq_api_key
   CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
   ```
5. Railway will assign a public backend URL (e.g., `https://backend-production.up.railway.app`).

### Step 2: Deploy Frontend on Vercel
1. Go to [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
2. Select your repository and set the **Root Directory** to `frontend`.
3. Add the Environment Variable:
   ```env
   NEXT_PUBLIC_API_URL=https://backend-production.up.railway.app
   ```
4. Click **Deploy**. Vercel will build and assign your live public URL (e.g., `https://chatgpt-platform.vercel.app`).

---

## Option 3: Single-Server Docker Compose Deployment

If you have a VPS (AWS EC2, DigitalOcean Droplet, Linode, Hetzner, etc.):

1. Clone your repo onto the server:
   ```bash
   git clone <repo-url>
   cd ChatGPT-Platform
   ```
2. Create your `.env` file from `.env.example`:
   ```bash
   cp backend/.env.example backend/.env
   # Add your GROQ_API_KEY, OPENAI_API_KEY, etc.
   ```
3. Launch all containers:
   ```bash
   docker-compose up -d --build
   ```
4. Access your application at `http://your-server-ip:3000`.

---

## Verifying the Deployment
1. Open your frontend public URL in your browser.
2. Sign up with an email and password or click **Continue with Google**.
3. Send a test message (e.g. *"Explain quantum computing"*). Verify real-time token streaming over Server-Sent Events.
4. Click the **Document Knowledge Base** button, upload a sample PDF, and ask questions about the document to verify RAG citations!
