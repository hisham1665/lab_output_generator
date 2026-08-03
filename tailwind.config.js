/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        ubuntu: ["Ubuntu Mono", "monospace"],
        jetbrains: ["JetBrains Mono", "monospace"],
        fira: ["Fira Code", "monospace"],
        cascadia: ["Cascadia Code", "monospace"],
      },
      colors: {
        // Theme palette extensions for glassmorphism and background gradients
        terminal: {
          ubuntu: {
            bg: "#300A24",
            text: "#DFDBCE",
          },
          dracula: {
            bg: "#282a36",
            text: "#f8f8f2",
          },
          kali: {
            bg: "#0d0d0d",
            text: "#c2c2c2",
          },
          catppuccin: {
            bg: "#24273a",
            text: "#cad3f5",
          },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
