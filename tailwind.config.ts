import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/streamdown/dist/*.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
