# 🎨 SmartArch Board

![SmartArch Banner](file:///C:/Users/DHRUV%20GUPTA/.gemini/antigravity/brain/c7d0d89d-51e0-4bc7-8473-cbe59defac0a/smartarch_banner_1778857140939.png)

**SmartArch Board** is a professional, real-time collaborative whiteboard platform designed specifically for architects and designers. It combines a powerful infinite canvas with AI-driven insights to transform your design workflow.

🚀 **Live Demo:** https://smartarch-board-1.onrender.com/

---

## ✨ Key Features

- 🔄 **Real-Time Collaboration:** Synchronous multi-user editing with live cursors and instant state updates via WebSockets.
- 🧠 **AI Design Assistant:** Intelligent suggestions and architectural insights powered by Groq AI.
- 🛠 **Powerful Design Tools:** Full-featured toolkit including freehand drawing, geometric shapes, sticky notes, and connectors using Fabric.js.
- 🔒 **Secure Authentication:** Robust user accounts and per-user board management via Supabase.
- 📁 **Persistent Projects:** Your boards are saved securely in a PostgreSQL database, ensuring your work is never lost.
- 🌓 **Aesthetic UI:** Modern, responsive design with smooth animations and a premium glassmorphism aesthetic.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Vanilla CSS + TailwindCSS
- **Canvas:** Fabric.js
- **State Management:** Zustand
- **Animations:** Motion (Framer Motion)
- **Collaboration:** Socket.IO Client

### Backend
- **Core:** FastAPI (Python)
- **Real-Time:** Socket.IO (ASGI)
- **Database:** Supabase (PostgreSQL)
- **Caching:** Redis (Upstash)
- **AI Engine:** Groq SDK

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Supabase Project
- Redis Instance (Upstash recommended)
- Groq API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/guptadhruv780/SmartArch-Board.git
   cd SmartArch-Board
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

Create a `.env` file in both `frontend` and `backend` directories.

**Backend (`backend/.env`):**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
REDIS_URL=your_redis_url
GROQ_API_KEY=your_groq_key
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Locally

1. **Start Backend:**
   ```bash
   cd backend
   uvicorn main:socket_app --reload
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Developed with ❤️ by [Dhruv Gupta](https://github.com/guptadhruv780)**
