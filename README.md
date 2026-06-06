# 🎬 CineAI — AI-Powered Movie Recommender

A conversational AI movie recommender built with React and Groq LLM. Users chat naturally with CineAI to get personalized movie recommendations based on their mood, genre preferences, language, and audience type.

🌐 **Live Demo:** [movie-recommender-ap.vercel.app](https://movie-recommender-ap.vercel.app)

---

## ✨ Features

- 🤖 **AI Chat Interface** — Conversational recommendations powered by Llama 3.3 via Groq
- ❤️ **Watchlist** — Save movies and access them anytime
- ⭐ **Star Ratings** — Rate movies 1–5 stars
- 🌍 **Language Filter** — English, Hindi (Bollywood), Korean, Spanish, French
- 👨‍👩‍👧 **Audience Filter** — All audiences, Family friendly, or Adult
- ✨ **Surprise Me** — Get an instant random recommendation
- 🌙 **Dark / Light Mode** — Toggle between themes
- 💾 **Persistent Storage** — Chat history and watchlist saved in localStorage
- 📱 **Responsive Design** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | Frontend UI |
| Vite | Build tool & dev server |
| Groq API | AI language model (Llama 3.3 70B) |
| Vercel | Hosting & serverless functions |
| localStorage | Client-side data persistence |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### Installation

```bash
# Clone the repo
git clone https://github.com/Anjali01-ais/movie-recommender.git
cd movie-recommender

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the root:
```
GROQ_API_KEY=your_groq_api_key_here
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
movie-recommender/
├── api/
│   └── chat.js          # Vercel serverless function (Groq API proxy)
├── src/
│   ├── App.jsx          # Main React component
│   └── main.jsx         # Entry point
├── index.html
├── vercel.json          # Vercel deployment config
├── vite.config.js       # Vite config with dev proxy
└── .env.local           # API keys (not committed)
```

---

## 🔒 Security

- API key is stored in environment variables, never exposed in frontend code
- `.env.local` is listed in `.gitignore`
- All Groq API calls go through a serverless backend function

---

## 📦 Deployment

This project is deployed on **Vercel**. Every push to `main` triggers an automatic redeployment.

To deploy your own:
1. Fork this repo
2. Import to [vercel.com](https://vercel.com)
3. Add `GROQ_API_KEY` in Vercel Environment Variables
4. Deploy!

---

## 🙋‍♀️ Author

**Anjali Singh**
- GitHub: [@Anjali01-ais](https://github.com/Anjali01-ais)

---

## 📄 License

MIT License — free to use and modify.
