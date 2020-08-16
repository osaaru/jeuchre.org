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
  color: ${({ theme }) => theme.colors.marigold};
  display: inline;
  font-size: ${({ theme }) => theme.fontSizes.large}px;
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
                color: #fff;
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
