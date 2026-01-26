# Command Center Chat Worker

Relays messages from the dashboard to Claude via Telegram.

## Setup

1. **Install Wrangler** (if not already):
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Deploy the worker**:
   ```bash
   cd worker
   wrangler deploy
   ```

3. **Set secrets** (one-time):
   ```bash
   # Get your bot token from @BotFather on Telegram
   wrangler secret put TELEGRAM_BOT_TOKEN
   
   # Your chat ID with the bot (Kam's is: 8169497922)
   wrangler secret put TELEGRAM_CHAT_ID
   ```

4. **Update the dashboard** if your worker URL is different:
   Edit `src/components/AIChatPanel.tsx` line 18:
   ```typescript
   const WORKER_URL = 'https://your-worker.your-account.workers.dev';
   ```

## How it works

1. You type a message in the dashboard chat
2. Dashboard POSTs to this worker
3. Worker sends message to Telegram bot
4. Claude receives it and updates the GitHub data
5. Dashboard auto-refreshes to show changes
