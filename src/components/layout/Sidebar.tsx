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
  Avatar,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import PrintIcon from '@mui/icons-material/Print'
import LogoutIcon from '@mui/icons-material/Logout'
import FoodBankIcon from '@mui/icons-material/FoodBank'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import AddIcon from '@mui/icons-material/Add'
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
        bgcolor: '#f7f8f7',
        color: 'text.primary',
      }}
    >
      {/* Logo / Titolo */}
      <Toolbar sx={{ px: 2 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            mr: 1,
          }}
        >
          <FoodBankIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
            Banco Alimentare
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 0.9 }}>
            GESTIONE RISORSE
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      {/* Voci di navigazione */}
      <List sx={{ px: 1.5, pt: 1.5, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => handleNav(item.path)}
              sx={{
                color: 'text.primary',
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(26, 110, 60, 0.12)',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                  '&:hover': { bgcolor: 'rgba(26, 110, 60, 0.16)' },
                },
                '&:hover': { bgcolor: 'rgba(26, 110, 60, 0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: 38 }}>
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

      

      <Divider />

      {/* Utente + Logout */}
      <Box sx={{ p: 2 }}>
     
    

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
            {(user?.email?.slice(0, 1) ?? 'A').toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} lineHeight={1.1}>
              {user?.email?.split('@')[0] ?? 'Admin User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Operatore
            </Typography>
          </Box>
        </Box>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleSignOut}
          sx={{
            color: 'text.primary',
            borderColor: 'divider',
            '&:hover': { borderColor: 'text.primary', bgcolor: 'rgba(0,0,0,0.03)' },
          }}
        >
          Esci
        </Button>
      </Box>
    </Box>
  )
}
