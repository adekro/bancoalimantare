import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  Divider,
} from '@mui/material'
import FoodBankIcon from '@mui/icons-material/FoodBank'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/hooks/useAuth'

const ZONE = ['Pombio', 'Duomo', 'Medassino', 'San Rocco']

export default function Landing() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)

  // Redirect se già autenticato
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
        bgcolor: 'primary.dark',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5} mb={4}>
        <FoodBankIcon sx={{ fontSize: 56, color: '#fff' }} />
        <Box>
          <Typography variant="h4" color="#fff" fontWeight={700} lineHeight={1.1}>
            Banco Alimentare
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Gestionale Solidale
          </Typography>
        </Box>
      </Box>

      {/* Card */}
      <Card sx={{ width: '100%', maxWidth: 440, borderRadius: 3, boxShadow: 8 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Accedi" />
          <Tab label="Richiedi Accesso" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {tab === 0 ? (
            <LoginForm onSuccess={() => navigate('/dashboard')} />
          ) : (
            <RichiestaAccessoForm />
          )}
        </CardContent>
      </Card>

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 3 }}>
        © {new Date().getFullYear()} — Per assistenza contattare l'amministratore
      </Typography>
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
    <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
      <Typography variant="h6">Accedi al gestionale</Typography>
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
      <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Entra'}
      </Button>
    </Box>
  )
}

// ---------- Form Richiesta Accesso ----------

function RichiestaAccessoForm() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [zona, setZona] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: dbError } = await supabase
      .from('access_requests')
      .insert({ nome, email, centro: zona, stato: 'in_attesa' })
    setLoading(false)
    if (dbError) {
      setError('Errore nell\'invio della richiesta. Riprova o contatta l\'amministratore.')
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <Box textAlign="center" py={2}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Richiesta inviata! L'amministratore creerà il tuo account e ti comunicherà le credenziali.
        </Alert>
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
      <Typography variant="h6">Richiedi Accesso</Typography>
      <Typography variant="body2" color="text.secondary">
        Compila il modulo. L'amministratore riceverà la tua richiesta e ti contatterà con le credenziali.
      </Typography>
      <Divider />
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Nome e Cognome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
        fullWidth
      />
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
      />
      <TextField
        select
        label="Centro di riferimento"
        value={zona}
        onChange={(e) => setZona(e.target.value)}
        required
        fullWidth
      >
        {ZONE.map((z) => (
          <MenuItem key={z} value={z}>{z}</MenuItem>
        ))}
      </TextField>
      <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Invia Richiesta'}
      </Button>
    </Box>
  )
}
