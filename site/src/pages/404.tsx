import { Link } from "gatsby"
import React from "react"
import { Layout } from "../components/layout"
import { SEO } from "../components/seo"

// Prevents initial flash of the this page on initial render
const browser = typeof window !== "undefined" && window

const NotFoundPage: React.FC = () => {
  return browser ? (
    <Layout>
      <SEO title="404: Not found" />
      <h1>Oops! 404</h1>
      <h3>You just hit a route that doesn&#39;t exist.</h3>
      <Link to="/">Go Home</Link>
    </Layout>
  ) : null
}

export default NotFoundPage
