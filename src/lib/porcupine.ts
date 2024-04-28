import { Porcupine } from "@picovoice/porcupine-node";
import path from "path";
import { platform } from "os";
import { env } from "@/env";

const isMacos = platform() === "darwin";
const isRaspberryPi = platform() === "linux";

function getPorcupineModelPath() {
  if (isMacos) {
    return path.resolve("./assets/Hey-tee-one_en_mac_v3_0_0.ppn");
  }
  if (isRaspberryPi) {
    return path.resolve("./assets/Hey-tee-one_en_raspberry-pi_v3_0_0.ppn");
  }

  throw new Error(
    "Unsupported platform. Please run this on MacOS or Raspberry Pi, or download the Porcupine model for your platform."
  );
}

export const porcupine = new Porcupine(
  env.PICOVOICE_ACCESS_KEY,
  [getPorcupineModelPath()],
  [0.5]
);
