export type VoiceOptions = "cassie" | "anrie" | "john";
// | 'eben'
export const voices = {
  cassie: {
    id: "1VjfYY7tw1ZdtdXW2zZ4",
    description:
      "Our engineering professor's voice. Her voice is very friendly and she sounds approachable.",
  },
  anrie: {
    id: "BLqAt1EJXEKGlw7i6QFf",
    description:
      "Our friend's voice. He has a coarse, but friendly, voice. Sounds like a typical homie",
  },
  john: {
    id: "7KEHJiMDnyh3LISIPiO3",
    description:
      "A professional narrator. His voice is something you'd use for a movie trailer, or for an assistant",
  },
  // eben: {id: "xBALmqzjfz9kjWOoMzmT", description: "Eben"}
} as const satisfies Record<VoiceOptions, { id: string; description: string }>;

export class VoiceManager {
  private voice: VoiceOptions;

  constructor(voice: VoiceOptions) {
    this.voice = voice;
  }

  public setVoice(voice: VoiceOptions) {
    this.voice = voice;
  }

  public vetVoice() {
    return this.voice;
  }

  public getVoiceId() {
    return voices[this.voice].id;
  }

  public getOptionsStringForLlm() {
    let returner = "";

    for (const [voice, {description}] of Object.entries(voices)) {
      returner += `Voice: ${voice}\nDescription: ${description}`;
      returner += "\n---\n";
    }
  }

  static isValidVoice(voice: string) {
    return Object.keys(voices).includes(voice);
  }
}
