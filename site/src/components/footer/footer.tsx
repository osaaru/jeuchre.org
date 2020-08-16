import React from "react"
import styled from "styled-components"
import { useTheme } from "../../styles"
import { GithubIcon } from "../github-icon"

const StyledFooter = styled.footer`
  color: ${({ theme }) => theme.colors.mutedText};
  font-size: ${({ theme }) => theme.fontSizes.small}pt;
  width: 100%;
`

const StyledSvg = styled.svg`
  position: absolute;
  bottom: 0;
`

const FooterContainer = styled.div`
  text-align: center;
  padding-bottom: 10px;
`

const Footer: React.FC = () => {
  return (
    <StyledFooter>
      <FooterContainer>Copyright © 2020 The Jeuchre Foundation</FooterContainer>
    </StyledFooter>
  )
}

export { Footer }
