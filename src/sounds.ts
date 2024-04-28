import { play } from "elevenlabs";
import { createReadStream } from "fs";
import { resolve } from "path";

const filePaths = {
  "transcription-ended": "jbl_cancel.mp3",
  "transcription-started": "jbl_begin_short.mp3",
  picture: "grab.mp3",
} as const satisfies Record<string, string>;

export async function playSoundEffect(soundEffect: keyof typeof filePaths) {
  const stream = createReadStream(resolve("./assets/", filePaths[soundEffect]));
  await play(stream);
}
