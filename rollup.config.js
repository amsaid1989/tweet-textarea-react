import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";

export default defineConfig({
    input: "src/index.tsx",
    output: {
        dir: "dist",
        exports: "auto",
        sourcemap: true,
        format: "cjs",
        strict: true,
    },
    plugins: [typescript()],
    external: ["react", "react-dom"],
});
