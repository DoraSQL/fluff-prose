import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dir, "..");
const dataDir = path.join(rootDir, "data");
const publicDir = path.join(rootDir, "public");
const distDir = path.join(rootDir, "dist");
const generatedPath = path.join(rootDir, "src", "quotes.generated.ts");

async function copyDir(source, target) {
    await fs.mkdir(target, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            await copyDir(srcPath, targetPath);
        } else {
            await fs.copyFile(srcPath, targetPath);
        }
    }
}

async function buildQuotes() {
    const entries = await fs.readdir(dataDir);
    const files = entries.filter((file) => file.endsWith(".txt")).sort((a, b) => a.localeCompare(b));

    const quotes = [];
    for (const file of files) {
        const text = await fs.readFile(path.join(dataDir, file), "utf8");
        const quote = text.trim();
        if (quote.length > 0) {
            quotes.push(quote);
        }
    }

    const generated = `export const quotes = ${JSON.stringify(quotes, null, 4)} as const;\n`;
    await fs.writeFile(generatedPath, generated, "utf8");
}

async function main() {
    await buildQuotes();

    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir, { recursive: true });
    await copyDir(publicDir, distDir);

    const result = await Bun.build({
        entrypoints: [path.join(rootDir, "src", "main.ts")],
        outdir: distDir,
        target: "browser",
        minify: true
    });

    if (!result.success) {
        for (const message of result.logs) {
            console.error(message);
        }
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
