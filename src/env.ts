import { z } from "zod";

const envVariables = z.object({
  ELEVENLABS_API_KEY: z.string().min(1),
  PICOVOICE_ACCESS_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
});

let hasParsed = false;

if (!hasParsed) {
  envVariables.parse(process.env);
  hasParsed = true;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}

export const env = process.env;
