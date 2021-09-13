import * as d3 from 'd3';
import {
  Theme as EmotionTheme,
  ThemeProvider as EmotionThemeProvider
} from '@emotion/react';
import {
  createTheme,
  PaletteColorOptions,
  Theme as MuiTheme,
  ThemeProvider as MuiThemeProvider,
} from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import { deepPurple, green } from '@material-ui/core/colors';

type Color = PaletteColorOptions;

export const interleave = <T extends unknown>(v: T, i: number, a: T[]) => (
  a[Math.trunc(i / 2) + (i % 2 ? a.length / 2 : 0)]
);

export const colorScales = {
  count: d3.scaleOrdinal(Object.values(deepPurple).slice(0, -4).map(interleave)),
  amount: d3.scaleOrdinal(Object.values(green).slice(0, -4).map(interleave)),
};

declare module '@material-ui/core/styles/createPalette' {
  export interface PaletteOptions {
    amounts: PaletteColorOptions,
    counts: PaletteColorOptions,
  }
}
  
declare module '@material-ui/core/styles/createTheme' {
  export interface ThemeOptions {
    drawerWidth: string
  }
  
  export interface Theme {
    drawerWidth: string
  }
}

const theme = createTheme({
  drawerWidth: '35em',
  palette: {
    primary: {
      main: '#6772e5'
    },
    counts: {
      main: deepPurple[500],
    },
    amounts: {
      main: green[500],
    }, 
  },
});

const ThemeProvider = ({ children }: { children: JSX.Element }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <EmotionThemeProvider theme={theme}>        
        <CssBaseline />
        {children}
      </EmotionThemeProvider>
    </MuiThemeProvider>
  );
};

// Re-declare the emotion theme to have the properties of the MaterialUiTheme
declare module '@emotion/react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Theme extends MuiTheme {}
}

export default ThemeProvider;