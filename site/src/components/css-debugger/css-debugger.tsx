import { motion } from "framer-motion"
import React, { useEffect, useState } from "react"
import styled, { createGlobalStyle } from "styled-components"

const ToggleDebugButton = styled(motion.button).attrs(() => ({
  drag: true,
  dragMomentum: false,
  whileHover: { scale: 1.05 },
}))<{ debug?: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  border: 2px solid orange;
  background: orange;
  color: #333;
  z-index: 5000;
`

const getDebugStyles = ({ color, debug }: ComponentProps): string => {
  if (!debug) {
    return ""
  }
  return `
  background: rgba(211,211,211, 0.2) !important;
  outline-style: solid !important;
  outline-color: ${color} !important;
  outline-width: thin !important;

  `
}

const gridStyles = `
background-size: 10px 10px !important;
background-image: linear-gradient(to right, lightgray 1px, transparent 1px), linear-gradient(to bottom, lightgray 1px, transparent 1px) !important;
`

interface CSSDebuggerProps {
  buttonStyle?: React.CSSProperties
  color?: string
  debug?: boolean
  showGrid?: boolean
  showToggle?: boolean
}

const CSSDebugger: React.FC<CSSDebuggerProps> = ({
  buttonStyle,
  color = "rgba(255, 0, 0, .75)",
  debug = false,
  showGrid = true,
  showToggle,
}) => {
  const [isDebug, setIsDebug] = useState(debug)
  const GlobalStyle = createGlobalStyle<{
    debug: boolean
    showGrid?: boolean
    color?: string
  }>`
    html, * {
      ${(props) => getDebugStyles(props)};
    }

    html {
      ${(props) => props.debug && props.showGrid && gridStyles};
    }
  `

  useEffect(() => {
    setIsDebug(debug)
  }, [debug])

  const toggle = () => {
    setIsDebug((v) => !v)
  }

  if (typeof showToggle === "undefined" && typeof window !== "undefined") {
    // eslint-disable-next-line no-param-reassign
    showToggle = location.port === "8000"
  }
  console.log(showToggle)
  const maybeRenderToggleButton = showToggle && (
    <ToggleDebugButton debug={isDebug} onTap={toggle} style={buttonStyle}>
      Debug CSS
    </ToggleDebugButton>
  )

  return (
    <>
      <GlobalStyle color={color} debug={isDebug} showGrid={showGrid} />
      {maybeRenderToggleButton}
    </>
  )
}

export { CSSDebugger }
