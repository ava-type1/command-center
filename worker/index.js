/**
 * Command Center Chat Relay Worker
 * 
 * Receives messages from the dashboard and forwards to Telegram
 * so Claude can receive and act on them.
 * 
 * Environment Variables (set in Cloudflare dashboard):
 * - TELEGRAM_BOT_TOKEN: Your bot token from @BotFather
 * - TELEGRAM_CHAT_ID: Your chat ID with the bot
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { message, source } = await request.json();
      
      if (!message) {
        return new Response(JSON.stringify({ error: 'No message provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Format message for Telegram
      const telegramMessage = `🖥️ *Command Center*\n\n${message}`;

      // Send to Telegram
      const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const telegramResponse = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: telegramMessage,
          parse_mode: 'Markdown',
        }),
      });

      if (!telegramResponse.ok) {
        const err = await telegramResponse.text();
        console.error('Telegram error:', err);
        throw new Error('Failed to send to Telegram');
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
