import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
const changelogPath = process.argv[3] ?? 'CHANGELOG.md';

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: node release-changelog.mjs <version> [changelog-path]');
  process.exit(1);
}

const content = readFileSync(changelogPath, 'utf8');

if (content.includes(`## [${version}]`)) {
  console.error(`Version ${version} already exists in CHANGELOG`);
  process.exit(1);
}

const unreleasedRegex = /^## \[Unreleased\]\s*\n([\s\S]*?)(?=^## \[)/m;
const match = content.match(unreleasedRegex);

if (!match) {
  console.error('Could not find ## [Unreleased] section');
  process.exit(1);
}

const unreleasedBody = match[1].trimEnd();
const contentLines = unreleasedBody
  .split('\n')
  .filter((line) => line.trim() && !/^#{1,3}\s/.test(line))
  .join('\n')
  .trim();

if (!contentLines) {
  console.error(
    '## [Unreleased] has no documented changes. Add entries before releasing.',
  );
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const newSection = `## [${version}] - ${date}\n\n${unreleasedBody}\n\n`;
const updated = content.replace(
  unreleasedRegex,
  `## [Unreleased]\n\n${newSection}`,
);

writeFileSync(changelogPath, updated);
process.stdout.write(unreleasedBody.trim());
