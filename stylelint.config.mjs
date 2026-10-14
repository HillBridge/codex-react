export default {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-declaration-strict-value"],
  rules: {
    "declaration-no-important": true,
    "scale-unlimited/declaration-strict-value": [
      ["/color$/", "background", "border", "outline", "box-shadow"],
      {
        expandShorthand: true,
        ignoreFunctions: false,
        ignoreValues: [
          "transparent",
          "currentColor",
          "inherit",
          "none",
          "solid",
          "dashed",
          "dotted",
          "double",
          "0",
          "/^-?(?:\\d*\\.)?\\d+(?:px|rem|em|%)$/",
        ],
      },
    ],
    "media-feature-range-notation": "prefix",
    "selector-class-pattern": "^[a-z][a-zA-Z0-9]*$",
    "selector-max-specificity": "0,3,0",
    "value-keyword-case": ["lower", { camelCaseSvgKeywords: true }],
  },
  overrides: [
    {
      files: ["src/shared/ui/tokens.css"],
      rules: {
        "scale-unlimited/declaration-strict-value": null,
      },
    },
  ],
};
