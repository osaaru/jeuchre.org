import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// The /design specimen microsite exists only in dev (or with DESIGN=1 for
// visual-regression builds). Production builds never generate these routes.
const designMicrosite = {
  name: "design-microsite",
  hooks: {
    "astro:config:setup": ({ command, injectRoute }) => {
      if (command === "dev" || process.env.DESIGN) {
        for (const page of ["index", "colors", "typography", "spacing", "components"]) {
          injectRoute({
            pattern: page === "index" ? "/design" : `/design/${page}`,
            entrypoint: `./src/design/${page}.astro`,
          });
        }
      }
    },
  },
};

export default defineConfig({
  site: "https://www.jeuchre.org",
  integrations: [react(), designMicrosite],
  outDir: process.env.DESIGN ? "./dist-design" : "./dist",
  devToolbar: { enabled: false },
});
