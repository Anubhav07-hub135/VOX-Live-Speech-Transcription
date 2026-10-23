(() => {
  const $ = id => document.getElementById(id);
  const startButton = $("startButton"), stopButton = $("stopButton");
  const transcript = $("transcript"), wordCount = $("wordCount");
  const statusText = $("statusText"), statusDot = $("statusDot");
  const controlTitle = $("controlTitle"), controlDescription = $("controlDescription");
  const micEmblem = $("micEmblem"), emptyHint = $("emptyHint"), toast = $("toast");
  const language = $("language"), uploadForm = $("uploadForm"), audioFile = $("audioFile");
  const dropZone = $("dropZone"), selectedFile = $("selectedFile");
  const uploadButton = $("uploadButton"), uploadProgress = $("uploadProgress");
  const uploadStatus = $("uploadStatus");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null, listening = false, finalTranscript = "", toastTimer = null;

  function correctTranscript(text) {
    return text.replace(/\banubhav\s+(?:mohan|muhan|pohan)\b/gi, "Anubhav Puhan");
  }
  function notify(message) {
    toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  }
  function updateCount() {
    const text = transcript.value.trim(), count = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = `${count} ${count === 1 ? "word" : "words"}`;
    emptyHint.classList.toggle("hidden", transcript.value.length > 0);
  }
  function setStatus(message, active = false) {
    statusText.textContent = message; statusDot.classList.toggle("active", active);
  }
  function setListeningUI(active) {
    listening = active; startButton.hidden = active; stopButton.hidden = !active;
    micEmblem.classList.toggle("recording", active);
    controlTitle.textContent = active ? "Listening to your voice…" : (transcript.value.trim() ? "Transcription session ready" : "Ready when you are");
    controlDescription.textContent = active ? "Speak naturally. Your recognized words will appear below." : "Allow microphone access, then start speaking.";
  }
  function initRecognition() {
    if (!SpeechRecognition) { notify("Live speech recognition isn't supported. Try Chrome or Edge."); setStatus("Browser speech recognition not supported"); return false; }
    recognition = new SpeechRecognition();
    recognition.lang = language.value || "en-IN"; recognition.continuous = true;
    recognition.interimResults = true; recognition.maxAlternatives = 3;
    recognition.onstart = () => { setListeningUI(true); setStatus("Listening — speak now", true); notify("Microphone started. Speak clearly."); };
    recognition.onresult = event => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const phrase = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += phrase.trim() + " "; else interim += phrase;
      }
      transcript.value = correctTranscript(finalTranscript + interim).trimStart(); updateCount();
      setStatus(interim ? "Recognizing speech…" : "Speech recognized", true);
    };
    recognition.onerror = event => {
      let message = `Speech recognition error: ${event.error}`;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") message = "Microphone permission denied. Allow microphone access in browser settings.";
      else if (event.error === "no-speech") message = "No speech detected. Try speaking a little louder.";
      else if (event.error === "network") message = "Network error interrupted live recognition. Check your connection.";
      setStatus(message); notify(message);
    };
    recognition.onend = () => { setListeningUI(false); setStatus("Session stopped"); };
    return true;
  }
  startButton.addEventListener("click", () => {
    if (!SpeechRecognition) { notify("Open this site in Chrome or Edge for live transcription."); setStatus("Browser speech recognition not supported"); return; }
    finalTranscript = correctTranscript(transcript.value.trim());
    if (finalTranscript) finalTranscript += " ";
    if (!recognition || recognition.lang !== language.value) {
      if (recognition) { try { recognition.onend = null; recognition.stop(); } catch (_) {} }
      if (!initRecognition()) return;
    }
    try { recognition.start(); } catch (_) { notify("The microphone session is already starting. Please wait."); }
  });
  stopButton.addEventListener("click", () => {
    if (recognition && listening) recognition.stop();
    setListeningUI(false); setStatus("Session stopped"); notify("Live transcription stopped.");
  });
  language.addEventListener("change", () => {
    const wasListening = listening;
    if (recognition && listening) recognition.stop();
    recognition = null; setStatus(`Language set to ${language.options[language.selectedIndex].text}`);
    if (wasListening) notify("Language changed. Click Start speaking to begin again.");
  });
  transcript.addEventListener("input", () => { finalTranscript = transcript.value; updateCount(); });
  $("clearButton").addEventListener("click", () => {
    if (recognition && listening) recognition.stop();
    transcript.value = ""; finalTranscript = ""; updateCount(); setStatus("Transcript cleared"); notify("Transcript cleared.");
  });
  $("copyButton").addEventListener("click", async () => {
    const text = transcript.value.trim(); if (!text) return notify("There is no transcript to copy yet.");
    try { await navigator.clipboard.writeText(text); notify("Transcript copied to clipboard."); }
    catch (_) { transcript.select(); const ok = document.execCommand("copy"); notify(ok ? "Transcript copied." : "Select the text and copy manually."); }
  });
  $("exportButton").addEventListener("click", () => {
    const text = transcript.value.trim(); if (!text) return notify("Start speaking or upload a recording before exporting.");
    const blob = new Blob([text + "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = "vox-transcript.txt"; document.body.appendChild(link);
    link.click(); link.remove(); URL.revokeObjectURL(url); notify("Transcript exported as vox-transcript.txt.");
  });

  function showSelectedFile(file) {
    selectedFile.hidden = !file;
    selectedFile.textContent = file ? `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB` : "";
  }
  audioFile.addEventListener("change", () => showSelectedFile(audioFile.files[0]));
  ["dragenter", "dragover"].forEach(name => dropZone.addEventListener(name, event => {
    event.preventDefault(); dropZone.classList.add("dragover");
  }));
  ["dragleave", "drop"].forEach(name => dropZone.addEventListener(name, event => {
    event.preventDefault(); dropZone.classList.remove("dragover");
  }));
  dropZone.addEventListener("drop", event => {
    const file = event.dataTransfer.files[0]; if (!file) return;
    const transfer = new DataTransfer(); transfer.items.add(file); audioFile.files = transfer.files; showSelectedFile(file);
  });

  uploadForm.addEventListener("submit", async event => {
    event.preventDefault();
    const file = audioFile.files[0];
    if (!file) return notify("Choose an audio recording first.");
    if (file.size > 200 * 1024 * 1024) return notify("File exceeds 200 MB. Choose a smaller recording.");
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("language", $("uploadLanguage").value);
    formData.append("prompt", $("transcriptionHint").value.trim());
    uploadButton.disabled = true; uploadButton.textContent = "Transcribing…";
    uploadProgress.hidden = false; uploadStatus.textContent = "Transcribing locally. The first run may take longer while the model loads…";
    setStatus("Transcribing uploaded audio", true);
    try {
      const response = await fetch("/api/transcribe", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Transcription failed.");
      const newText = correctTranscript((data.text || "").trim());
      if (!newText) throw new Error("The API returned an empty transcript.");
      transcript.value = transcript.value.trim() ? `${transcript.value.trim()}\n\n${newText}` : newText;
      finalTranscript = transcript.value; updateCount();
      uploadStatus.textContent = `Transcription complete using ${data.model || "local Whisper"}.`;
      setStatus("Audio transcription complete"); notify("Uploaded audio transcribed successfully.");
    } catch (error) {
      uploadStatus.textContent = error.message; setStatus("Upload transcription failed"); notify(error.message);
    } finally {
      uploadButton.disabled = false; uploadButton.textContent = "Transcribe recording"; uploadProgress.hidden = true;
    }
  });
  updateCount();
})();
