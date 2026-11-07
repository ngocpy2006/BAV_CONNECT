import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';

const titleRule =
  /^(feat|fix|docs|refactor|test|build|ci|chore|perf|style|revert)(\([a-z0-9/_-]+\))?!?: \S.{2,}$/i;
const sha = /^[a-f\d]{40}$/i;
const protectedFile =
  /(?:^|\/)(?:node_modules|\.next|dist|coverage|\.cache|\.turbo|\.vercel|\.nyc_output|build|out)\/|(?:^|\/)\.env(?:$|\.(?!example$))|\.(?:pem|key|pfx|p12|jks|tsbuildinfo|log)(?:$|\.)|(?:^|\/)(?:credentials\.json|secrets\.json|\.npmrc\.local|next-env\.d\.ts)$/i;
const secretPatterns = [
  /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\b(?:npm_|xox[baprs]-)[A-Za-z0-9-]{24,}\b/,
  /^[ \t]*(?:JWT_(?:ACCESS|REFRESH)_SECRET|POSTGRES_PASSWORD)[ \t]*=[ \t]*['"]?[^\s'"#$<{][^\s'"#]{7,}/m,
  /postgres(?:ql)?:\/\/[^\s:@/]+:[^\s<>@/]+@[^\s/]+\//i,
];

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
    .split('\0')
    .filter(Boolean);
}

function inspect(files) {
  const problems = [];
  for (const file of new Set(files)) {
    if (protectedFile.test(file)) {
      problems.push(`Generated or sensitive file: ${file}`);
      continue;
    }
    const stat = lstatSync(file, { throwIfNoEntry: false });
    if (!stat?.isFile()) continue;
    const contents = readFileSync(file);
    if (
      !contents.includes(0) &&
      secretPatterns.some((pattern) => pattern.test(contents.toString('utf8')))
    ) {
      problems.push(`Potential credential in ${file}`);
    }
  }
  return problems;
}

function check() {
  if (process.argv[2] === '--all') {
    return inspect(git(['ls-files', '-c', '-o', '--exclude-standard', '-z']));
  }
  const { PR_TITLE, PR_BASE, PR_HEAD } = process.env;
  if (!PR_BASE || !PR_HEAD || !sha.test(PR_BASE) || !sha.test(PR_HEAD)) {
    throw new Error('PR_BASE and PR_HEAD must contain commit SHAs. Use --all for a local scan.');
  }
  const problems = titleRule.test(PR_TITLE ?? '')
    ? []
    : ['Use a Conventional Commit PR title, for example "feat(api): add post search".'];
  const files = git([
    'diff',
    '--name-only',
    '--diff-filter=ACMRTUXB',
    '-z',
    `${PR_BASE}...${PR_HEAD}`,
  ]);
  return [...problems, ...inspect(files)];
}

const problems = check();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.info('Changed-file and credential checks passed.');
}
