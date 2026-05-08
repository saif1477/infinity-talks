# ∞ Infinity Talks
### Local RAG-Powered Expert Intelligence System

Infinity Talks is a high-fidelity, privacy-first conversational platform that allows users to interact with 12 of history's greatest minds and modern visionaries. Unlike traditional chatbots, this system runs **entirely locally** using a custom RAG (Retrieval-Augmented Generation) pipeline and the Gemma 4 LLM engine.

---

## 🧠 The Architecture

### 1. Local RAG Pipeline (Semantic Memory)
Every expert is grounded in a dedicated knowledge base harvested from public domain texts, biographies, and historical transcripts.
*   **Vector Engine**: Powered by Transformers.js using the `all-MiniLM-L6-v2` model.
*   **Storage**: High-performance local SQLite database (`knowledge.db`) containing over 10,000 semantic chunks.
*   **Retrieval**: Real-time cosine similarity search (Top-3 context injection) before every inference cycle.

### 2. The Gemma 4 Engine
The platform utilizes the **Gemma 4** family of models, running directly in the browser via WebGPU. This ensures zero data ever leaves the device, providing absolute privacy for sensitive conversations.

### 3. Deep Realism & Time-Locks
*   **Vocal DNA**: Custom-engineered CO-STAR prompts for 12 distinct personas, stripping away AI-politeness for raw character accuracy.
*   **Temporal Anchoring**: Historical figures (Newton, Einstein, Curie) are strictly time-locked to their death dates. They possess zero knowledge of the future, maintaining historical immersion.
*   **Answer-First Logic**: Enforced 4-sentence maximum responses to ensure punchy, expert-level communication without verbose "AI chatter."

---

## 🏛️ The 12 Experts
*   **Steve Jobs**: Design perfectionist & product visionary (Time-locked: 2011).
*   **Albert Einstein**: Theoretical physicist & thought experiment specialist.
*   **Isaac Newton**: The father of classical physics (18th-century persona).
*   **Marie Curie**: Stoic pioneer of radioactivity and scientific rigor.
*   **Nikola Tesla**: Master of AC and wireless energy (obsessed with 3, 6, 9).
*   **Stephen Hawking**: Cosmologist with a focus on black holes and dry wit.
*   **Elon Musk**: First-principles engineering and multi-planetary strategy.
*   **Sundar Pichai**: Measured corporate strategy and information democratization.
*   **Mark Zuckerberg**: Engineering-first focus on Open Source AI and social presence.
*   **J. Robert Oppenheimer**: Somber, poetic, and focused on nuclear ethics.
*   **Warren Buffett**: Folksy, common-sense value investing logic.
*   **Bill Gates**: Data-driven optimism and systems thinking for global health.

---

## 🛠️ Tech Stack
*   **Framework**: Expo (React Native for Web/Native)
*   **LLM Runtime**: WebLLM (@mlc-ai/web-llm)
*   **Embeddings**: Transformers.js (@xenova/transformers)
*   **Database**: SQLite (expo-sqlite)
*   **Backend/Auth**: Supabase (Messaging & Session Persistence)
*   **Deployment**: Vercel & GitHub Actions

---

## 🔒 Privacy Statement
Infinity Talks is a private project designed for secure, local intelligence. No user prompts or character responses are processed by third-party AI providers. All semantic search and LLM inference happen locally on the user's hardware.

---
*Developed by the Lead AI Architect & Data Engineering Team.*
