import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const circuitsDir = path.join(repoRoot, "circuits")
const datasetDistDir = path.join(repoRoot, "dataset-dist")

async function getSamples() {
  const sampleNames = (await readdir(circuitsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /^sample\d{3}$/.test(name))
    .sort()

  return Promise.all(
    sampleNames.map(async (sampleName) => {
      const sourceFile = `circuits/${sampleName}/${sampleName}.circuit.simple-route.json`
      const srj = JSON.parse(await readFile(path.join(repoRoot, sourceFile), "utf8"))

      return {
        sampleName,
        sourceFile,
        connectionCount: srj.connections?.length ?? 0,
        obstacleCount: srj.obstacles?.length ?? 0,
        bounds: srj.bounds,
      }
    }),
  )
}

await rm(datasetDistDir, { recursive: true, force: true })
await mkdir(datasetDistDir, { recursive: true })

const samples = await getSamples()

await writeFile(
  path.join(datasetDistDir, "manifest.json"),
  `${JSON.stringify(
    {
      datasetName: "dataset-srj16-bga-breakouts",
      sampleCount: samples.length,
      rule: "Every connection has exactly one endpoint on the centered BGA pad grid. IO fanout pads are placed on board edges.",
      samples,
    },
    null,
    2,
  )}\n`,
)
