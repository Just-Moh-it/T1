import { cheetah } from "@/lib/cheetah";
import { PvRecorder } from "@picovoice/pvrecorder-node";

export async function transcribe(args?: {
  onTranscriptionStarted?: () => Promise<unknown>;
}) {
  const recorder = new PvRecorder(cheetah.frameLength, -1);
  recorder.start();

  await args?.onTranscriptionStarted?.();
  let completeTranscript = "";
  while (true) {
    const pcm = await recorder.read();
    const [partialTranscript, isEndpoint] = cheetah.process(pcm);
    process.stdout.write(partialTranscript);
    completeTranscript += partialTranscript;

    if (isEndpoint) {
      const finalTranscript = cheetah.flush();
      process.stdout.write(finalTranscript + "\n");

      completeTranscript += finalTranscript;

      break;
    }
  }

  return completeTranscript;
}
