# RAG Architecture Overview (for this repo)

This document outlines a Retrieval‑Augmented Generation (RAG) architecture that fits the current frontend codebase (Vue + AI chat widget) and can be implemented as a separate backend service. It is designed to be production‑ready, with clear data flow, components, and integration points.

## Goals

- Provide accurate, up‑to‑date answers grounded in your business documents.
- Support the existing AI chat UI (`src/components/ai-chat/AIChatWidget.vue`).
- Be safe, scalable, and cost‑controlled.

## High‑Level Flow

1. User asks a question in the AI chat widget.
2. Backend retrieves relevant documents from a vector database.
3. Backend composes a prompt using:
   - User question
   - Retrieved context snippets
   - System instructions (brand tone, policies)
4. LLM generates the answer.
5. Answer returns to frontend and displays in chat.

## Components

### 1) Ingestion Pipeline (offline or scheduled)

Purpose: Prepare your docs for retrieval.

Steps:
- Collect sources: product docs, pricing, FAQs, onboarding, policies.
- Chunk text into segments (e.g., 400–800 tokens).
- Generate embeddings for each chunk.
- Store in vector DB with metadata (title, URL, section, updated_at).

### 2) Query Pipeline (runtime)

Purpose: Answer user questions in real time.

Steps:
- Receive `message`, `conversation_id`, `history`.
- Embed the user query.
- Retrieve top‑K chunks from vector DB.
- Re‑rank if needed (optional).
- Build prompt with:
  - System policy
  - Context chunks
  - User question
  - Conversation history (optional)
- Call LLM.
- Return answer + citations (optional).

### 3) Vector Database

Store embeddings with metadata for fast similarity search.

Options:
- Cloud: Pinecone, Weaviate, Qdrant Cloud
- Self‑host: Qdrant, Weaviate, pgvector

### 4) LLM Provider

Use any provider that supports chat completions and embeddings.

Examples:
- OpenAI, Anthropic, Google, or local models

### 5) RAG API Service (backend)

Exposes endpoints used by the frontend:

- `POST /ai/chat`
  - Input: `{ message, conversation_id, history[] }`
  - Output: `{ message }`

- `POST /ai/upload` (optional)
  - Input: multipart file + `conversation_id`
  - Output: `{ message }`
  - Use to ingest user‑provided docs into a private index.

## Integration with Current Frontend

Your frontend already calls:
- `${VITE_AI_API_URL || '/ai'}/chat`
- `${VITE_AI_API_URL || '/ai'}/upload`

No frontend changes are required for basic RAG if you implement those endpoints.

## Data Sources (Recommended for this Repo)

- Landing page content
- Features and pricing content
- FAQ + Help Center
- Onboarding and setup docs
- Product and plan descriptions

## Security & Reliability

Minimum production controls:
- API key or JWT auth for the AI endpoints
- Rate limiting per user/IP
- Request logging with correlation IDs
- Input validation for uploads
- Content safety filters (basic allow/deny rules)

## Optional Enhancements

- Streaming responses (SSE/WebSocket) for faster UX
- Citation UI (show sources under answers)
- Role‑based retrieval (different docs for admins vs customers)
- Analytics dashboard (top questions, deflection rate)

## Suggested Tech Stack

Backend:
- Node.js (Express/Fastify) or Python (FastAPI)

Vector DB:
- Qdrant or pgvector

Embeddings:
- OpenAI `text-embedding-3-large` or equivalent

LLM:
- GPT‑4.1 or Claude 3.5 Sonnet (or any provider you prefer)

## Next Step (Implementation Order)

1. Build ingestion pipeline (docs → chunks → embeddings → vector DB).
2. Implement `/ai/chat` with retrieval + LLM response.
3. Add `/ai/upload` if you want user document ingestion.
4. Add auth + rate limits.
5. (Optional) Add streaming + citations.

