import { z } from "zod";

const envVariables = z.object({
  ELEVENLABS_API_KEY: z.string().min(1),
  PICOVOICE_ACCESS_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  S3_ENDPOINT: z.string().url(),
  S3_URL: z.string().url(),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
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
