import { createTheme } from '@mui/material/styles'
import { itIT } from '@mui/material/locale'

const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#1a6e3c',   // verde solidale
        light: '#4caf50',
        dark: '#0d4a26',
        contrastText: '#fff',
      },
      secondary: {
        main: '#e65100',   // arancio caldo
        contrastText: '#fff',
      },
      background: {
        default: '#f3f5f4',
        paper: '#ffffff',
      },
      text: {
        primary: '#1f2a24',
        secondary: '#6b756f',
      },
    },
    typography: {
      // Font più grande per accessibilità utenti 70+
      fontSize: 15,
      fontFamily: '"Nunito Sans", "Segoe UI", sans-serif',
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      body1: { fontSize: '1rem' },
      body2: { fontSize: '0.9rem' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { size: 'large' },
        styleOverrides: {
          root: { borderRadius: 8, minHeight: 44 }, // target tattile ampio
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
          variant: 'outlined',
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 14,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#f3f5f4',
            backgroundImage:
              'radial-gradient(circle at 15% -10%, rgba(26, 110, 60, 0.07), transparent 35%), radial-gradient(circle at 85% 0%, rgba(230, 81, 0, 0.06), transparent 28%)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: { minHeight: 52, borderRadius: 8, marginBottom: 2 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { fontSize: '0.95rem' },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: { fontSize: '0.92rem' },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: '0.9rem' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
          input: {
            paddingTop: 9,
            paddingBottom: 9,
          },
          inputSizeSmall: {
            paddingTop: 8,
            paddingBottom: 8,
          },
        },
      },
    },
  },
  itIT, // localizzazione MUI in italiano
)

export default theme
