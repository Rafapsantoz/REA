import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					hover: 'hsl(var(--primary-hover) / <alpha-value>)',
					active: 'hsl(var(--primary-active) / <alpha-value>)',
					foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
				},
				brand: {
					DEFAULT: 'hsl(var(--brand) / <alpha-value>)',
					foreground: 'hsl(var(--brand-foreground) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
					foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
					foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
					foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
				},
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background) / <alpha-value>)',
					foreground: 'hsl(var(--sidebar-foreground) / <alpha-value>)',
					primary: 'hsl(var(--sidebar-primary) / <alpha-value>)',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground) / <alpha-value>)',
					accent: 'hsl(var(--sidebar-accent) / <alpha-value>)',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground) / <alpha-value>)',
					border: 'hsl(var(--sidebar-border) / <alpha-value>)',
					ring: 'hsl(var(--sidebar-ring) / <alpha-value>)'
				},
				lane: {
					pending: {
						DEFAULT: 'hsl(var(--lane-pending) / <alpha-value>)',
						foreground: 'hsl(var(--lane-pending-foreground) / <alpha-value>)',
						soft: 'hsl(var(--lane-pending-soft) / <alpha-value>)'
					},
					progress: {
						DEFAULT: 'hsl(var(--lane-progress) / <alpha-value>)',
						foreground: 'hsl(var(--lane-progress-foreground) / <alpha-value>)',
						soft: 'hsl(var(--lane-progress-soft) / <alpha-value>)'
					},
					done: {
						DEFAULT: 'hsl(var(--lane-done) / <alpha-value>)',
						foreground: 'hsl(var(--lane-done-foreground) / <alpha-value>)',
						soft: 'hsl(var(--lane-done-soft) / <alpha-value>)'
					},
					overdue: {
						DEFAULT: 'hsl(var(--lane-overdue) / <alpha-value>)',
						foreground: 'hsl(var(--lane-overdue-foreground) / <alpha-value>)',
						soft: 'hsl(var(--lane-overdue-soft) / <alpha-value>)',
						emphasis: 'hsl(var(--lane-overdue-emphasis) / <alpha-value>)',
						'emphasis-foreground': 'hsl(var(--lane-overdue-emphasis-foreground) / <alpha-value>)'
					}
				},
				cat: {
					work: 'hsl(var(--cat-work) / <alpha-value>)',
					personal: 'hsl(var(--cat-personal) / <alpha-value>)',
					financial: 'hsl(var(--cat-financial) / <alpha-value>)',
					other: 'hsl(var(--cat-other) / <alpha-value>)'
				}
			},
			backgroundImage: {
				'gradient-brand': 'var(--gradient-brand)',
				'gradient-brand-soft': 'var(--gradient-brand-soft)'
			},
			boxShadow: {
				card: 'var(--shadow-card)',
				elevated: 'var(--shadow-elevated)',
				drag: 'var(--shadow-drag)'
			},
			transitionDuration: {
				fast: '120ms',
				base: '180ms',
				slow: '240ms'
			},
			transitionTimingFunction: {
				standard: 'cubic-bezier(0.2, 0, 0, 1)',
				emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)'
			},
			fontSize: {
				'2xs': ['11px', { lineHeight: '16px' }]
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
