const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const log = document.getElementById('chat-log');
const stopButton = document.getElementById('stop-button');
const downloadButton = document.getElementById('download-button');

let stopTyping = false;
let messageHistory = [];

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
});

input.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit'));
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('You', userMessage, true);
  messageHistory.push({ role: 'user', content: userMessage });

  input.value = '';
  input.style.height = 'auto';
  stopTyping = false;
  stopButton.disabled = false;
  stopButton.classList.remove('opacity-40');

  const thinkingBubble = appendMessage('Navigator', 'Product Coach is thinking...', true, true);

  const response = await fetch('https://product-dev-chat-production.up.railway.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage, history: messageHistory })
  });

  const data = await response.json();
  stopTyping = true;
  stopButton.disabled = true;
  stopButton.classList.add('opacity-40');

  // Replace bubble text
  if (thinkingBubble) log.removeChild(thinkingBubble);
  appendMessage('Navigator', data.reply, false);

  messageHistory.push({ role: 'assistant', content: data.reply });
  downloadButton.disabled = false;
  downloadButton.classList.remove('opacity-40');
});

stopButton.addEventListener('click', () => {
  stopTyping = true;
  stopButton.disabled = true;
  stopButton.classList.add('opacity-40');
});

function appendMessage(sender, text, instant = false, isThinking = false) {
  const wrapper = document.createElement('div');
  const isUser = sender === 'You';
  wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'} w-full`;

  const bubble = document.createElement('div');
  bubble.className = `${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2 w-[95%] whitespace-pre-wrap shadow`;

  const nameSpan = document.createElement('strong');
  nameSpan.className = 'block text-sm font-semibold mb-1';
  nameSpan.textContent = sender;

  const textContainer = document.createElement('div');

  if (isThinking) {
    textContainer.textContent = text;
    textContainer.classList.add('thinking');
  } else if (instant) {
    textContainer.textContent = text;
  } else {
    const lines = text.split('\n');
    let index = 0;
    const interval = setInterval(() => {
      if (stopTyping || index >= lines.length) {
        clearInterval(interval);
        return;
      }
      const line = document.createElement('div');
      line.textContent = lines[index];
      line.classList.add('fade-line');
      textContainer.appendChild(line);
      index++;
    }, 500);
  }

  bubble.appendChild(nameSpan);
  bubble.appendChild(textContainer);
  wrapper.appendChild(bubble);
  log.appendChild(wrapper);
  log.scrollTop = log.scrollHeight;

  return wrapper;
}
