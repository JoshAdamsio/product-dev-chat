document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('user-input');
  const log = document.getElementById('chat-log');
  const loading = document.getElementById('loading');
  const stopButton = document.getElementById('stop-button');
  const downloadButton = document.getElementById('download-button');

  let typingInterval = null;
  let stopTyping = false;
  let messageCount = 0;
  const messageHistory = [];

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
  });

  input.addEventListener('keydown', (e) => {
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
    loading.classList.remove('hidden');
    stopButton.classList.remove('opacity-40');
    stopButton.removeAttribute('disabled');
    stopTyping = false;
    messageCount++;

    const response = await fetch('https://product-dev-chat-production.up.railway.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, history: messageHistory })
    });

    const data = await response.json();
    loading.classList.add('hidden');
    stopButton.classList.add('opacity-40');
    stopButton.setAttribute('disabled', 'true');

    appendMessage('Navigator', data.reply);
    messageHistory.push({ role: 'assistant', content: data.reply });

    if (messageCount >= 1) {
      downloadButton.classList.remove('disabled-button');
      downloadButton.removeAttribute('disabled');
    }
  });

  stopButton.addEventListener('click', () => {
    stopTyping = true;
    stopButton.classList.add('opacity-40');
    stopButton.setAttribute('disabled', 'true');
    loading.classList.add('hidden');
  });

  function appendMessage(sender, text, isInstant = false) {
    const wrapper = document.createElement('div');
    const isUser = sender === 'You';
    wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'} w-full`;

    const bubble = document.createElement('div');
    bubble.className = `fade-in ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2 w-[95%] whitespace-pre-wrap shadow`;

    const nameSpan = document.createElement('strong');
    nameSpan.className = 'block text-sm font-semibold mb-1';
    nameSpan.textContent = sender;

    const textSpan = document.createElement('span');

    if (typingInterval) clearInterval(typingInterval);

    if (isInstant) {
      textSpan.textContent = text;
    } else {
      let index = 0;
      typingInterval = setInterval(() => {
        if (stopTyping || index >= text.length) {
          clearInterval(typingInterval);
          return;
        }
        textSpan.textContent += text[index];
        index++;
      }, 15);
    }

    bubble.appendChild(nameSpan);
    bubble.appendChild(textSpan);
    wrapper.appendChild(bubble);
    log.appendChild(wrapper);
    log.scrollTop = log.scrollHeight;
  }

  downloadButton.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'letter');

    let y = 50; // starting vertical position
    pdf.setFont('Helvetica');

    // Title
    pdf.setFontSize(20);
    pdf.text('Product Dev Chat', 50, y);
    y += 30;

    // Chat Messages
    pdf.setFontSize(12);
    const messages = document.querySelectorAll('#chat-log > div');
    messages.forEach(wrapper => {
      const name = wrapper.querySelector('strong')?.textContent || '';
      const content = wrapper.querySelector('span')?.textContent || '';

      if (y > 700) { // add new page if needed
        pdf.addPage();
        y = 50;
      }

      pdf.setFont(undefined, 'bold');
      pdf.text(name, 50, y);
      y += 16;

      pdf.setFont(undefined, 'normal');
      const lines = pdf.splitTextToSize(content, 500);
      pdf.text(lines, 60, y);
      y += lines.length * 14 + 10;
    });

    pdf.save('Product-Dev-Chat.pdf');
  });
});
