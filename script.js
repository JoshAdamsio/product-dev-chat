import docx from 'https://cdn.jsdelivr.net/npm/docx@9.4.1/+esm';

console.log('Imported docx:', docx); // ✅ This should not be null in the browser console

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

  function getChatMessages() {
    return Array.from(document.querySelectorAll('#chat-log > div')).map(wrapper => {
      const name = wrapper.querySelector('strong')?.textContent || '';
      const content = wrapper.querySelector('span')?.textContent || '';
      return { name, content };
    });
  }

  downloadButton.addEventListener('click', async () => {
    console.log('Download button clicked'); // 🧪 Confirm button is working

    if (!docx || typeof docx.Document !== 'function') {
      alert('docx module not loaded properly.');
      console.error('docx is:', docx);
      return;
    }

    const { Document, Packer, Paragraph, TextRun } = docx;
    const messages = getChatMessages();
    const doc = new Document({
      sections: [{
        properties: {},
        children: messages.flatMap(msg => [
          new Paragraph({
            children: [new TextRun({ text: msg.name, bold: true })],
          }),
          new Paragraph(msg.content),
          new Paragraph('')
        ])
      }]
    });
    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Product-Dev-Chat.docx';
    link.click();
  });
});
