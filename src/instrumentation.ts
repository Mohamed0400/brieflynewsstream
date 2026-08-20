export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startEmbeddedScheduler } = await import("./lib/scheduler");
  startEmbeddedScheduler("next");
}
