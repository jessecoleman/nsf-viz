import { CssBaseline } from '@mui/material';
import {
  amber,
  blue,
  deepPurple,
  green,
  pink,
  red,
} from '@mui/material/colors';
import {
  Theme as MuiTheme,
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from '@mui/material/styles';

import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import * as d3 from 'd3';

export const interleave = <T extends unknown>(v: T, i: number, a: T[]) =>
  a[Math.trunc(i / 2) + (i % 2 ? a.length / 2 : 0)];

export const colorScales = {
  count: d3.scaleOrdinal(
    Object.values(deepPurple).slice(0, -4).map(interleave)
  ),
  amount: d3.scaleOrdinal(Object.values(green).slice(0, -4).map(interleave)),
};

export const hierColorScale = d3.scaleOrdinal(
  [deepPurple, green, blue, red, amber, pink].map((color) =>
    d3.scaleOrdinal(Object.values(color).slice(0, -4).map(interleave))
  )
);

declare module '@mui/material/styles/createPalette' {
  export interface PaletteOptions {
    amounts: PaletteColorOptions;
    counts: PaletteColorOptions;
  }
}

declare module '@mui/material/styles/createTheme' {
  export interface ThemeOptions {
    drawerWidth: string;
  }

  export interface Theme {
    drawerWidth: string;
  }
}

const theme = createTheme({
  drawerWidth: '35em',
  palette: {
    primary: {
      main: '#6772e5',
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
