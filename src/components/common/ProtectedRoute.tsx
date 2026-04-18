import { Navigate, Outlet } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return session ? <Outlet /> : <Navigate to="/" replace />
}
