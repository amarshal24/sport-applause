/**
 * Helpers for turning a transcript into a WebVTT caption track and back.
 */

const formatTimestamp = (seconds: number) => {
  const s = Math.max(0, seconds);
  const hh = Math.floor(s / 3600).toString().padStart(2, "0");
  const mm = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  const ms = Math.round((s % 1) * 1000).toString().padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
};

/** Break a transcript into short, readable caption lines. */
export const splitIntoCues = (text: string, maxWords = 8): string[] => {
  const sentences = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const cues: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(" ");
    for (let i = 0; i < words.length; i += maxWords) {
      const chunk = words.slice(i, i + maxWords).join(" ").trim();
      if (chunk) cues.push(chunk);
    }
  }
  return cues;
};

/**
 * Build a WebVTT track from a transcript, spreading cues evenly across the
 * clip duration and weighting each cue by its length.
 */
export const buildVtt = (text: string, durationSeconds: number): string => {
  const cues = splitIntoCues(text);
  if (!cues.length || !durationSeconds || durationSeconds <= 0) return "";

  const totalChars = cues.reduce((sum, c) => sum + c.length, 0) || 1;
  let cursor = 0;

  const blocks = cues.map((cue, index) => {
    const share = (cue.length / totalChars) * durationSeconds;
    const start = cursor;
    const end = index === cues.length - 1 ? durationSeconds : Math.min(durationSeconds, start + share);
    cursor = end;
    return `${index + 1}\n${formatTimestamp(start)} --> ${formatTimestamp(end)}\n${cue}`;
  });

  return `WEBVTT\n\n${blocks.join("\n\n")}\n`;
};

/** Turn a VTT string into an object URL a <track> element can load. */
export const vttToObjectUrl = (vtt: string): string =>
  URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
