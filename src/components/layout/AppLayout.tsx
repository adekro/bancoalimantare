import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Sidebar from './Sidebar'

const DRAWER_WIDTH = 240

export default function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Ricava il titolo della pagina dalla rotta corrente
  const pageTitle: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/utenti': 'Utenti',
    '/distribuzione': 'Distribuzione',
    '/magazzino': 'Magazzino',
    '/stampe': 'Stampe',
  }
  const title = pageTitle[location.pathname] ?? 'Gestionale Solidale'

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev)
  void navigate // usato da Sidebar, qui solo per evitare warning

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar visibile solo su mobile */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{ zIndex: theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="apri menu"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              {title}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar — permanente desktop, temporanea mobile */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <Sidebar onClose={handleDrawerToggle} />
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
          open
        >
          <Sidebar />
        </Drawer>
      )}

      {/* Contenuto principale */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: isMobile ? 8 : 0,
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
