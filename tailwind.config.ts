import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        inherit: 'inherit',
        transparent: 'transparent',

        black: '#1c1b1b',
        'grey-darkest': '#222',
        'grey-darker': '#606f7b',
        'grey-dark': '#383735',
        'grey-mid': '#999999',
        grey: '#e0e0e0',
        'grey-light': '#dae1e7',
        'grey-lighter': '#f1f5f8',
        'grey-lightest': '#f2f2f2',
        white: '#ffffff',

        'orange-dark': '#f15a2c',
        orange: '#ff8c2f',

        red: '#E22828',
        yellow: '#F6E05E',
        green: '#009900',
        blue: '#9089f7',

        alpha: 'var(--color-alpha)',
        beta: 'var(--color-beta)',
        gamma: 'var(--color-gamma)',
      },
      // Unfortunately due to webGUI CSS setting base HTML font-size to .65% or something we must use pixel values for web components
      fontSize: {
        '10px': '10px',
        '12px': '12px',
        '14px': '14px',
        '16px': '16px',
        '18px': '18px',
        '20px': '20px',
        '24px': '24px',
        '30px': '30px',
      },
      spacing: {
        '-8px': '-8px',
        '2px': '2px',
        '4px': '4px',
        '6px': '6px',
        '8px': '8px',
        '12px': '12px',
        '16px': '16px',
        '20px': '20px',
        '24px': '24px',
        '28px': '28px',
        '32px': '32px',
        '36px': '36px',
        '40px': '40px',
        '64px': '64px',
        '80px': '80px',
        '90px': '90px',
        '150px': '150px',
        '160px': '160px',
        '200px': '200px',
        '260px': '260px',
        '310px': '310px',
        '350px': '350px',
        '448px': '448px',
        '512px': '512px',
        '640px': '640px',
        '800px': '800px',
      },
    }
  }
}
