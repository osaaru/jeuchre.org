export default {
  colors: {
    accent: "#EF8A17",
    background: "#e9e4d9",
    cambridgeBlue: "#BCD8C1",
    dimGray: "#6D6A75",
    green1: "#034732",
    green2: "#008148",
    mutedText: "#444",
    red1: "#701d1e",
    red2: "#ba3431",
    red3: "#da3732",
    red4: "#de5954",
    text: "#403233",
  },
  fontSizes: {
    large: 22,
    medium: 16,
    small: 14,
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
