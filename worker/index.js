/**
 * Command Center Chat Relay Worker
 * 
 * Proxies chat messages from the dashboard directly to Clawdbot's
 * OpenAI-compatible Chat Completions API. Supports streaming.
 * 
 * Environment Variables (secrets):
 * - CLAWDBOT_API_URL: e.g. http://217.216.67.51:8443
 * - CLAWDBOT_API_TOKEN: Gateway auth token
 * - CLAUDE_RESPONSE_KEY: Legacy key (kept for backward compat)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /chat - send message, get streaming response from Clawdbot
    if (request.method === 'POST' && (url.pathname === '/chat' || url.pathname === '/')) {
      try {
        const { message, history } = await request.json();
        
        if (!message) {
          return new Response(JSON.stringify({ error: 'No message provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Build messages array with history context
        const messages = [];
        
        // Add conversation history if provided
        if (history && Array.isArray(history)) {
          for (const msg of history.slice(-20)) { // Keep last 20 messages for context
            messages.push({
              role: msg.role,
              content: msg.content,
            });
          }
        }
        
        // Add the new user message
        messages.push({ role: 'user', content: message });

        const apiUrl = env.CLAWDBOT_API_URL || 'http://217.216.67.51:8443';
        const apiToken = env.CLAWDBOT_API_TOKEN;

        // Call Clawdbot with streaming
        const response = await fetch(`${apiUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            'x-clawdbot-agent-id': 'main',
          },
          body: JSON.stringify({
            model: 'clawdbot:main',
            stream: true,
            user: 'kam-dashboard',
            messages,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          return new Response(JSON.stringify({ error: `Clawdbot API error: ${response.status}`, details: errText }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Stream the SSE response back to the client
        return new Response(response.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST /chat/sync - non-streaming version (simpler, for fallback)
    if (request.method === 'POST' && url.pathname === '/chat/sync') {
      try {
        const { message, history } = await request.json();
        
        if (!message) {
          return new Response(JSON.stringify({ error: 'No message provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const messages = [];
        if (history && Array.isArray(history)) {
          for (const msg of history.slice(-20)) {
            messages.push({ role: msg.role, content: msg.content });
          }
        }
        messages.push({ role: 'user', content: message });

        const apiUrl = env.CLAWDBOT_API_URL || 'http://217.216.67.51:8443';
        const apiToken = env.CLAWDBOT_API_TOKEN;

        const response = await fetch(`${apiUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            'x-clawdbot-agent-id': 'main',
          },
          body: JSON.stringify({
            model: 'clawdbot:main',
            stream: false,
            user: 'kam-dashboard',
            messages,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          return new Response(JSON.stringify({ error: `API error: ${response.status}` }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'No response';

        return new Response(JSON.stringify({ reply }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // GET /health - simple health check
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', ts: Date.now() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- Legacy endpoints (kept for backward compat) ----

    // GET /messages - return empty (no more Supabase)
    if (request.method === 'GET' && url.pathname === '/messages') {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /respond - legacy, no-op
    if (request.method === 'POST' && url.pathname === '/respond') {
      return new Response(JSON.stringify({ success: true, note: 'Legacy endpoint - chat now uses /chat' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
};
