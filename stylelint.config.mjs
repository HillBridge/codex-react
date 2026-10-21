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
    // 断点只用两个：48rem（手机）、64rem（平板/小屏笔记本）。新增断点先改这里并同步文档。
    "media-feature-name-value-allowed-list": { "max-width": ["48rem", "64rem"] },
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
