import { env } from "@/env";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function uploadFile(data: Buffer) {
  const key = crypto.randomUUID() + ".png";

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: data,
  });

  await s3Client.send(command);

  const url = env.S3_URL + "/" + key;
  console.log(url);

  return url;
}
