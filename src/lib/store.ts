import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import * as path from "node:path";
import type { GenerationJob, ReviewStatus } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "jobs.json");
let writeChain = Promise.resolve();

/**
 * Serverless hosts give no writable disk, so history lives in memory there and
 * resets with the instance. Failing the write instead would make every
 * generation look broken on a hosted copy.
 */
let memoryJobs: GenerationJob[] | undefined;
const ephemeral = () => memoryJobs !== undefined;

async function readJobs(): Promise<GenerationJob[]> {
  if (ephemeral()) return memoryJobs as GenerationJob[];
  try {
    return JSON.parse(await readFile(DATA_FILE, "utf8")) as GenerationJob[];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    if (code === "EROFS" || code === "EACCES") {
      memoryJobs = [];
      return memoryJobs;
    }
    throw error;
  }
}

async function writeJobs(jobs: GenerationJob[]) {
  if (ephemeral()) {
    memoryJobs = jobs;
    return;
  }
  try {
    await mkdir(DATA_DIR, { recursive: true });
    const temporary = `${DATA_FILE}.tmp`;
    await writeFile(temporary, JSON.stringify(jobs, null, 2));
    await rename(temporary, DATA_FILE);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EROFS" && code !== "EACCES" && code !== "ENOENT") throw error;
    memoryJobs = jobs;
  }
}

export async function listJobs() {
  return (await readJobs()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getJob(id: string) {
  return (await readJobs()).find((job) => job.id === id);
}

export async function createJob(job: GenerationJob) {
  writeChain = writeChain.then(async () => {
    const jobs = await readJobs();
    jobs.push(job);
    await writeJobs(jobs);
  });
  await writeChain;
  return job;
}

export async function updateJob(id: string, updates: Partial<GenerationJob>) {
  let updated: GenerationJob | undefined;
  writeChain = writeChain.then(async () => {
    const jobs = await readJobs();
    const index = jobs.findIndex((job) => job.id === id);
    if (index < 0) return;
    jobs[index] = { ...jobs[index], ...updates, id: jobs[index].id };
    updated = jobs[index];
    await writeJobs(jobs);
  });
  await writeChain;
  return updated;
}

export async function reviewJob(id: string, reviewStatus: ReviewStatus) {
  return updateJob(id, { reviewStatus });
}
