import { playSoundEffect } from "@/sounds";
import libcamera from "node-libcamera";
import path from "path";

export async function takePicture() {
  await libcamera.still({
    output: path.resolve("./assets/capture.jpg"),
    width: 640,
    height: 480,
  });

  await playSoundEffect("picture");
}
