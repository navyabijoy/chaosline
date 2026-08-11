import { runShim } from "@faultline/shim";

export function shimCommand(args: string[]): void {
  const sepIdx = args.indexOf("--");
  if (sepIdx === -1) {
    console.error("chaosline shim: expected `-- <command> [args...]`");
    process.exit(2);
  }
  const [cmd, ...cmdArgs] = args.slice(sepIdx + 1);
  if (!cmd) {
    console.error("chaosline shim: no child command given after `--`");
    process.exit(2);
  }
  runShim(cmd, cmdArgs);
}
