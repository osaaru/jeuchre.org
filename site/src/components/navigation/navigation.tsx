import React from "react"
import styled from "styled-components"

import { graphql, useStaticQuery } from "gatsby"
import { useTheme } from "../../styles"
import { Link } from "../link"

const Nav = styled.nav`
  padding: 0;
`

const Menu = styled.ul`
  flex: 1;
  display: flex;
  flex-direction: row;
  list-style: none;
  margin: 0;
`

const MenuItem = styled.li`
  display: inline;
  font-weight: bold;
  margin: 0;
  padding: 0.5rem;
  &:last-of-type {
    margin-right: 0;
  }
`

// const MenuLink = styled.Link`
//   color: #fff;
// `

const Navigation: React.FC = () => {
  const data = useStaticQuery(
    graphql`
      query SiteMetaData {
        site {
          siteMetadata {
            menuLinks {
              name
              url
            }
          }
        }
      }
    `,
  )
  const { menuLinks } = data.site.siteMetadata

  return (
    <Nav>
      <Menu>
        {menuLinks.map((link: { name: string; url: string }) => (
          <MenuItem key={link.name}>
            <Link
              css={`
                color: ${({ theme }) => theme.colors.background};
                font-family: "Times New Roman", Times, serif;
                font-size: ${({ theme }) => theme.fontSizes.large}pt;
              `}
              to={link.url}
            >
              {link.name}
            </Link>
          </MenuItem>
        ))}
      </Menu>
    </Nav>
  )
}

export { Navigation }
