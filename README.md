# LiveStream Pro 24/7 - FFmpeg Streaming Worker

This backend service runs FFmpeg to continuously stream pre-recorded MP4 videos to **YouTube Live, Facebook Live, or Twitch** in a 24/7 loop.

---

### Option 1: Run 100% Free on Render.com (₹0 Cost - Recommended)
1. Go to [Render.com](https://render.com) and create a free account.
2. Click **New +** -> **Web Service**.
3. Upload this `streaming-worker` folder to a GitHub repository and link it, or select **Docker**.
4. Set Environment:
   - Environment: `Docker` (Render automatically uses the included `Dockerfile` which installs FFmpeg).
   - Port: `3001`
5. Click **Create Web Service**.
6. Render will give you a free live URL (e.g. `https://my-stream-worker.onrender.com`).
7. Paste this URL into your WordPress LiveStream Pro Settings panel!

---

### Option 2: Run Free on Your Local PC / Laptop
1. Make sure **Node.js** and **FFmpeg** are installed.
2. In this folder, run:
   ```bash
   npm install
   node server.js
   ```
3. Your local worker is now running on `http://localhost:3001`!

---

### Option 3: Run on Oracle Cloud (Always Free 24GB VPS)
1. In Oracle Cloud free tier, start an Ubuntu instance.
2. Run:
   ```bash
   sudo apt update && sudo apt install -y ffmpeg nodejs npm
   npm install
   nohup node server.js > stream.log 2>&1 &
   ```
3. It will run 24 hours a day, 365 days a year without stopping!
