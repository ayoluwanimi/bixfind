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

const spacing = {"0":"0px","1":"4px","2":"8px","3":"12px","4":"16px","5":"24px","6":"32px","7":"48px","8":"64px","9":"96px","10":"128px"};

const fontFamily = {"display":["\"Clash Display\"","sans-serif"],"body":["\"Inter Variable\"","sans-serif"],"mono":["\"JetBrains Mono\"","monospace"]};

const fontSize = {"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem","6xl":"3.75rem","7xl":"4.5rem"};

const borderRadius = {"sm":"4px","md":"8px","lg":"12px","xl":"16px","pill":"9999px"};

const boxShadow = {"sm":"0 1px 2px rgba(11,16,32,0.08)","md":"0 4px 12px rgba(11,16,32,0.10)","lg":"0 8px 30px rgba(11,16,32,0.12)","glowPink":"0 0 20px rgba(255,30,117,0.35), 0 0 40px rgba(255,30,117,0.18)"};

const transitionDuration = {"fast":"150ms","base":"240ms","slow":"420ms"};

const transitionTimingFunction = {"outQuart":"cubic-bezier(0.25,1,0.5,1)","spring":"cubic-bezier(0.34,1.56,0.64,1)"};

/** @type {import("tailwindcss").Config} */
module.exports = {
  theme: {
    extend: {
      colors, spacing, fontFamily, fontSize, borderRadius, boxShadow,
      transitionDuration, transitionTimingFunction,
      fontWeight: {"light":300,"regular":400,"medium":500,"semibold":600,"bold":700},
      lineHeight: {"tight":"1.15","snug":"1.3","normal":"1.5","relaxed":"1.65"},
    },
  },
  plugins: [],
};