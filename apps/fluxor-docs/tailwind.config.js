import { createPreset } from 'fumadocs-ui/tailwind-plugin';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
    './mdx-components.{ts,tsx}',
    './node_modules/fumadocs-ui/dist/**/*.js',
    './components/ui/**/*.{ts,tsx}',
  ],
  presets: [createPreset({
          cssPrefix: "fuma-", 
  })],
    plugins: [require("tailwindcss-animate")],
    theme: {
    	extend: {
    		keyframes: {
    			'mixin-spin': {
    				'0%': { transform: 'rotate(0deg) scale(1)' },
    				'50%': { transform: 'rotate(180deg) scale(1.1)' },
    				'100%': { transform: 'rotate(360deg) scale(1)' },
    			},
    			'float-1': {
    				'0%, 100%': { transform: 'translate(0, 0)' },
    				'50%': { transform: 'translate(10px, -10px)' },
    			},
    			'float-2': {
    				'0%, 100%': { transform: 'translate(0, 0)' },
    				'50%': { transform: 'translate(-15px, 15px)' },
    			},
    			'float-3': {
    				'0%, 100%': { transform: 'translate(0, 0)' },
    				'50%': { transform: 'translate(15px, 10px)' },
    			},
    			'float-4': {
    				'0%, 100%': { transform: 'translate(0, 0)' },
    				'50%': { transform: 'translate(-10px, -15px)' },
    			},
    			'float-5': {
    				'0%, 100%': { transform: 'translate(0, 0)' },
    				'50%': { transform: 'translate(20px, 20px)' },
    			},
    			'float-6': {
    				'0%, 100%': { transform: 'translate(0, 0)' },
    				'50%': { transform: 'translate(-20px, 10px)' },
    			},
    			'float-7': {
    				'0%, 100%': { transform: 'translate(0, 0)' },
    				'50%': { transform: 'translate(15px, -20px)' },
    			},
    			'float-8': {
    				'0%, 100%': { transform: 'translate(0, 0)' },
    				'50%': { transform: 'translate(-25px, -15px)' },
    			},
    		},
    		animation: {
    			'mixin-spin': 'mixin-spin 3s ease-in-out infinite',
    			'float-1': 'float-1 6s ease-in-out infinite',
    			'float-2': 'float-2 8s ease-in-out infinite',
    			'float-3': 'float-3 7s ease-in-out infinite',
    			'float-4': 'float-4 9s ease-in-out infinite',
    			'float-5': 'float-5 10s ease-in-out infinite',
    			'float-6': 'float-6 11s ease-in-out infinite',
    			'float-7': 'float-7 12s ease-in-out infinite',
    			'float-8': 'float-8 13s ease-in-out infinite',
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
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
    		}
    	}
    }
};
