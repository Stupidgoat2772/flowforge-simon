# Simon Dashboard

A personal productivity dashboard with Flowmodoro timer, daily reviews, self-soothing tracker, and ambient focus lighting.

## Quick Start

1. **Download** — click the green **Code** button → **Download ZIP**
2. **Extract** — unzip the folder anywhere on your computer
3. **Open** — double-click `index.html` — it opens in your browser, done

That's it. No server, no installation, no account needed.

## What's Inside

| Widget | What it does |
|--------|-------------|
| **Flowmodoro** | Focus timer — work as long as you want, break = work/3. Bell sounds when break ends. Auto-stops after 90m idle. |
| **Doing Doc** | Quick text note pad with word count. Write what you're working on. |
| **Distractions** | Log what pulled you away + how many minutes. Builds your avoid ratio. |
| **Self-Soothing** | Heart counter — click when you do something kind for yourself. Target adjusts based on your good days. |
| **Ratios** | Work:Avoid and Work:Bible ratios update live as you log. |
| **Review** | End-of-day reflection — what went well, what didn't, NS score, day rating. Filed reviews build your streak. |
| **Streaks** | Flow days, review days, total flow time, average time-on-task, time in Word. |

## How It Works

- **All data stays on your computer** — stored in your browser's localStorage. Nothing is sent anywhere.
- **Works offline** — no internet needed after download.
- **Works if you close the browser** — data persists until you clear browser data.
- **One file** — the entire dashboard is a single `index.html`. The mp3 files are for sounds (break bell, clock in/out).

## Tips

- **Start your day** → click **clock in** on the Flowmodoro card
- **During focus** → the screen dims and the timer glows — this is ambient focus mode
- **Take a break** → click **break** (or let idle detection warn you at 60m)
- **Log distractions** → click the distraction card, type what happened, log minutes
- **Self-soothe** → click the heart whenever you do something kind for yourself
- **End your day** → fill in the Review card, click **file review**
- **Your streak** builds automatically from filed reviews

## File Structure

```
simon-dashboard/
├── index.html      ← open this
├── storage.js      ← data layer (localStorage)
├── bell.mp3        ← break-end sound
├── punch-in.mp3    ← clock-in sound
└── punch-out.mp3   ← clock-out sound
```

## Browser Support

Works in any modern browser (Chrome, Firefox, Safari, Edge). localStorage must be enabled.

## Data Backup

Click the **export** button in the top-right corner of the dashboard. It downloads a zip file with all your data as human-readable markdown:

```
simon-dashboard-2026-09-18.zip
├── summary.md          — today's stats, streaks, all-time totals
├── daily/
│   ├── 2026-09-18.md   — flow, breaks, distractions, soothe, doing doc
│   ├── 2026-09-17.md
│   └── ...
├── reviews.md          — all filed reviews
├── sessions.md         — every flow/break session log
└── doings.md           — filed doing docs
```
