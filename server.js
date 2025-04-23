const express = require('express');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({
  origin: 'https://product-dev-chat.vercel.app'
}));
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

app.post('/api/chat', async (req, res) => {
  const message = req.body.message;

  try {
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // Polling until run completes
    let completedRun;
    while (true) {
      const check = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (check.status === 'completed') {
        completedRun = check;
        break;
      }
      if (check.status === 'failed') throw new Error('Run failed');
      await new Promise(r => setTimeout(r, 1000));
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantReply = messages.data.find(m => m.role === 'assistant')?.content[0]?.text?.value || '';

    // Save to Supabase
    await supabase.from('chat_logs').insert([
      {
        message: message,
        reply: assistantReply,
      }
    ]);

    res.json({ reply: assistantReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
