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

declare module '@material-ui/core/styles/createPalette' {
  export interface PaletteOptions {
    amounts: PaletteColorOptions,
    counts: PaletteColorOptions,
  }
}

const theme = createTheme({
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