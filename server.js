const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/api/chat', async (req, res) => {
  const message = req.body.message;

  const completion = await openai.createChatCompletion({
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

  const reply = completion.data.choices[0].message.content;

  // Save to log
  fs.appendFileSync('chat-log.json', JSON.stringify({ message, reply, time: new Date().toISOString() }) + '\n');

  res.json({ reply });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
