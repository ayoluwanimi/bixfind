const tokens = require("./tokens.json");

const colors = {};
Object.entries(tokens.color).forEach(([group, value]) => {
  if (group === "palettes") {
    Object.entries(value).forEach(([groupName, palettes]) => {
      palettes.forEach((palette) => {
        palette.colors.forEach((hex, i) => {
          colors[groupName + "-" + i] = hex;
        });
      });
    });
    return;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    Object.entries(value).forEach(([key, hex]) => {
      colors[group + "-" + key] = hex;
    });
  }
});

const spacing = {"0":0,"1":4,"2":8,"3":12,"4":16,"5":24,"6":32,"7":48,"8":64,"9":96,"10":128};

const borderRadius = {"sm":4,"md":8,"lg":12,"xl":16,"pill":9999};

const fontSize = {"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem","6xl":"3.75rem","7xl":"4.5rem"};

const fontFamily = {"display":"Clash Display","body":"Inter Variable","mono":"JetBrains Mono"};

/** @type {import("tailwindcss").Config} */
module.exports = {
  theme: {
    extend: {
      colors, spacing, borderRadius, fontSize, fontFamily,
    },
  },
};