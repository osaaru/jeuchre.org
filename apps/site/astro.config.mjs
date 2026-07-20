import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.jeuchre.org",
  integrations: [react()],
});
