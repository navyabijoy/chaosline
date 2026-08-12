import { aggregateBenchmarkReports } from "./aggregate-benchmark.ts";

export async function aggregateCommand(args: string[]) {
  let inputDir: string | undefined;
  let outputDir = ".chaosline/phase8-aggregated";

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "--input-dir" || arg === "-i") {
      inputDir = args[++i];
    } else if (arg === "--output-dir" || arg === "-o") {
      outputDir = args[++i];
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(2);
    }
    i++;
  }

  if (!inputDir) {
    console.error("--input-dir is required");
    process.exit(2);
  }

  try {
    await aggregateBenchmarkReports(inputDir, outputDir);
    console.log(`✓ Aggregation complete: ${outputDir}`);
  } catch (err) {
    console.error("Aggregation failed:", err instanceof Error ? err.message : String(err));
    process.exit(2);
  }
}
