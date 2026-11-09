/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        casio: {
          matte: "#18191c",
          casing: "#1e2024",
          casingBorder: "#2a2d34",
          innerPlate: "#141517",
          nav: "#3a4a5b",       // Blue-gray for navigation D-pad
          navHover: "#485b70",
          navActive: "#2f3d4c",
          btnDark: "#26282d",
          btnDarkText: "#f0f2f5",
          btnFn: "#363a42",
          btnFnText: "#e2e8f0",
          btnNum: "#3f444e",
          btnNumText: "#ffffff",
          btnDel: "#8c2424",
          btnAc: "#a32a2a",
          btnSolve: "#1e3a5f",
          btnSolveHover: "#284b77",
          shiftYellow: "#eab308",
          alphaRed: "#ef4444",
          lcdBg: "#99ab9c",
          lcdBgDark: "#87998a",
          lcdPixel: "#142017",
          lcdGhost: "rgba(20, 32, 23, 0.08)"
        }
      },
      fontFamily: {
        lcd: ['"Share Tech Mono"', 'monospace', 'Courier New'],
        casio: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'casio-case': '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        'casio-btn': '0 3px 0 #121316, 0 4px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
        'casio-btn-active': '0 1px 0 #121316, 0 1px 2px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.4)',
        'casio-lcd': 'inset 0 3px 6px rgba(0,0,0,0.45), inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.08)',
        'nav-dpad': '0 4px 0 #212c38, 0 6px 12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.25)',
      }
    },
  },
  plugins: [],
}
