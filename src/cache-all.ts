import { wakeWordResponses } from "@/lib/constants";
import { generateAudioAndPlay } from "@/tts";

const allBuiltInPhrases = [...wakeWordResponses] as const satisfies string[];

(async () => {
  for (const phrase of allBuiltInPhrases) {
    await generateAudioAndPlay({ text: phrase });
    console.log(`Generated and played audio for phrase: ${phrase}`);
  }
})();
