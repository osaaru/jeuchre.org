export default {
  screens: {
    // max-widths in pixels
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  colors: {
    spanishGreen: "#058C42",
    forestGreen: "#04471C",
    cambridgeBlue: "#BCD8C1",
    marigold: "#FF9F1C",
    dimGray: "#6D6A75",
    text: "#FFFCE8",
  },
  opacity: {
    0: 0,
    25: 0.25,
    50: 0.5,
    75: 0.75,
    100: 1,
  },
  py: (value: number | string) => `padding-top: ${value}; padding-bottom: ${value};`,
  // Add anything else you'd like.
}
