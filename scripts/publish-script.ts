import chalk from 'chalk';
import { execSync } from 'node:child_process';
import process from 'node:process';
import { updatePackage } from 'write-package';

function errorAndExit(err: Error): void {
  console.error(err);
  process.exit(1);
}

async function main() {
  const cwd = process.cwd();
  const version = process.env.TAG_VERSION?.replace('v', '') ?? '0.0.0';
  const gitHead = process.env.GIT_HEAD;
  if (!version) {
    errorAndExit(new Error('No version'));
  }

  console.log(chalk.cyan(`$new version: ${version}`));
  console.log(chalk.cyan(`$GIT_HEAD: ${gitHead}`));
  console.debug(chalk.yellow('Updating package.json'));

  const publishPackage = async () => {
    execSync('pnpm publish --access public --no-git-checks', { cwd, stdio: 'inherit' })
  };

  try {
    await updatePackage(cwd, { version })
    await publishPackage();
  } catch (error) {
    errorAndExit(error as Error);
  }

  console.log(chalk.green(`packages published successfully`));
}

main();
