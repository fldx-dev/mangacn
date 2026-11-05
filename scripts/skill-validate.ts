/**
 * Validates skills/mangacn with the Agent Skills reference validator, `skills-ref`
 * (github.com/agentskills/agentskills, folder skills-ref), installed from its repository at a
 * pinned commit and run through `uvx`, so nothing Python lands in the repo.
 *
 * Usage: pnpm skill:validate   (needs uv: https://docs.astral.sh/uv/; CI installs it)
 */
import { spawnSync } from "node:child_process";
import { SKILL_DIR } from "../lib/docs/skill";

/** skills-ref 0.1.0 at agentskills/agentskills main, 2026-11-05. Bump on purpose. */
const SKILLS_REF =
  "git+https://github.com/agentskills/agentskills@83021e2be457a9b6679148719c1f6074f0ad975e#subdirectory=skills-ref";

const result = spawnSync("uvx", ["--from", SKILLS_REF, "skills-ref", "validate", SKILL_DIR], {
  stdio: "inherit",
  // skills-ref reads SKILL.md with Python's default encoding, which is not UTF-8 on Windows.
  env: { ...process.env, PYTHONUTF8: "1" },
});

if (result.error) {
  console.error(`✗ could not run uvx: ${result.error.message}`);
  console.error("  install uv (https://docs.astral.sh/uv/getting-started/installation/)");
  process.exit(1);
}
process.exit(result.status ?? 1);
