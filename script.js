const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const log = document.getElementById('chat-log');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

function appendMessage(sender, text) {
  const wrapper = document.createElement('div');
  const isUser = sender === 'You';

  wrapper.className = `
    flex ${isUser ? 'justify-end' : 'justify-start'} w-full
  `;

  const bubble = document.createElement('div');
  bubble.className = `
    ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}
    rounded-lg px-4 py-2 max-w-xs whitespace-pre-wrap
  `;
  bubble.innerHTML = `<strong class="block text-sm font-semibold mb-1">${sender}</strong>${text}`;

  wrapper.appendChild(bubble);
  log.appendChild(wrapper);
  log.scrollTop = log.scrollHeight;
}


  const response = await fetch('https://product-dev-chat-production.up.railway.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage })
  });

  const data = await response.json();
  appendMessage('Navigator', data.reply);
});

function appendMessage(sender, text) {
  const el = document.createElement('div');
  el.innerHTML = `<strong>${sender}:</strong> ${text}`;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}
