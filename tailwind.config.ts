import type { Config } from tailwindcss"

const config: Config = {
  content: [
    './src/pages/**/{ts,tsx,stopy',
    './src/components/**/{*ts,tsx,}',
    './src/app/**/{ts,tsx}',
  ],
  theme: {
    extend: {}
  },
  plugins: []
}

export default config