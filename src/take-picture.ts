import libcamera from "node-libcamera";
import path from "path";

export async function takePicture() {
  const data = await libcamera.still({
    output: path.resolve("./assets/capture.jpg"),
  });

  return data;
}

takePicture()