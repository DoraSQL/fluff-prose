import path from "node:path";

const rootDir = path.resolve(import.meta.dir, "..");

const initial = Bun.spawn({
    cmd: ["bun", "run", "scripts/build.ts"],
    cwd: rootDir,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit"
});

const initialExit = await initial.exited;
if (initialExit !== 0) {
    process.exit(initialExit);
}

const build = Bun.spawn({
    cmd: ["bun", "--watch", "scripts/build.ts"],
    cwd: rootDir,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit"
});

const serve = Bun.spawn({
    cmd: ["bunx", "--bun", "live-server", "dist", "--port=4173", "--no-browser"],
    cwd: rootDir,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit"
});

const shutdown = () => {
    build.kill();
    serve.kill();
};

process.on("SIGINT", () => {
    shutdown();
    process.exit(0);
});

process.on("SIGTERM", () => {
    shutdown();
    process.exit(0);
});

const exitCode = await Promise.race([build.exited, serve.exited]);
shutdown();
process.exit(exitCode);
