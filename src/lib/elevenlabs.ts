import { env } from "@/env";
import { ElevenLabsClient } from "elevenlabs";

export const elevenlabs = new ElevenLabsClient({
  apiKey: env.ELEVENLABS_API_KEY
})
