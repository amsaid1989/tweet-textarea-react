import { defineConfig } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import typescript from "@rollup/plugin-typescript";
import command from "rollup-plugin-command";
import dts from "rollup-plugin-dts";
import pkg from "./package.json";

export default defineConfig([
  {
    input: "src/index.ts",
    output: [
      {
        file: pkg.main,
        format: "cjs",
        exports: "auto",
        sourcemap: true,
        strict: true,
      },
      {
        file: pkg.module,
        format: "esm",
        exports: "auto",
        sourcemap: true,
        strict: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      postcss(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      command("yarn createPackage"),
    ],
    external: ["react"],
  },
  {
    input: "dist/esm/index.d.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
    external: [/\.css$/],
  },
]);
