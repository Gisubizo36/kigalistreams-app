# KigaliStreams 🎬

> A modern, responsive web and mobile streaming platform for discovering and watching interpreted movies and series (*Agasobanuye*) in Kinyarwanda.

[![Live Demo](https://img.shields.io/badge/Demo-kigalistreams.lol-orange?style=flat-square)](https://kigalistreams.lol)
[![Vercel Deployment](https://img.shields.io/badge/Deployed%20with-Vercel-black?style=flat-square&logo=vercel)](https://kigalistreams-app.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 🌟 Overview

**KigaliStreams** brings high-quality interpreted cinema (featuring legendary translators such as Rocky, Savimbi, Gaheza, and more) into a cinema-grade, dark-themed streaming interface. 

The application is built with React and Vite, powered by Firebase for real-time authentication and Firestore persistence, and packaged for Android using Capacitor.

### 🌐 Live Platforms
* **Web App:** [kigalistreams.lol](https://kigalistreams.lol)
* **Vercel Mirror:** [kigalistreams-app.vercel.app](https://kigalistreams-app.vercel.app)
* **Android Release:** Available via the in-app mobile download banner

---

## ✨ Features

- **Cinema Dark UI:** Immersive, distraction-free movie theater aesthetic with responsive layouts across mobile, tablet, and desktop.
- **Categorized Feeds:** Browse trending movies, Rwandan cinema, interpreted releases, genres, and specific translator collections.
- **Fast Search & Filtering:** Real-time search by title, translator, genre, or release year.
- **Watch Later:** Save movies to a personal watchlist with offline caching.
- **Movie Request System:** Community request board allowing users to submit and vote on movie/series requests.
- **Interactive Comments:** Leave and read timestamped reviews and discussions.
- **Offline Resilience:** IndexedDB persistence layer ensures cached metadata loads instantly even on slow mobile connections.
- **Cross-Platform:** Native Android wrapper powered by Capacitor alongside the Progressive Web App (PWA).

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **Backend & Database:** Google Firebase (Firestore, Authentication, Hosting)
- **State Management:** React Hooks & Context with IndexedDB local persistence
- **Mobile Engine:** Capacitor (Android)
- **Deployment:** Vercel (Edge CDN)

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Gisubizo36/kigalistreams-app.git
   cd kigalistreams-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your Firebase project credentials:
   ```bash
   cp .env.example .env
   ```
   Provide the following variables:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📱 Mobile Build (Android)

To synchronize and open the Android Capacitor project:

```bash
npm run build
npx cap sync android
npx cap open android
```

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
