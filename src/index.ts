import { wakeWordResponses } from "@/lib/constants";
import { openai } from "@/lib/openai";
import { porcupine } from "@/lib/porcupine";
import { playSoundEffect } from "@/sounds";
import { transcribe } from "@/transcribe";
import { generateAudioAndPlay } from "@/tts";
import { PvRecorder } from "@picovoice/pvrecorder-node";
import { sample } from "lodash";

async function main() {
  while (true) {
    const recorder = new PvRecorder(porcupine.frameLength, -1);
    recorder.start();

    console.log(`Using device: ${recorder.getSelectedDevice()}...`);

    console.log(`Listening for wake word(s): Hey tee one`);
    console.log("Press ctrl+c to exit.");

    while (true) {
      const pcm = await recorder.read();
      let index = porcupine.process(pcm);
      if (index !== -1) {
      // if (true) {
        await playSoundEffect("transcription-started");
        await generateAudioAndPlay({
          text: sample(wakeWordResponses),
        });

        console.log("Transcribing");
        const text = await transcribe({
          onTranscriptionStarted: async () => {
            await playSoundEffect("transcription-started");
          },
        });
        console.log("Final", text);
        await playSoundEffect("transcription-ended");

        const result = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are the backend of a handheld device. The user would ask questions to you as a virtual assistant, and your job is to respond with an answer that answers their questions concisely.",
            },
            {
              role: "user",
              content: text,
            },
          ],
        });

        const response = result.choices.at(0)?.message.content;
        if (!response) {
          return await generateAudioAndPlay({
            text: "I'm sorry, I'm having trouble generating a response",
          });
        }

        await generateAudioAndPlay({
          text: response,
        });

        break;
      }
    }
  }
}

(async function () {
  try {
    main();
  } catch (e) {
    console.error(e);
  }
})();
