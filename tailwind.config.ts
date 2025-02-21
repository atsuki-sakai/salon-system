import animate from "tailwindcss-animate";
import type { Config } from "tailwindcss";
import type { PluginAPI } from 'tailwindcss/types/config';

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			wave: {
  				'0%, 100%': { transform: 'scaleY(1)' },
  				'50%': { transform: 'scaleY(2)' },
  			},
			
  		},
  		animation: {
  			'wave': 'wave 1.3s ease-in-out infinite',
  		},
  		animationDelay: {
  			'0': '0s',
  			'200': '0.2s',
  			'400': '0.4s',
  			'600': '0.6s',
  			'800': '0.8s',
  		},
  	}
  },
  plugins: [
    animate,
    function({ addUtilities }: PluginAPI) {
      const delays = {
        '.animation-delay-0': { 'animation-delay': '0s' },
        '.animation-delay-200': { 'animation-delay': '0.2s' },
        '.animation-delay-400': { 'animation-delay': '0.4s' },
        '.animation-delay-600': { 'animation-delay': '0.6s' },
        '.animation-delay-800': { 'animation-delay': '0.8s' },
      };
      addUtilities(delays);
    },
  ],
} satisfies Config;

export default config;
