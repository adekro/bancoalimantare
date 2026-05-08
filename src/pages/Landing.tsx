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
  Tabs,
  Tab,
} from '@mui/material'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/hooks/useAuth'

const BG_IMAGE = 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1920&q=80'

export default function Landing() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    if (!loading && session) navigate('/dashboard', { replace: true })
  }, [session, loading, navigate])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
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
          fontWeight={800}
          textAlign="center"
          letterSpacing={-0.5}
          sx={{ color: '#fff', mb: 0.5, textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}
        >
          Banco Alimentare
        </Typography>
        <Typography
          variant="h6"
          fontWeight={400}
          textAlign="center"
          sx={{ color: 'rgba(255,255,255,0.75)', mb: 5, textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
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
            <Tabs
              value={mode}
              onChange={(_event, value: 'login' | 'register') => setMode(value)}
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab value="login" label="Accedi" />
              <Tab value="register" label="Registrati" />
            </Tabs>

            {mode === 'login' ? (
              <LoginForm onSuccess={() => navigate('/dashboard')} />
            ) : (
              <RegisterForm
                onSuccess={() => navigate('/dashboard')}
                onBackToLogin={() => setMode('login')}
              />
            )}
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
    <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
      <Typography variant="h6" fontWeight={700}>Accedi al gestionale</Typography>
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

function RegisterForm({
  onSuccess,
  onBackToLogin,
}: {
  onSuccess: () => void
  onBackToLogin: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.')
      return
    }

    if (password !== confirmPassword) {
      setError('Le password non coincidono.')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    if (data.session) {
      setLoading(false)
      onSuccess()
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (!signInError) {
      onSuccess()
      return
    }

    setSuccess(
      'Registrazione completata. Se il progetto richiede conferma email, conferma la mail e poi accedi dalla scheda Accedi.',
    )
    onBackToLogin()
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Crea un account operatore
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <TextField
        label="Nome e cognome"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        autoComplete="name"
        fullWidth
      />
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
        autoComplete="new-password"
        fullWidth
      />
      <TextField
        label="Conferma password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
        fullWidth
      />

      <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth sx={{ mt: 0.5, py: 1.5 }}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrati'}
      </Button>
      <Button type="button" variant="text" onClick={onBackToLogin} fullWidth>
        Hai già un account? Accedi
      </Button>
    </Box>
  )
}


