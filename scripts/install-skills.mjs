#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, readdir, mkdir, writeFile, rename, rm } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
const skills = join(project, "docs", "implementation-guides");
const cache = join(project, ".altioris-skill-cache");
const manifestPath = join(project, "docs", "licenses", "upstream-pins.json");
const argumentsList = process.argv.slice(2);
const cacheUpstream = argumentsList.length === 1 && argumentsList[0] === "--upstream";

if (argumentsList.length > 0 && !cacheUpstream) {
  console.error("Usage: node scripts/install-skills.mjs [--upstream]");
  process.exit(2);
}

async function validateLocalSkills() {
  const directories = await readdir(skills, { withFileTypes: true });
  const local = directories.filter((entry) => entry.isDirectory());
  if (local.length === 0) throw new Error("No repository skills found");
  for (const entry of local) {
    const contents = await readFile(join(skills, entry.name, "SKILL.md"), "utf8");
    const metadata = /^---\r?\n([\s\S]+?)\r?\n---\r?\n/u.exec(contents)?.[1];
    const name = metadata?.match(/^name: ([a-z0-9-]+)$/mu)?.[1];
    const description = metadata?.match(/^description: (\S.+)$/mu)?.[1];
    if (!name || name !== entry.name || !description) throw new Error(`Invalid frontmatter: ${entry.name}`);
    console.log(`Available at project scope: ${name}`);
  }
  console.log(`Verified ${local.length} current project guides in docs/implementation-guides`);
}

function copyrightSource(repository, source) {
  if (!/^[\w-]+\/[\w.-]+$/u.test(repository.repository) ||
      !/^[a-f0-9]{40}$/u.test(repository.revision) ||
      !/^[a-f0-9]{64}$/u.test(source.sha256) ||
      !Number.isInteger(source.bytes) || source.bytes < 1 || source.bytes > 200000) {
    throw new Error("Invalid cache source lock");
  }
  const segments = source.path.split("/");
  if (!segments.every((part) => /^[\w.-]+$/u.test(part) && part !== "." && part !== "..")) {
    throw new Error(`Invalid source path: ${source.path}`);
  }
  const encodedPath = segments.map(encodeURIComponent).join("/");
  const url = `https://raw.githubusercontent.com/${repository.repository}/${repository.revision}/${encodedPath}`;
  const destination = resolve(cache, repository.repository.replace("/", "__"), repository.revision, ...segments);
  if (!destination.startsWith(cache + sep)) throw new Error("Invalid cache destination");
  return { url, destination };
}

function matches(bytes, source) {
  return bytes.length === source.bytes && createHash("sha256").update(bytes).digest("hex") === source.sha256;
}

async function cacheSource(repository, source) {
  const { url, destination } = copyrightSource(repository, source);
  const existing = await readFile(destination).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (existing && matches(existing, source)) return;
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(20000) });
  if (!response.ok || !response.body) throw new Error(`${response.status} on ${url}`);
  const chunks = [];
  let received = 0;
  for await (const chunk of response.body) {
    received += chunk.byteLength;
    if (received > source.bytes) throw new Error(`Unexpected source size: ${url}`);
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  if (!matches(bytes, source)) throw new Error(`Digest mismatch: ${url}`);
  await mkdir(dirname(destination), { recursive: true });
  const temporary = destination + "." + process.pid + ".tmp";
  try {
    await writeFile(temporary, bytes, { flag: "wx", mode: 0o600 });
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
}

try {
  await validateLocalSkills();
  if (cacheUpstream) {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const repositories = manifest.repositories.filter((entry) => entry.disposition === "local-text-cache");
    let cached = 0;
    for (const repository of repositories) {
      if (repository.license !== "MIT" || !repository.licenseSource) {
        throw new Error(`Unapproved source license: ${repository.repository}`);
      }
      await cacheSource(repository, repository.licenseSource);
      await Promise.all(repository.sources.map((source) => cacheSource(repository, source)));
      cached += repository.sources.length;
    }
    console.log(`Verified ${cached} upstream Markdown files plus licenses in .altioris-skill-cache`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
