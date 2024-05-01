import { wakeWordResponses } from "@/lib/constants";
import { porcupine } from "@/lib/porcupine";
import { functionCallOrTextStream } from "@/llm";
import { playSoundEffect } from "@/sounds";
import { uploadFile } from "@/storage";
import { takePicture } from "@/take-picture";
import { transcribe } from "@/transcribe";
import { generateAudioAndPlay } from "@/tts";
import { streamAudio } from "@/tts-via-ws";
import { VoiceManager } from "@/voice";
import { PvRecorder } from "@picovoice/pvrecorder-node";
import { readFileSync } from "fs";
import { sample } from "lodash";
import {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/index.mjs";
import path from "path";

const recorder = new PvRecorder(porcupine.frameLength, -1);
recorder.start();

console.log(`Using device: ${recorder.getSelectedDevice()}...`);

const initialMessages: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content:
      "You are an AI assistant integrated into a handheld form factor, tailored to help me with my daily life. You see exactly what I see. Provide concise, real-time assistance based on my questions regarding my vision or general questions. If my question is vague or refers to something unspecified, use the visual feed for context. Keep responses to at most two sentences for audio output, unless specified otherwise (this is because your audio is spoken after being generated and we only have a limited number of generation credits, so please don't yap). Focus on relevant information and avoid tasks beyond providing answers. Tailor responses to our unique handheld-device based interaction, making me feel like we're working together to enhance my daily life.",
  },
  {
    role: "system",
    content:
      "This is for later btw, but if a user asks, what are you or who are you, respond with something along the lines of: I'm t-1, the engineering-tweelve sixteen project from team O. I've been trained to recognize images of popular monuments and landmarks, and answer users' questions or any queries they might have. My image capapbilities make it possible for me to look around and extract an answer from my visual feed. To try me out, point at a monument or landmark and ask me questions about it.",
  },
];

let history: ChatCompletionMessageParam[] = [...initialMessages];
export const voiceManager = new VoiceManager("anrie");

async function main() {
  let loggedIsListening = false;

  while (true) {
    const pcm = await recorder.read();
    let index = porcupine.process(pcm);
    if (!loggedIsListening) {
      console.log(`Listening for wake word(s): Hey tee one`);
      loggedIsListening = true;
    }

    if (index !== -1) {
      const text = await getUserInputAndIndicateViaSounds();

      await sendToOpenaiAndProceed({ text });

      loggedIsListening = false;
    }
  }
}

async function sendToOpenaiAndProceed(params?: { text?: string }) {
  let isFunctionCall = false;

  const textGenerator = functionCallOrTextStream({
    messages: params?.text
      ? [...history, { role: "user", content: params.text }]
      : [...history],
    onGottenTypeOfResponse: async (role) => {
      if (role === "function_call") {
        isFunctionCall = true;
        // await generateAudioAndPlay({ text: "I'm on it!" });
      }
    },
    onFinishDueToStop: (newMessage) => {
      history.push(newMessage);
    },
  });

  const initialResult = await textGenerator.next();

  let functionCall: ChatCompletionMessageToolCall.Function | undefined =
    undefined;

  if (isFunctionCall) {
    functionCall =
      initialResult.value as ChatCompletionMessageToolCall.Function;

    switch (functionCall.name) {
      case "clearChat":
        history = [...initialMessages];
        await generateAudioAndPlay({
          text: "Ok, I've cleared the chat.",
          voiceId: voiceManager.getVoiceId(),
        });
        break;
      case "changeVoice":
        const args = JSON.parse(functionCall.arguments);

        const newVoice = (
          args?.voice as string | undefined
        )?.toLocaleLowerCase();
        if (newVoice && VoiceManager.isValidVoice(newVoice)) {
          voiceManager.setVoice(newVoice as any);
          await generateAudioAndPlay({
            text: `Hey, this is ${newVoice} now. How could I help you?`,
            voiceId: voiceManager.getVoiceId(),
          });
        } else {
          console.log(
            "Voice not provided by function call or incorrect voice",
            functionCall.arguments
          );
          await generateAudioAndPlay({
            text: "I'm sorry, I'm having trouble picking a voice",
            voiceId: voiceManager.getVoiceId(),
          });
        }
        break;
      case "takePicture":
        await generateAudioAndPlay({
          text: "I'm taking a picture now",
          voiceId: voiceManager.getVoiceId(),
        });

        await takePicture();

        const data = readFileSync(path.resolve("./assets/capture.jpg"));

        const url = await uploadFile(data);

        generateAudioAndPlay({
          text: "Just took a picture and uploaded",
          voiceId: voiceManager.getVoiceId(),
        });

        history.push({
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url,
              },
            },
          ],
        });
        console.log("Taking a picture");
        await sendToOpenaiAndProceed();
    }

    isFunctionCall = false;
  } else {
    await streamAudio(textGenerator as AsyncGenerator<string>, voiceManager);
  }
}

async function getUserInputAndIndicateViaSounds() {
  await generateAudioAndPlay({
    text: sample(wakeWordResponses),
    voiceId: voiceManager.getVoiceId(),
  });

  console.log("Transcribing");
  const text = await transcribe({
    onTranscriptionStarted: async () => {
      await playSoundEffect("transcription-started");
    },
  });
  await playSoundEffect("transcription-ended");

  return text;
}

(async function () {
  try {
    main();
  } catch (e) {
    console.error(e);
  }
})();
