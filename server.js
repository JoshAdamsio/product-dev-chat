const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  const message = req.body.message;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content:
          'You are the Product Dev Navigator, an expert advisor for inventors and engineers developing physical products. Offer detailed, practical advice.',
      },
      { role: 'user', content: message },
    ],
  });

  const reply = completion.choices[0].message.content;

  // Save to log
  fs.appendFileSync('chat-log.json', JSON.stringify({ message, reply, time: new Date().toISOString() }) + '\n');

  res.json({ reply });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
