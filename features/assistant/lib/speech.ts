export function cancelSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function plainTextForSpeech(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]+\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^[>|]+\s?/gm, "")
    .replace(/[*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function persianVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("fa")) ??
    voices.find((voice) => voice.lang.toLowerCase().includes("fa"))
  );
}

export function speakPersian(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const clipped = text.length > 900 ? `${text.slice(0, 900)} …` : text;
  if (!clipped) return;

  cancelSpeech();
  const utterance = new SpeechSynthesisUtterance(clipped);
  utterance.lang = "fa-IR";
  utterance.rate = 1.02;
  const voice = persianVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}
