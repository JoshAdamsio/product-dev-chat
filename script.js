document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const log = document.getElementById("chat-log");
  const downloadButton = document.getElementById("download-button");

  let thinkingBubble = null;
  let messageCount = 0;
  const messageHistory = [];

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage) return;

    appendMessage("You", userMessage, true);
    messageHistory.push({ role: "user", content: userMessage });

    input.value = "";
    input.style.height = "auto";
    messageCount++;

    showThinkingBubble();

    const response = await fetch("https://product-dev-chat-production.up.railway.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, history: messageHistory }),
    });

    const data = await response.json();
    removeThinkingBubble();
    appendMessage("Product Copilot", data.reply);
    messageHistory.push({ role: "assistant", content: data.reply });

    if (messageCount >= 1) {
      downloadButton.classList.remove("disabled-button");
      downloadButton.removeAttribute("disabled");
    }
  });

  function appendMessage(sender, text, isInstant = false) {
    const wrapper = document.createElement("div");
    const isUser = sender === "You";
    wrapper.className = `flex ${isUser ? "justify-end" : "justify-start"} w-full`;

    const bubble = document.createElement("div");
    bubble.className = `fade-in ${isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"} rounded-lg px-4 py-2 w-[95%] whitespace-pre-wrap shadow`;

    const nameSpan = document.createElement("strong");
    nameSpan.className = "block text-sm font-semibold mb-1";
    nameSpan.textContent = sender;

    const textSpan = document.createElement("span");
    textSpan.innerHTML = parseMarkdown(text);

    bubble.appendChild(nameSpan);
    bubble.appendChild(textSpan);
    wrapper.appendChild(bubble);
    log.appendChild(wrapper);
    log.scrollTop = log.scrollHeight;
  }

  function showThinkingBubble() {
    thinkingBubble = document.createElement("div");
    thinkingBubble.className = "flex justify-start w-full fade-in";

    const bubble = document.createElement("div");
    bubble.className = "bg-gray-100 text-gray-900 rounded-lg px-4 py-2 w-[95%] shadow flex flex-col items-start";

    const nameSpan = document.createElement("strong");
    nameSpan.className = "block text-sm font-semibold mb-1";
    nameSpan.textContent = "Product Copilot";

    const thinkingText = document.createElement("span");
    thinkingText.className = "text-gray-500 text-base";
    thinkingText.textContent = "Product Copilot is thinking...";

    const progressBar = document.createElement("div");
    progressBar.className = "mt-2 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden relative";
    const progress = document.createElement("div");
    progress.className = "absolute bg-blue-400 h-2.5 animate-progress";
    progress.style.width = "40%";

    progressBar.appendChild(progress);
    bubble.appendChild(nameSpan);
    bubble.appendChild(thinkingText);
    bubble.appendChild(progressBar);
    thinkingBubble.appendChild(bubble);
    log.appendChild(thinkingBubble);
    log.scrollTop = log.scrollHeight;
  }

  function removeThinkingBubble() {
    if (thinkingBubble) {
      thinkingBubble.remove();
      thinkingBubble = null;
    }
  }

  function parseMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/^# (.*$)/gim, "<h3 class='text-lg font-bold mb-2'>$1</h3>")
      .replace(/^- (.*$)/gim, "<li class='list-disc ml-5'>$1</li>")
      .replace(/\n/g, "<br>")
      .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' class='text-blue-500 underline' target='_blank'>$1</a>");
  }

  downloadButton.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "letter");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 50;
    let y = 100;

    const now = new Date();
    const timestampForFile = `${now.getMonth() + 1}_${now.getDate()}_${now.getFullYear()}_${now.getHours()}${now.getMinutes()}`;
    const timestampForHeader = now.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    function setPageHeader(doc) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("Product Dev Chat", pageWidth / 2, 40, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text("Generated by the Product Copilot at JoshAdams.io", pageWidth / 2, 60, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Downloaded: ${timestampForHeader}`, pageWidth / 2, 75, { align: "center" });
    }

    function addPageNumber(doc) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageCount = doc.internal.getNumberOfPages();
      const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);

      // Footer brand line
      doc.text("JoshAdams.io Product Copilot Beta V0.1", pageWidth / 2, pageHeight - 30, { align: "center" });

      // Page number just below it
      doc.text(`Page ${pageCurrent} of ${pageCount}`, pageWidth / 2, pageHeight - 15, { align: "center" });

      doc.setTextColor(0, 0, 0); // Reset to black
    }

    setPageHeader(pdf);

    const messages = document.querySelectorAll("#chat-log > div");

    messages.forEach((wrapper) => {
      const name = wrapper.querySelector("strong")?.textContent || "";
      const rawContent = wrapper.querySelector("span")?.innerText || "";

      if (y > pageHeight - 120) {
        addPageNumber(pdf);
        pdf.addPage();
        setPageHeader(pdf);
        y = 100;
      }

      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(name, marginX, y);
      y += 18;

      pdf.setFont("Helvetica", "normal");
      pdf.setFontSize(11);

      const lines = pdf.splitTextToSize(rawContent, pageWidth - marginX * 2 - 10);
      lines.forEach((line) => {
        if (y > pageHeight - 80) {
          addPageNumber(pdf);
          pdf.addPage();
          setPageHeader(pdf);
          y = 100;
        }
        pdf.text(line, marginX + 10, y);
        y += 16;
      });

      y += 14;
    });

    addPageNumber(pdf);
    pdf.save(`Product-Dev-Chat_${timestampForFile}.pdf`);
  });

  // ✅ Show welcome message on load
  appendMessage("Product Copilot", `✨ **Welcome to the Product Copilot!**    
How may I help you? Here are few places to start:
- “Help me figure out if there's a market for my product”
- “What's a prototyping strategy that could help me validate my idea?”
- “What should I consider before building a physical product?”
*Please copy or download your chat via **Download PDF** before reloading or navigating away--Chats will not ne saved!`);
});
