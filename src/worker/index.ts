import { startEmbeddedScheduler } from "../lib/scheduler";
import { startBossWorker } from "./boss";

async function main() {
  if (process.env.WORKER_SCHEDULER === "node-cron") {
    const timezone = process.env.APP_TIMEZONE || "Asia/Kuwait";
    console.log(`Market News node-cron worker started (timezone ${timezone}).`);
    console.log("Schedules are loaded from the console Schedule page.");
    startEmbeddedScheduler("worker");
    return;
  }

  const worker = await startBossWorker();
  const onSignal = (signal: NodeJS.Signals) => {
    console.log(`Received ${signal}; stopping pg-boss worker.`);
    void worker.stop()
      .catch((error) => {
        console.error("Failed to stop pg-boss worker cleanly", error);
        process.exitCode = 1;
      })
      .finally(() => process.exit(process.exitCode || 0));
  };

  process.once("SIGTERM", onSignal);
  process.once("SIGINT", onSignal);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
