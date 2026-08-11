// Deterministic seeded roll for probabilistic faults. Pure function of
// (seed, trialIndex, tool, callIndex) — no wall-clock, no Math.random. See
// docs/04-grading-and-determinism.md "Fault-schedule determinism — fully solvable."

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

/** Returns a value in [0, 1), deterministic given the same inputs. */
export function seededRoll(seed: string, trialIndex: number, tool: string, callIndex: number): number {
  const key = `${seed}:${trialIndex}:${tool}:${callIndex}`;
  return djb2(key) / 0xffffffff;
}
