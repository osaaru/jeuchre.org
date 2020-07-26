module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:node/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:prettier/recommended",
    "plugin:jest/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
  ],
  ignorePatterns: [
    ".cache",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "tmp",
    ".storybook/generated-entry.js",
    "!.storybook",
    "!.prettierrc.js",
  ],
  overrides: [
    {
      // Stories and other files that are dev only / unpublished need some special rules
      files: [
        "**/*.stories.@(js|jsx|ts|tsx)",
        "**/*.stories.*.@(js|jsx|ts|tsx)",
        "site/.storybook/addons.js",
        "site/.storybook/config.js",
        ".storybook/main.js",
        ".storybook/preview.tsx",
        "babel.config.js",
        "site/__mocks__/gatsby.js",
        "gatsby-config.js",
        "jest.config.*",
        "webpack.config.js",
      ],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "node/no-unpublished-import": "off",
        "node/no-unpublished-require": "off",
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    // project: "./tsconfig.json",
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2019,
    sourceType: "module",
  },
  plugins: [],
  root: true,
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/member-delimiter-style": ["error", { multiline: { delimiter: "none" } }],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "consistent-this": "warn", // enforces consistent naming when capturing the current execution context (off by default)
    curly: ["warn", "multi-line", "consistent"],
    eqeqeq: "error",
    "eslint-comments/disable-enable-pair": "off",
    "guard-for-in": "error",
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "warn",
    "jest/no-identical-title": "warn",
    "jest/valid-expect": "warn",
    "jsx-a11y/no-autofocus": "off",
    "jsx-quotes": ["warn", "prefer-double"],
    "new-cap": ["error", { capIsNew: false, newIsCap: true }],
    "new-parens": "warn",
    "no-alert": "warn", // disallow the use of alert, confirm, and prompt
    "no-array-constructor": "warn", // disallow use of the Array constructor
    "no-caller": "warn", // disallow use of arguments.caller or arguments.callee
    "no-catch-shadow": "warn", // disallow the catch clause parameter name being the same as a variable in the outer scope (off by default in the node environment)
    "no-console": "warn",
    "no-debugger": "warn",
    "no-duplicate-imports": "error",
    "no-eval": "error", // disallow use of eval()
    "no-extend-native": "warn", // disallow adding to native types
    "no-extra-bind": "warn", // disallow unnecessary function binding
    "no-implied-eval": "warn", // disallow use of eval()-like methods
    "no-inner-declarations": "off", // disallow function or variable declarations in nested blocks
    "no-iterator": "warn", // disallow usage of __iterator__ property
    "no-label-var": "warn", // disallow labels that share a name with a variable
    "no-labels": "warn", // disallow use of labeled statements
    "no-lone-blocks": "warn", // disallow unnecessary nested blocks
    "no-loop-func": "off", // disallow creation of functions within loops
    "no-multi-str": "error", // disallow use of multiline strings
    "no-negated-in-lhs": "warn", // disallow negation of the left operand of an in expression
    "no-nested-ternary": "warn",
    "no-new": "warn", // disallow use of new operator when not part of the assignment or comparison
    "no-new-func": "error", // disallow use of new operator for Function object
    "no-new-object": "warn", // disallow use of the Object constructor
    "no-new-wrappers": "warn", // disallows creating new instances of String,Number, and Boolean
    "no-octal-escape": "warn", // disallow use of octal escape sequences in string literals, such as var foo = "Copyright \251";
    "no-param-reassign": "warn", // disallow Reassignment of Function Parameters
    "no-proto": "warn", // disallow usage of __proto__ property
    "no-return-assign": "warn", // disallow use of assignment in return statement
    "no-script-url": "warn", // disallow use of javascript: urls.
    "no-self-compare": "warn", // disallow comparisons where both sides are exactly the same (off by default)
    "no-sequences": "warn", // disallow use of comma operator
    "no-shadow": "warn", // disallow declaration of variables already declared in the outer scope
    "no-unneeded-ternary": "warn",
    "no-use-before-define": "off", // disallow use of variables before they are defined
    "no-useless-concat": "warn",
    "no-var": "warn",
    "no-void": "warn", // disallow use of void operator (off by default)
    "node/handle-callback-err": "error",
    "node/no-extraneous-import": "off", // This kinda sucks in our yarn workspace / hoisted node_modules setup
    "node/no-extraneous-require": "off", // This kinda sucks in our yarn workspace / hoisted node_modules setup
    "node/no-missing-import": "off", // Doesn't respect ts resolver https://github.com/mysticatea/eslint-plugin-node/issues/233
    "node/no-mixed-requires": "warn", // disallow mixing regular variable and require declarations (off by default) (on by default in the node environment)
    "node/no-new-require": "warn", // disallow use of new operator with the require function (off by default) (on by default in the node environment)
    "node/no-path-concat": "warn", // disallow string concatenation with __dirname and __filename (off by default) (on by default in the node environment)
    "node/no-unsupported-features/es-syntax": "off", // Doesn't make sense to let the version of node determine the level of ECMAScript we are using
    "one-var": ["warn", "never"],
    "prefer-const": "warn",
    "prefer-template": "warn",
    "prettier/prettier": "warn",
    quotes: ["error", "double", "avoid-escape"],
    radix: "error", // require use of the second argument for parseInt() (off by default)
    "react-hooks/exhaustive-deps": "error",
    "react-hooks/rules-of-hooks": "error",
    "react/jsx-curly-brace-presence": "warn",
    "react/jsx-no-comment-textnodes": "warn",
    "react/jsx-no-duplicate-props": "error",
    "react/jsx-no-undef": "error",
    "react/jsx-uses-react": "warn",
    "react/jsx-uses-vars": "warn",
    "react/no-array-index-key": "warn",
    "react/no-did-mount-set-state": "warn",
    "react/no-did-update-set-state": "warn",
    "react/no-redundant-should-component-update": "error",
    "react/no-string-refs": "warn",
    "react/no-unsafe": "error",
    "react/react-in-jsx-scope": "warn",
    "react/self-closing-comp": "warn",
    semi: ["warn", "never"],
    yoda: "warn",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
}
