export default {
  colors: {
    accent: "#EF8A17",
    accent2: "#bd6d11",
    background: "#e9e4d9",
    dimGray: "#6D6A75",
    green1: "#034732",
    green2: "#008148",
    green3: "#BCD8C1",
    invertedText: "#d2c7bb",
    mutedText: "#6c5e52",
    red1: "#701d1e",
    red2: "#ba3431",
    red3: "#da3732",
    red4: "#de5954",
    text: "#362017",
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
