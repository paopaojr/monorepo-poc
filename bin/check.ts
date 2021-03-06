import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function run() {
  try {
    const output = await execAsync(
      "yarn dlx --quiet lerna ls --since origin/master --json --loglevel=silent"
    );
    const changedPackages = JSON.parse(
      output.stdout
        .split("\n")
        .filter((line) => !line.startsWith("::"))
        .join("\n")
    );

    let errors = [];

    for (const changed of changedPackages) {
      const { name, version } = changed;

      const output = await execAsync(`npm show ${name} version`);
      if (version.trim() === output.stdout.trim()) {
        errors.push(
          `Package ${name} code changed but version isn't bumped (local - ${version}, remote - ${output.stdout})`
        );
      }
    }

    if (errors.length) {
      console.error(errors.join("\n"));

      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
}

run();
