import { graphql, useStaticQuery } from "gatsby"
import React from "react"
import { Helmet } from "react-helmet"

type MetaItem = {
  content: string
  name: string
}

type SEOProps = {
  author?: string
  description?: string
  image?: string
  keywords?: string[]
  meta?: MetaItem[]
  title?: string
  url?: string
}

const SEO: React.FC<SEOProps> = (props) => {
  const data = useStaticQuery(graphql`
    {
      site {
        siteMetadata {
          title
          description
          author
          url
          keywords
          image
        }
      }
    }
  `)

  const { siteMetadata } = data.site

  const { author, description, image, keywords = [], meta = [], title, url } = siteMetadata
  const siteTitle = props.title || title
  const siteDescription = props.description || description
  const siteUrl = props.url || url
  const siteAuthor = props.author || author
  const siteImage = props.image || image
  const siteKeywords = [...keywords, props.keywords].join(",")
  const metaData = [
    {
      content: siteUrl,
      name: "canonical",
    },
    {
      content: siteDescription,
      name: "description",
    },
    {
      content: siteImage,
      name: "image",
    },
    {
      content: siteUrl,
      name: "og:url",
    },
    {
      content: "article",
      name: "og:type",
    },
    {
      content: siteTitle,
      name: "og:title",
    },
    {
      content: siteDescription,
      name: "og:description",
    },
    {
      content: siteImage,
      name: "og:image",
    },
    {
      content: "summary_large_image",
      name: "twitter:card",
    },
    {
      content: siteAuthor,
      name: "twitter:creator",
    },
    {
      content: siteTitle,
      name: "twitter:title",
    },
    {
      content: siteDescription,
      name: "twitter:description",
    },
    {
      content: siteImage,
      name: "twitter:image",
    },
    {
      content: siteKeywords,
      name: "keywords",
    },
  ].concat(meta)

  const linkData = [
    {
      href: "favicon-32x32.png",
      rel: "shortcut icon",
    },
  ]
  return (
    <Helmet
      htmlAttributes={{ lang: "en" }}
      link={linkData}
      // titleTemplate={`%s | ${siteTitle}`}
      meta={metaData}
      title={siteTitle}
    />
  )
}

export { SEO }
