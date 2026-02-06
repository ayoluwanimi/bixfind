import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#001A4D',
        secondary: '#FF1E75',
        accent: '#00D84F',
        cyan: '#00D9FF',
      },
    },
  },
  plugins: [],
}
export default config
