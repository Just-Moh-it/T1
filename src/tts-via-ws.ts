import { VoiceManager } from "@/voice";
import { spawn } from "child_process";
import { CloseEvent, Event, MessageEvent, WebSocket } from "ws";

export async function streamAudio(
  textStream: AsyncGenerator<string, void, void>,
  voiceManager: VoiceManager
): Promise<void> {
  const model = "eleven_turbo_v2";
  const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceManager.getVoiceId()}/stream-input?model_id=${model}`;
  const socket = new WebSocket(wsUrl);

  // Spawn an mpv process to play the incoming audio stream
  const mpv = spawn("mpv", ["--no-cache", "--no-terminal", "--", "fd://0"], {
    stdio: ["pipe", "ignore", "ignore"],
  });

  return new Promise((resolve, reject) => {
    socket.onopen = async function () {
      // Send initial message if needed
      const bosMessage = {
        text: ".",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        },
        xi_api_key: process.env.ELEVENLABS_API_KEY,
      };
      socket.send(JSON.stringify(bosMessage));

      const sendText = async () => {
        const { value, done } = await textStream.next();
        console.log("Sending text:", value); // Debug log
        if (!done) {
          const textMessage = {
            text: value,
            try_trigger_generation: true,
          };
          socket.send(JSON.stringify(textMessage));
          sendText();
        } else {
          const eosMessage = {
            text: "",
          };
          socket.send(JSON.stringify(eosMessage));
        }
      };

      sendText();
    };

    socket.onmessage = function (event: MessageEvent) {
      const response = JSON.parse(event.data.toString());

      if (response.audio) {
        const audioChunk = Buffer.from(response.audio, "base64");
        console.log("Received audio chunk");
        mpv.stdin.write(audioChunk);
      } else {
        console.log("No audio data in the response");
      }

      if (response.isFinal) {
        console.log("Audio generation complete");
        mpv.stdin.end(); // Close the mpv input stream when the audio generation is complete
        socket.close();
      }
    };

    socket.onerror = function (error: Event) {
      console.error(`WebSocket Error: ${error}`);
      reject(error);
    };

    socket.onclose = function (event: CloseEvent) {
      if (event.wasClean) {
        console.info(
          `Connection closed cleanly, code=${event.code}, reason=${event.reason}`
        );
      } else {
        console.warn("Connection died");
      }
    };

    mpv.on("close", (code) => {
      console.log(`mpv process exited with code ${code}`);
      resolve(); // Resolve the promise when mpv process closes
    });

    mpv.on("error", (error) => {
      console.error(`mpv Error: ${error}`);
      reject(error);
    });
  });
}
