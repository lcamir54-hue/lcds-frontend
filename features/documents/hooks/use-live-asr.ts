"use client";

import * as React from "react";

const BAR_COUNT = 5;

export type LiveAsrStatus =
  | "idle"
  | "requesting"
  | "listening"
  | "unsupported"
  | "denied"
  | "error";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}

function joinTranscript(finals: string[], partial: string) {
  return [...finals.map((part) => part.trim()), partial.trim()]
    .filter(Boolean)
    .join(" ");
}

export function useLiveAsr(options: {
  lang?: string;
  onLiveText: (text: string) => void;
}) {
  const { lang = "fa-IR", onLiveText } = options;
  const [status, setStatus] = React.useState<LiveAsrStatus>("idle");
  const [partial, setPartial] = React.useState("");
  const [levels, setLevels] = React.useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 0.18),
  );
  const [error, setError] = React.useState<string | null>(null);

  const onLiveTextRef = React.useRef(onLiveText);
  React.useEffect(() => {
    onLiveTextRef.current = onLiveText;
  }, [onLiveText]);

  const wantedRef = React.useRef(false);
  const finalsRef = React.useRef<string[]>([]);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioRef = React.useRef<{
    context: AudioContext;
    source: MediaStreamAudioSourceNode;
    analyser: AnalyserNode;
    frame: number;
  } | null>(null);

  const stopAudio = React.useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      window.cancelAnimationFrame(audio.frame);
      audio.source.disconnect();
      void audio.context.close();
      audioRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLevels(Array.from({ length: BAR_COUNT }, () => 0.18));
  }, []);

  const stopRecognition = React.useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.abort();
    } catch {
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
    }
  }, []);

  const stop = React.useCallback(() => {
    wantedRef.current = false;
    stopRecognition();
    stopAudio();
    finalsRef.current = [];
    setPartial("");
    setStatus("idle");
  }, [stopAudio, stopRecognition]);

  const startAudio = React.useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    streamRef.current = stream;

    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 32;
    analyser.smoothingTimeConstant = 0.72;
    source.connect(analyser);

    const bins = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(bins);
      const next = Array.from({ length: BAR_COUNT }, (_, index) => {
        const sample = bins[index + 1] ?? 0;
        return Math.max(0.12, Math.min(1, sample / 180));
      });
      setLevels(next);
      const audio = audioRef.current;
      if (!audio) return;
      audio.frame = window.requestAnimationFrame(tick);
    };

    audioRef.current = { context, source, analyser, frame: 0 };
    audioRef.current.frame = window.requestAnimationFrame(tick);
  }, []);

  const startRecognition = React.useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return false;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      const nextFinals = [...finalsRef.current];
      let nextPartial = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result) continue;
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          nextFinals.push(transcript);
          nextPartial = "";
        } else {
          nextPartial += transcript;
        }
      }
      finalsRef.current = nextFinals;
      setPartial(nextPartial);
      onLiveTextRef.current(joinTranscript(nextFinals, nextPartial));
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      if (event.error === "not-allowed") {
        wantedRef.current = false;
        stopRecognition();
        stopAudio();
        setStatus("denied");
        setError("دسترسی به میکروفن داده نشد");
        return;
      }
      setError("شنیدن قطع شد");
      setStatus("error");
    };

    recognition.onend = () => {
      if (!wantedRef.current) return;
      try {
        recognition.start();
      } catch {
        /* Chrome throws if it is already running */
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, [lang, stopAudio, stopRecognition]);

  const start = React.useCallback(async () => {
    if (wantedRef.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setError("میکروفن در این مرورگر در دسترس نیست");
      return;
    }

    wantedRef.current = true;
    finalsRef.current = [];
    setPartial("");
    setError(null);
    setStatus("requesting");

    try {
      await startAudio();
      const hasAsr = startRecognition();
      if (!wantedRef.current) return;
      setStatus("listening");
      if (!hasAsr) {
        setError("رونویسی زنده در این مرورگر فعال نیست");
      }
    } catch (cause) {
      wantedRef.current = false;
      stopRecognition();
      stopAudio();
      const denied =
        cause instanceof DOMException &&
        (cause.name === "NotAllowedError" || cause.name === "PermissionDeniedError");
      setStatus(denied ? "denied" : "error");
      setError(denied ? "دسترسی به میکروفن داده نشد" : "میکروفن راه‌اندازی نشد");
    }
  }, [startAudio, startRecognition, stopAudio, stopRecognition]);

  const toggle = React.useCallback(() => {
    if (status === "listening" || status === "requesting") {
      stop();
      return;
    }
    void start();
  }, [start, status, stop]);

  React.useEffect(() => () => stop(), [stop]);

  return {
    status,
    partial,
    levels,
    error,
    listening: status === "listening" || status === "requesting",
    start,
    stop,
    toggle,
  };
}
