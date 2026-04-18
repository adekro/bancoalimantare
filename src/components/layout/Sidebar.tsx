import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Toolbar,
  Button,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import PrintIcon from '@mui/icons-material/Print'
import LogoutIcon from '@mui/icons-material/Logout'
import FoodBankIcon from '@mui/icons-material/FoodBank'
import { useAuth } from '@/hooks/useAuth'

interface SidebarProps {
  onClose?: () => void
}

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Utenti', icon: <PeopleIcon />, path: '/utenti' },
  { label: 'Distribuzione', icon: <LocalShippingIcon />, path: '/distribuzione' },
  { label: 'Magazzino', icon: <WarehouseIcon />, path: '/magazzino' },
  { label: 'Stampe', icon: <PrintIcon />, path: '/stampe' },
]

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()

  const handleNav = (path: string) => {
    navigate(path)
    onClose?.()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'primary.dark',
        color: '#fff',
      }}
    >
      {/* Logo / Titolo */}
      <Toolbar sx={{ px: 2 }}>
        <FoodBankIcon sx={{ mr: 1, fontSize: 32 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            Banco Alimentare
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Gestionale
          </Typography>
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

      {/* Voci di navigazione */}
      <List sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => handleNav(item.path)}
              sx={{
                color: '#fff',
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: isActive ? 700 : 400 }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

      {/* Utente + Logout */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mb: 1 }}>
          {user?.email ?? ''}
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleSignOut}
          sx={{
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.4)',
            '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          Esci
        </Button>
      </Box>
    </Box>
  )
}
