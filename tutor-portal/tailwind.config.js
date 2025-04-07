// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   darkMode: 'class',
//   theme: {
//     extend: {
//       colors: {
//         primary: {
//           DEFAULT: 'var(--primary-color)',
//           light: 'var(--primary-light)',
//           dark: 'var(--primary-dark)',
//         },
//         secondary: {
//           DEFAULT: 'var(--secondary-color)',
//           light: 'var(--secondary-light)',
//         },
//         accent: 'var(--accent-color)',
//         success: 'var(--success-color)',
//         error: 'var(--error-color)',
//         text: {
//           primary: 'var(--text-primary)',
//           secondary: 'var(--text-secondary)',
//           light: 'var(--text-light)',
//         },
//         bg: {
//           primary: 'var(--bg-primary)',
//           secondary: 'var(--bg-secondary)',
//           tertiary: 'var(--bg-tertiary)',
//         },
//       },
//       boxShadow: {
//         sm: 'var(--shadow-sm)',
//         md: 'var(--shadow-md)',
//         lg: 'var(--shadow-lg)',
//       },
//       borderRadius: {
//         DEFAULT: '0.5rem',
//       },
//       spacing: {
//         container: 'max(1rem, 5vw)',
//       },
//     },
//   },
//   plugins: [],
// }

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--primary-color) / <alpha-value>)',
        'primary-light': 'rgb(var(--primary-light) / <alpha-value>)',
        'primary-dark': 'rgb(var(--primary-dark) / <alpha-value>)',
        secondary: 'rgb(var(--secondary-color) / <alpha-value>)',
        'secondary-light': 'rgb(var(--secondary-light) / <alpha-value>)',
        accent: 'rgb(var(--accent-color) / <alpha-value>)',
        success: 'rgb(var(--success-color) / <alpha-value>)',
        error: 'rgb(var(--error-color) / <alpha-value>)',
      },
      backgroundColor: {
        primary: 'rgb(var(--bg-primary) / <alpha-value>)',
        secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
        tertiary: 'rgb(var(--bg-tertiary) / <alpha-value>)',
      },
      textColor: {
        primary: 'rgb(var(--text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
        light: 'rgb(var(--text-light) / <alpha-value>)',
      },
      borderColor: {
        primary: 'rgb(var(--bg-primary) / <alpha-value>)',
        secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
        tertiary: 'rgb(var(--bg-tertiary) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}