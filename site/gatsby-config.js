/* eslint-env node */
/* eslint-disable @typescript-eslint/camelcase */

const path = require("path")
const CWD = process.cwd()

const hostName = process.env.APP_HOST_NAME || "www.jeuchre.org"
const protocol = "https"
const siteTitle = "Jeuchre"
const siteDescription = "Jeuchre is a card game that you can think of as the anti-Euchre."
const siteAuthor = "@osaaru"
const siteUrl = `${protocol}://${hostName}`
const siteImage = `${siteUrl}/icons/icon_512x512.png`
const siteKeywords = ["anti", "card", "euchre", "game", "jeuchre", "trick"]

module.exports = {
  plugins: [
    /*
    {
      options: {
        name: "images",
        path: path.join(CWD, "src/images"),
      },
      resolve: "gatsby-source-filesystem",
    },
    */
    {
      options: {
        siteUrl,
      },
      resolve: "gatsby-plugin-canonical-urls",
    },
    {
      options: {
        trackingId: "UA-174557777-1",
      },
      resolve: "gatsby-plugin-gtag",
    },
    {
      options: {
        // Options to pass to axe-core.
        // See: https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure
        axeOptions: {
          // Your axe-core options.
        },
        showInProduction: false,
      },
      resolve: "gatsby-plugin-react-axe",
    },
    "gatsby-plugin-styled-components",
    "gatsby-transformer-sharp",
    "gatsby-plugin-sharp",
    {
      options: {
        exclude: ["/dev-404-page", "/404", "/404.html", "/offline-plugin-app-shell-fallback"],
      },
      resolve: "gatsby-plugin-advanced-sitemap",
    },
    "gatsby-plugin-react-helmet",
    "gatsby-plugin-typescript",
    {
      options: {
        background_color: "#e9e4d9",
        categories: ["games"],
        description: siteDescription,
        display: "minimal-ui",
        icons: [
          {
            sizes: "32x32",
            src: "/favicons/jeuchre-j-32x32.png",
            type: "image/png"
          }
        ],
        lang: "en-US",
        name: siteTitle,
        short_name: siteTitle,
        start_url: "/",
        theme_color: "#034732",
      },
      resolve: "gatsby-plugin-manifest",
    },
    "gatsby-plugin-offline", // should be after manifest plugin to ensure manifest file is included in service worker
  ],
  siteMetadata: {
    author: siteAuthor,
    description: siteDescription,
    image: siteImage,
    keywords: siteKeywords,
    menuLinks: [
      { name: "Home", url: "/" },
      { name: "Rules", url: "/rules" },
    ],
    siteUrl,
    title: siteTitle,
  },
}
