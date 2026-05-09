import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/hooks/useAuth'

const BG_IMAGE = 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1920&q=80'

export default function Landing() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && session) navigate('/dashboard', { replace: true })
  }, [session, loading, navigate])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        overflow: 'hidden',
        backgroundImage: `url('${BG_IMAGE}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(10,40,20,0.82) 0%, rgba(0,80,40,0.70) 100%)',
          zIndex: 0,
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Titolo */}
        <Typography
          variant="h3"
          sx={{
            color: '#fff',
            mb: 0.5,
            textShadow: '0 2px 16px rgba(0,0,0,0.4)',
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: -0.5,
          }}
        >
          Banco Alimentare
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255,255,255,0.75)',
            mb: 5,
            textShadow: '0 1px 8px rgba(0,0,0,0.3)',
            fontWeight: 400,
            textAlign: 'center',
          }}
        >
          Gestionale Solidale
        </Typography>

        {/* Card login */}
        <Card
          sx={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 4,
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <LoginForm onSuccess={() => navigate('/dashboard')} />
          </CardContent>
        </Card>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', mt: 4 }}>
          © {new Date().getFullYear()} — Per assistenza contattare l'amministratore
        </Typography>
      </Box>
    </Box>
  )
}

// ---------- Form Login ----------

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError('Email o password non corretti.')
    } else {
      onSuccess()
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>Accedi al gestionale</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        fullWidth
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        fullWidth
      />
      <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth sx={{ mt: 0.5, py: 1.5 }}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Entra'}
      </Button>
    </Box>
  )
}


