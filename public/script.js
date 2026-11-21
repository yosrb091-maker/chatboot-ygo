/* Toute l'interactivité de la page est en JavaScript simple. */
(() => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("message-input");
  const conversation = document.getElementById("conversation");
  const resetButton = document.getElementById("reset-chat");
  const sendButton = document.getElementById("send-button");
  const thinking = document.getElementById("thinking");
  const suggestions = document.querySelectorAll(".suggestion");
  if (!form || !input || !conversation || !resetButton || !sendButton || !thinking) return;

  const welcome = conversation.firstElementChild.cloneNode(true);
  const storageKey = "ygo-conversation";
  const prompts = {
    travel: "J’aimerais planifier un voyage.",
    ideas: "J’aimerais trouver de nouvelles idées. Peux-tu m’aider ?",
    destination: "J’aimerais découvrir une destination. Peux-tu m’aider à en choisir une ?",
    question: "J’aimerais te poser une question.",
  };
  let history = readHistory();
  let busy = false;
  let controller = null;
  let conversationVersion = 0;

  // Le texte de Gemini est échappé avant tout affichage, pour éviter l'injection HTML.
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
  }

  function inlineFormatting(text) {
    return escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  function tableCells(line) {
    return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
  }

  // Petit lecteur Markdown : titres, listes, code et tableaux de budget.
  function formatMessage(text) {
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let list = "";
    let code = false;
    let codeLines = [];
    const closeList = () => {
      if (list) html += `</${list}>`;
      list = "";
    };
    const divider = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (/^\s*```/.test(line)) {
        closeList();
        if (code) {
          html += `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`;
          codeLines = [];
        }
        code = !code;
        continue;
      }
      if (code) { codeLines.push(line); continue; }
      if (line.includes("|") && index + 1 < lines.length && divider.test(lines[index + 1])) {
        closeList();
        const headings = tableCells(line);
        html += `<div class="table-scroll"><table><thead><tr>${headings.map((cell) => `<th>${inlineFormatting(cell)}</th>`).join("")}</tr></thead><tbody>`;
        index += 2;
        while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
          const cells = tableCells(lines[index]);
          html += `<tr>${headings.map((_, cellIndex) => `<td>${inlineFormatting(cells[cellIndex] || "")}</td>`).join("")}</tr>`;
          index += 1;
        }
        html += "</tbody></table></div>";
        index -= 1;
        continue;
      }
      const heading = line.match(/^\s*#{1,6}\s+(.+)$/);
      if (heading) { closeList(); html += `<h3>${inlineFormatting(heading[1])}</h3>`; continue; }
      const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
      const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (unordered || ordered) {
        const nextList = unordered ? "ul" : "ol";
        if (list !== nextList) { closeList(); list = nextList; html += `<${list}>`; }
        html += `<li>${inlineFormatting((unordered || ordered)[1])}</li>`;
        continue;
      }
      closeList();
      if (line.trim()) html += `<p>${inlineFormatting(line)}</p>`;
    }
    closeList();
    if (code) html += `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`;
    return html;
  }

  function readHistory() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "[]");
      return Array.isArray(saved)
        ? saved.filter((item) => item && (item.role === "user" || item.role === "model") && typeof item.text === "string").slice(-40)
        : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      // L'historique reste dans cet onglet ; il n'est pas stocké sur le serveur YGO.
      sessionStorage.setItem(storageKey, JSON.stringify(history.slice(-40)));
    } catch {
      // Le chat reste utilisable si le navigateur bloque le stockage.
    }
  }

  function scrollToLatest() {
    conversation.scrollTop = conversation.scrollHeight;
  }

  function makeAvatar() {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    const image = document.createElement("img");
    image.src = "/assets/dove.png";
    image.alt = "";
    avatar.appendChild(image);
    return avatar;
  }

  function addMessage(role, text) {
    const row = document.createElement("div");
    row.className = `message message--${role === "user" ? "user" : "assistant"}`;
    if (role === "model") row.appendChild(makeAvatar());
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.dir = "auto";
    if (role === "model") bubble.innerHTML = formatMessage(text);
    else bubble.textContent = text;
    row.appendChild(bubble);
    conversation.appendChild(row);
    scrollToLatest();
  }

  function showError(message, originalText) {
    const row = document.createElement("div");
    row.className = "message message--assistant message--error";
    row.appendChild(makeAvatar());
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    const description = document.createElement("p");
    description.textContent = message;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "retry-button";
    retry.textContent = "Réessayer";
    retry.addEventListener("click", () => {
      if (busy) return;
      row.remove();
      sendMessage(originalText, false);
    });
    bubble.append(description, retry);
    row.appendChild(bubble);
    conversation.appendChild(row);
    scrollToLatest();
  }

  function setBusy(value) {
    busy = value;
    thinking.hidden = !value;
    sendButton.disabled = value;
    suggestions.forEach((button) => { button.disabled = value; });
    if (value) scrollToLatest();
  }

  async function sendMessage(text, showUser = true) {
    const message = text.trim();
    if (!message || busy) return;
    if (showUser) addMessage("user", message);
    setBusy(true);
    const version = conversationVersion;
    controller = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
        signal: controller.signal,
      });
      let data;
      try {
        data = await response.json();
      } catch {
        // Une page HTML ou une réponse réseau vide n'est pas une réponse Gemini.
        throw new Error(response.ok
          ? "Le serveur YGO a renvoyé une réponse illisible. Rechargez la page puis réessayez."
          : `Le serveur YGO est indisponible (erreur ${response.status}). Réessayez dans un instant.`);
      }
      if (typeof data?.error === "string" && data.error.trim()) throw new Error(data.error);
      if (!response.ok) throw new Error(`Le serveur YGO est indisponible (erreur ${response.status}). Réessayez dans un instant.`);
      if (typeof data?.reply !== "string" || !data.reply.trim()) {
        throw new Error("Le serveur YGO n'a pas renvoyé de message. Vérifiez le modèle Gemini configuré et réessayez.");
      }
      if (version !== conversationVersion) return;
      history.push({ role: "user", text: message }, { role: "model", text: data.reply });
      history = history.slice(-40);
      saveHistory();
      addMessage("model", data.reply);
    } catch (error) {
      if (version !== conversationVersion || error.name === "AbortError") return;
      const message = error instanceof TypeError
        ? "Impossible de se connecter au serveur. Vérifiez votre connexion et réessayez."
        : error.message || "Une erreur est survenue. Réessayez dans un instant.";
      showError(message, text);
    } finally {
      if (version === conversationVersion) {
        controller = null;
        setBusy(false);
      }
    }
  }

  // Une conversation réussie peut être reprise après actualisation de l'onglet.
  history.forEach((item) => addMessage(item.role, item.text));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || busy) return;
    input.value = "";
    input.style.height = "auto";
    sendMessage(message);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (!busy && input.value.trim()) form.requestSubmit();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 105)}px`;
  });

  suggestions.forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = prompts[button.dataset.prompt];
      if (prompt) sendMessage(prompt);
    });
  });

  resetButton.addEventListener("click", () => {
    conversationVersion += 1;
    if (controller) controller.abort();
    controller = null;
    history = [];
    try { sessionStorage.removeItem(storageKey); } catch { /* Stockage facultatif. */ }
    conversation.replaceChildren(welcome.cloneNode(true));
    input.value = "";
    input.style.height = "auto";
    setBusy(false);
    input.focus();
  });
})();
