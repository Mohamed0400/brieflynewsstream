import { prisma } from "../lib/prisma";
import { runPipeline } from "../lib/pipeline";

runPipeline({ forceCollect: true, forceEdition: true })
  .then((result) => console.log(JSON.stringify(result, null, 2)))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
