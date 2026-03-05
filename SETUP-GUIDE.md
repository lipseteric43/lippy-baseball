# Lippy Baseball — Setup Guide

Welcome back. Everything is packaged and ready. Follow these steps in order. Each step should take 2-5 minutes.

---

## What's in the Zip File

```
lippy-baseball-project/
├── api/claude.js         ← Keeps your API key secret on the server
├── src/App.jsx           ← The entire Lippy Baseball app
├── src/main.jsx          ← Entry point (don't touch)
├── index.html            ← HTML shell (don't touch)
├── package.json          ← Dependencies list
├── vite.config.js        ← Build config (don't touch)
├── vercel.json           ← Vercel routing config
├── .env.example          ← Shows what env variables you need
└── .gitignore            ← Tells Git what to skip
```

---

## Step 1: Install Node.js (one time only)

1. Go to **https://nodejs.org**
2. Click the big green **"LTS"** download button
3. Run the installer, click Next through everything
4. To verify it worked, open Terminal (Mac) or Command Prompt (Windows) and type:

```
node --version
```

You should see something like `v20.x.x`. If you do, you're good.

---

## Step 2: Get a Claude API Key

You need this for the AI-powered features (Chat, Predictions, Odds, Situational). The Scores and Player Stats tabs work without it.

1. Go to **https://console.anthropic.com**
2. Sign up or log in
3. Go to **Settings → API Keys**
4. Click **"Create Key"**
5. Copy the key (starts with `sk-ant-...`) — save it somewhere safe, you'll need it in Step 6

The API has a free tier. If you've never used it before, you get free credits to start.

---

## Step 3: Download and Unzip

1. Download the `lippy-baseball-project.zip` file from this chat
2. Unzip it wherever you want (Desktop is fine)
3. You should see a folder called `lippy-baseball-project`

---

## Step 4: Install Dependencies

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Navigate to the project folder. Type:

**Mac:**
```
cd ~/Desktop/lippy-baseball-project
```

**Windows:**
```
cd C:\Users\YourName\Desktop\lippy-baseball-project
```

(Adjust the path if you put it somewhere else)

3. Run:
```
npm install
```

Wait about 30 seconds. You'll see a progress bar. When it's done, you'll see a `node_modules` folder appear.

---

## Step 5: Test Locally (optional but recommended)

1. In the same terminal, run:

```
npm run dev
```

2. You'll see output like:

```
  VITE v5.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
```

3. Open that URL in your browser. You should see Lippy Baseball!

The Scores and Player Stats tabs will work immediately. The AI tabs won't work yet until you add your API key (next step) or deploy to Vercel.

To test AI features locally, create a file called `.env` in the project folder with:
```
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Then restart with `npm run dev`.

Press **Ctrl+C** in the terminal to stop the local server when done.

---

## Step 6: Create a GitHub Account & Repository

1. Go to **https://github.com** and sign up (free)
2. Once logged in, click the **"+"** in the top right → **"New repository"**
3. Name it: `lippy-baseball`
4. Keep it **Public** (Vercel free tier requires this) or Private (if you have Vercel Pro)
5. Do NOT check "Add a README" — leave everything else default
6. Click **"Create repository"**

You'll see a page with instructions. Keep this tab open.

---

## Step 7: Push Your Code to GitHub

Back in your terminal (make sure you're in the project folder):

```
git init
git add .
git commit -m "Lippy Baseball v1"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/lippy-baseball.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

If it asks for your password, you may need to create a Personal Access Token:
1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate one with "repo" permissions
3. Use that token as your password

---

## Step 8: Deploy on Vercel

1. Go to **https://vercel.com**
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub
4. Click **"Add New Project"**
5. You should see your `lippy-baseball` repo listed — click **"Import"**
6. On the configure page:
   - Framework Preset: should auto-detect **Vite**
   - Open **"Environment Variables"**
   - Add a new variable:
     - Name: `ANTHROPIC_API_KEY`
     - Value: `sk-ant-your-key-here` (the key from Step 2)
7. Click **"Deploy"**

Wait about 60 seconds. When it's done, Vercel gives you a URL like:

```
https://lippy-baseball.vercel.app
```

**That's your live website.** Open it and everything should work — all 6 tabs, AI chat, predictions, the works.

---

## Updating the Site Later

Whenever you want to make changes:

1. Edit files in the project folder
2. In terminal:
```
git add .
git commit -m "description of change"
git push
```
3. Vercel automatically redeploys within 30 seconds

---

## Troubleshooting

**"npm: command not found"**
→ Node.js didn't install properly. Restart your terminal and try again, or reinstall from nodejs.org.

**AI features return "Connection error"**
→ Your API key isn't set. Check Vercel dashboard → Settings → Environment Variables → make sure `ANTHROPIC_API_KEY` is there.

**Scores tab shows "No games"**
→ That date might not have games. Try navigating to a date during the MLB season (April-October).

**Page is blank**
→ Open browser dev tools (F12) → Console tab. Look for red errors and share them here.

**"git: command not found"**
→ Install Git: https://git-scm.com/downloads

---

## What Each Tab Needs

| Tab | Data Source | Needs API Key? |
|-----|-----------|---------------|
| 🧠 AI Chat | Claude API + web search | Yes |
| 🎯 Predictions | Claude API + web search | Yes |
| 📋 Scores & Box | MLB Stats API (free) | No |
| 📊 Player Stats | MLB Stats API (free) | No |
| 🔬 Situational | Claude API + web search | Yes |
| 💰 Odds & Lines | Claude API + web search | Yes |

---

## Costs

- **Node.js**: Free
- **GitHub**: Free
- **Vercel**: Free tier (100GB bandwidth/month, plenty for personal use)
- **Claude API**: Free credits to start, then ~$3 per 1M input tokens / $15 per 1M output tokens
  - A typical Predictions query costs about $0.01-0.03
  - Normal personal use should be well under $5/month
- **MLB Stats API**: Completely free, no key needed

---

You're all set. When you wake up, start at Step 1 and work through. The whole process should take about 20-30 minutes. Come back here if you get stuck on any step.
