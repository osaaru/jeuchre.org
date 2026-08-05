/**
 * Generates src/styles/tokens.css and tokens-dark.css from the DTCG manifests.
 * Run via `moon run site:tokens`. Never edit the generated files.
 */
import StyleDictionary from "style-dictionary";

const HEADER = `/* GENERATED from tokens/*.json — do not edit. Run \`moon run site:tokens\`. */\n`;

function cssValue(value) {
  return Array.isArray(value)
    ? value.map((v) => (v.includes(" ") ? `"${v}"` : v)).join(", ")
    : value;
}

function varName(token) {
  return `--${token.path.join("-")}`;
}

function makeFormat(wrap) {
  return ({ dictionary }) => {
    const lines = dictionary.allTokens.map(
      (t) => `  ${varName(t)}: ${cssValue(t.$value ?? t.value)};`,
    );
    return HEADER + wrap(lines.join("\n"));
  };
}

StyleDictionary.registerFormat({
  name: "css/jeuchre-root",
  format: makeFormat((body) => `:root {\n${body}\n}\n`),
});

StyleDictionary.registerFormat({
  name: "css/jeuchre-dark",
  format: makeFormat(
    (body) =>
      `@media (prefers-color-scheme: dark) {\n  :root {\n${body.replace(/^ {2}/gm, "    ")}\n  }\n}\n`,
  ),
});

for (const [source, destination, format] of [
  ["tokens/tokens.json", "tokens.css", "css/jeuchre-root"],
  ["tokens/tokens.dark.json", "tokens-dark.css", "css/jeuchre-dark"],
]) {
  const sd = new StyleDictionary({
    source: [source],
    platforms: {
      css: { buildPath: "src/styles/", files: [{ destination, format }] },
    },
  });
  await sd.buildAllPlatforms();
}
