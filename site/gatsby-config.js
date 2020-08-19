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
    /*    {
      options: {
        // Setting this parameter is also optional
        // respectDNT: true,
        // Enables Google Optimize using your container Id
        // optimizeId: "YOUR_GOOGLE_OPTIMIZE_TRACKING_ID",
        // Enables Google Optimize Experiment ID
        // experimentId: "YOUR_GOOGLE_EXPERIMENT_ID",
        // Set Variation ID. 0 for original 1,2,3....
        // variationId: "YOUR_GOOGLE_OPTIMIZE_VARIATION_ID",
        // Defers execution of google analytics script after page load
        defer: false,
        // Defines where to place the tracking script - `true` in the head and `false` in the body
        head: true,
        // The property ID; the tracking code won't be generated without it
        trackingId: "UA-174557777-1",
      },
      resolve: "gatsby-plugin-google-analytics",
    },
    */
    /*
    {
      options: {
        bucketName: process.env.BUCKET_NAME || "jeuchre.org",
        bucketPrefix: process.env.BUCKET_PREFIX || "www",
        hostName,
        protocol,
      },
      resolve: "gatsby-plugin-s3",
    },
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
        exclude: [
          "/dev-404-page",
          "/404",
          "/404.html",
          "/offline-plugin-app-shell-fallback",

        ]
      },
      resolve: "gatsby-plugin-advanced-sitemap"
    },
    "gatsby-plugin-react-helmet",
    "gatsby-plugin-typescript",
    {
      options: {
        background_color: "#663399",
        description: siteDescription,
        display: "minimal-ui",
        icon: "src/images/gatsby-icon.png",
        name: siteTitle,
        short_name: siteTitle,
        start_url: "/",
        theme_color: "#663399",
      },
      resolve: "gatsby-plugin-manifest",
    },
    "gatsby-plugin-offline",
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
