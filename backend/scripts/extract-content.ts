/**
 * One-shot content extractor: reads the frontend's static data modules and
 * writes them to backend/src/seeds/data/frontend-content.json for the seeder.
 *
 *   npm run extract:content
 *
 * The frontend modules import Lucide icon *components*, which can't be stored
 * in MongoDB, so `icon: Layout` is rewritten to `icon: "Layout"` before the
 * module is evaluated. Re-run this after editing frontend/src/data/*.ts.
 */
import fs from "fs";
import path from "path";
import ts from "typescript";

const DATA_DIR = path.join(__dirname, "..", "..", "frontend", "src", "data");
const OUT_FILE = path.join(
  __dirname,
  "..",
  "src",
  "seeds",
  "data",
  "frontend-content.json"
);

const FILES = [
  "site",
  "services",
  "testimonials",
  "team",
  "pricing",
  "faqs",
  "process",
  "stats",
];

/** Evaluates one data module with icon components replaced by their names. */
const loadModule = (name: string): Record<string, unknown> => {
  const filePath = path.join(DATA_DIR, `${name}.ts`);
  let source = fs.readFileSync(filePath, "utf8");

  // Collect the icon identifiers imported from lucide-react, then drop the import.
  const importMatch = source.match(
    /import\s*\{([^}]*)\}\s*from\s*["']lucide-react["'];?/
  );
  const iconNames = importMatch
    ? importMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/^type\s+/, ""))
        .filter((s) => s && s !== "LucideIcon")
    : [];

  source = source.replace(
    /import\s*\{[^}]*\}\s*from\s*["']lucide-react["'];?/g,
    ""
  );

  // `icon: Layout` → `icon: "Layout"`
  for (const icon of iconNames) {
    source = source.replace(
      new RegExp(`(icon:\\s*)${icon}\\b`, "g"),
      `$1"${icon}"`
    );
  }

  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const module = { exports: {} as Record<string, unknown> };
  // eslint-disable-next-line no-new-func
  new Function("exports", "module", "require", js)(
    module.exports,
    module,
    () => ({})
  );

  return module.exports;
};

const main = () => {
  const out: Record<string, unknown> = {};

  for (const name of FILES) {
    try {
      const exported = loadModule(name);
      for (const [key, value] of Object.entries(exported)) {
        if (typeof value !== "function") {
          out[key] = value;
        }
      }
      console.log(`  · ${name}.ts → ${Object.keys(exported).join(", ")}`);
    } catch (err) {
      console.error(`  ✖ ${name}.ts failed: ${(err as Error).message}`);
    }
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), "utf8");

  console.log(`\n✔ Wrote ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`  top-level keys: ${Object.keys(out).join(", ")}\n`);
};

main();
