import { Cheetah } from "@picovoice/cheetah-node";

const endpointDurationSec = 2.0;
export const cheetah = new Cheetah(process.env.PICOVOICE_ACCESS_KEY);
