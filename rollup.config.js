import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import command from "rollup-plugin-command";

export default defineConfig({
    input: "src/index.tsx",
    output: {
        dir: "dist",
        exports: "auto",
        sourcemap: true,
        format: "cjs",
        strict: true,
    },
    plugins: [typescript(), command("yalc publish --push")],
    external: ["react", "react-dom"],
});
