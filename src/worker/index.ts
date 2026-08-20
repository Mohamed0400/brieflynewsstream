import { startEmbeddedScheduler } from "../lib/scheduler";

const timezone = process.env.APP_TIMEZONE || "Asia/Kuwait";
console.log(`Market News worker started (timezone ${timezone}).`);
console.log("Schedules are loaded from the console Schedule page.");
startEmbeddedScheduler("worker");
