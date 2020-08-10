export default {
  colors: {
    cambridgeBlue: "#BCD8C1",
    dimGray: "#6D6A75",
    forestGreen: "#04471C",
    marigold: "#FF9F1C",
    spanishGreen: "#058C42",
    // text: "#FFFCE8",
    text: "#222",
  },
  fontSizes: {
    large: 20,
    small: 12,
  },
  opacity: {
    0: 0,
    25: 0.25,
    50: 0.5,
    75: 0.75,
    100: 1,
  },
  screens: {
    // max-widths in pixels
    lg: 1024,
    md: 768,
    sm: 640,
    xl: 1280,
  },
  spacing: {
    double: 8,
    single: 4,
  },
  py: (value: number | string) => `padding-top: ${value}; padding-bottom: ${value};`,
  // Add anything else you'd like.
}
