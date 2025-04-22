const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const log = document.getElementById('chat-log');
const loading = document.getElementById('loading');

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

  appendMessage('You', userMessage);
  input.value = '';
  input.style.height = 'auto';
  loading.classList.remove('hidden');

  const response = await fetch('https://product-dev-chat-production.up.railway.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage })
  });

  const data = await response.json();
  loading.classList.add('hidden');
  appendMessage('Navigator', data.reply);
});

function appendMessage(sender, text) {
  const wrapper = document.createElement('div');
  const isUser = sender === 'You';
  wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'} w-full`;

  const bubble = document.createElement('div');
  bubble.className = `
    ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}
    rounded-lg px-4 py-2 w-[95%] whitespace-pre-wrap shadow
  `;

  const nameSpan = document.createElement('strong');
  nameSpan.className = 'block text-sm font-semibold mb-1';
  nameSpan.textContent = sender;

  const textSpan = document.createElement('span');
  let index = 0;

  const typingInterval = setInterval(() => {
    textSpan.textContent += text[index];
    index++;
    if (index >= text.length) clearInterval(typingInterval);
  }, 15);

  bubble.appendChild(nameSpan);
  bubble.appendChild(textSpan);
  wrapper.appendChild(bubble);
  log.appendChild(wrapper);
  log.scrollTop = log.scrollHeight;
}
