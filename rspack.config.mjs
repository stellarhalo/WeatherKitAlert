import { defineConfig } from "@rspack/cli";

export default defineConfig({
    entry: {
        alert: "./src/index.js",
    },
    output: {
        chunkFormat: false,
        filename: "[name].bundle.js",
        library: {
            type: "module",
        },
    },
    plugins: [],
    devtool: false,
    performance: false,
});