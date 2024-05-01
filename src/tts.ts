import { elevenlabs } from "@/lib/elevenlabs";
import { play, stream as playStream } from "elevenlabs";
import { createReadStream, createWriteStream, existsSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { PassThrough } from "stream";
import { voiceManager } from "@/index";

export const voiceId = "BLqAt1EJXEKGlw7i6QFf";

export async function generateAudioAndPlay({
  text,
  disableFromCache,
}: {
  text: string;
  disableFromCache?: boolean;
}) {
  const hash = createHash("sha256").update(text).digest("hex");
  const outputPath = join(
    __dirname,
    "../audio-cache",
    `${hash}-${voiceId}.wav`
  );

  if (existsSync(outputPath) && !disableFromCache) {
    return await play(createReadStream(outputPath));
  }

  const audio = await elevenlabs.generate({
    voice: voiceManager.getVoiceId(),
    text,
    model_id: "eleven_multilingual_v2",
    stream: true,
  });

  const audioClone1 = new PassThrough();
  const audioClone2 = new PassThrough();

  audio.pipe(audioClone1);
  audio.pipe(audioClone2);

  audioClone1.on("error", (error) =>
    console.error("Error in audioClone1:", error)
  );
  audioClone2.on("error", (error) =>
    console.error("Error in audioClone2:", error)
  );

  // Use one clone for playing and another for saving, and wait for both to complete
  const playPromise = playStream(audioClone1);
  const savePromise = new Promise((resolve, reject) => {
    const fileStream = createWriteStream(outputPath);
    audioClone2
      .pipe(fileStream)
      .on("finish", () => {
        console.log(`Audio has been saved to ${outputPath}`);
        resolve(void 0);
      })
      .on("error", reject);
  });

  await Promise.all([playPromise, savePromise]);
}
