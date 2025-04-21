const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const log = document.getElementById('chat-log');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('You', userMessage);
  input.value = '';

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
