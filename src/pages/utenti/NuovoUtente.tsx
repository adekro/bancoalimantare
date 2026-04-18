import { useState } from 'react'
import {
  Box, Typography, Button, TextField, MenuItem, Paper, Stack,
  Alert, CircularProgress, Divider, Switch, FormControlLabel, IconButton, Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabase'

const ZONE = ['Pombio', 'Duomo', 'Medassino', 'San Rocco']

type PersonaForm = { nome: string; cognome: string; data_nascita: string; nazionalita: string }

const PERSONA_VUOTA: PersonaForm = { nome: '', cognome: '', data_nascita: '', nazionalita: '' }

function calcFascia(dataNascita: string): '0-17' | '18-29' | '30-64' | '65+' | null {
  if (!dataNascita) return null
  const nascita = new Date(dataNascita)
  const oggi = new Date()
  let anni = oggi.getFullYear() - nascita.getFullYear()
  const m = oggi.getMonth() - nascita.getMonth()
  if (m < 0 || (m === 0 && oggi.getDate() < nascita.getDate())) anni--
  if (anni < 18) return '0-17'
  if (anni < 30) return '18-29'
  if (anni < 65) return '30-64'
  return '65+'
}

// ---- Sub-componente form persona ----
function SezionePersona({
  value, onChange, label, required,
}: {
  value: PersonaForm
  onChange: (v: PersonaForm) => void
  label: string
  required?: boolean
}) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} mb={1.5}>{label}</Typography>
      <Stack direction="row" gap={2} flexWrap="wrap">
        <TextField
          label="Cognome" value={value.cognome} required={required}
          onChange={(e) => onChange({ ...value, cognome: e.target.value })}
          sx={{ flex: 1, minWidth: 160 }}
        />
        <TextField
          label="Nome" value={value.nome} required={required}
          onChange={(e) => onChange({ ...value, nome: e.target.value })}
          sx={{ flex: 1, minWidth: 160 }}
        />
        <TextField
          label="Data di nascita" type="date" value={value.data_nascita}
          onChange={(e) => onChange({ ...value, data_nascita: e.target.value })}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1, minWidth: 160 }}
        />
        <TextField
          label="Nazionalità" value={value.nazionalita}
          onChange={(e) => onChange({ ...value, nazionalita: e.target.value })}
          sx={{ flex: 1, minWidth: 160 }}
        />
      </Stack>
    </Box>
  )
}

// ---- Pagina principale ----
export default function NuovoUtente() {
  const navigate = useNavigate()
  const [cf, setCf] = useState('')
  const [zona, setZona] = useState('')
  const [stessoSoggetto, setStessoSoggetto] = useState(true)
  const [capofamiglia, setCapofamiglia] = useState<PersonaForm>({ ...PERSONA_VUOTA })
  const [titolare, setTitolare] = useState<PersonaForm>({ ...PERSONA_VUOTA })
  const [componentiExtra, setComponentiExtra] = useState<PersonaForm[]>([])
  const [tessNumero, setTessNumero] = useState('')
  const [tessScadVecchia, setTessScadVecchia] = useState('')
  const [tessScadNuova, setTessScadNuova] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addComponente = () => setComponentiExtra((prev) => [...prev, { ...PERSONA_VUOTA }])

  const removeComponente = (i: number) =>
    setComponentiExtra((prev) => prev.filter((_, idx) => idx !== i))

  const updateComponente = (i: number, v: PersonaForm) =>
    setComponentiExtra((prev) => prev.map((c, idx) => (idx === i ? v : c)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!zona) { setError('Seleziona una zona.'); return }
    if (!capofamiglia.cognome || !capofamiglia.nome) {
      setError('Inserisci almeno cognome e nome del capofamiglia.')
      return
    }
    setError('')
    setLoading(true)

    // 1. Insert nucleo
    const { data: nuclData, error: nuclErr } = await supabase
      .from('nuclei')
      .insert({ codice_fiscale: cf.trim() || null, zona, stato: 'verde', archiviato: false })
      .select('id')
      .single()

    if (nuclErr || !nuclData) {
      setError(nuclErr?.message ?? 'Errore durante il salvataggio del nucleo.')
      setLoading(false)
      return
    }

    const nucleoId = nuclData.id

    // 2. Insert componenti
    const toInsert = [
      {
        nucleo_id: nucleoId,
        ruolo: 'capofamiglia',
        nome: capofamiglia.nome,
        cognome: capofamiglia.cognome,
        data_nascita: capofamiglia.data_nascita || null,
        nazionalita: capofamiglia.nazionalita || null,
        fascia_eta: calcFascia(capofamiglia.data_nascita),
      },
    ]

    if (!stessoSoggetto && (titolare.cognome || titolare.nome)) {
      toInsert.push({
        nucleo_id: nucleoId,
        ruolo: 'titolare',
        nome: titolare.nome,
        cognome: titolare.cognome,
        data_nascita: titolare.data_nascita || null,
        nazionalita: titolare.nazionalita || null,
        fascia_eta: calcFascia(titolare.data_nascita),
      })
    }

    componentiExtra.forEach((c) => {
      if (c.cognome || c.nome) {
        toInsert.push({
          nucleo_id: nucleoId,
          ruolo: 'componente',
          nome: c.nome,
          cognome: c.cognome,
          data_nascita: c.data_nascita || null,
          nazionalita: c.nazionalita || null,
          fascia_eta: calcFascia(c.data_nascita),
        })
      }
    })

    const { error: compErr } = await supabase.from('componenti').insert(toInsert)
    if (compErr) {
      setError(compErr.message)
      setLoading(false)
      return
    }

    // 3. Insert tessera (se compilata)
    if (tessNumero.trim()) {
      const { error: tessErr } = await supabase.from('tessere').insert({
        nucleo_id: nucleoId,
        numero: tessNumero.trim(),
        scadenza_vecchia: tessScadVecchia || null,
        scadenza_nuova: tessScadNuova || null,
      })
      if (tessErr) {
        setError(tessErr.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    navigate(`/utenti/${nucleoId}`)
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5} mb={4}>
        <IconButton onClick={() => navigate('/utenti')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={700} lineHeight={1.2}>Nuovo Nucleo Familiare</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Compila i campi per registrare un nuovo nucleo</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack gap={3}>
        {/* Sezione: Dati nucleo */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 1.5, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>Dati nucleo</Typography>
          </Box>
          <Box sx={{ p: 3 }}>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <TextField
              label="Codice Fiscale del nucleo"
              value={cf}
              onChange={(e) => setCf(e.target.value.toUpperCase())}
              inputProps={{ maxLength: 16 }}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              select label="Zona" value={zona}
              onChange={(e) => setZona(e.target.value)}
              required sx={{ flex: 1, minWidth: 180 }}
            >
              {ZONE.map((z) => <MenuItem key={z} value={z}>{z}</MenuItem>)}
            </TextField>
          </Stack>
          </Box>
        </Paper>

        {/* Sezione: Persone */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 1.5, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>Capofamiglia e Titolare tessera</Typography>
          </Box>
          <Box sx={{ p: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={stessoSoggetto}
                onChange={(e) => setStessoSoggetto(e.target.checked)}
              />
            }
            label="Il titolare della tessera coincide con il capofamiglia"
            sx={{ mb: 2 }}
          />
          <Divider sx={{ mb: 2 }} />
          <Stack gap={3}>
            <SezionePersona
              value={capofamiglia}
              onChange={setCapofamiglia}
              label={stessoSoggetto ? 'Capofamiglia (= Titolare tessera)' : 'Capofamiglia'}
              required
            />
            {!stessoSoggetto && (
              <>
                <Divider />
                <SezionePersona
                  value={titolare}
                  onChange={setTitolare}
                  label="Titolare tessera"
                />
              </>
            )}
          </Stack>
          </Box>
        </Paper>
        </Paper>

        {/* Sezione: Altri componenti */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 1.5, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" fontWeight={700}>Altri componenti del nucleo</Typography>
            <Button startIcon={<AddIcon />} onClick={addComponente} size="small">
              Aggiungi componente
            </Button>
          </Box>
          <Box sx={{ p: 3 }}>
          {componentiExtra.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              Nessun altro componente. Clicca "Aggiungi componente" per inserirne altri.
            </Typography>
          ) : (
            <Stack gap={3}>
              {componentiExtra.map((c, i) => (
                <Box key={i}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Componente {i + 1}
                    </Typography>
                    <Tooltip title="Rimuovi">
                      <IconButton size="small" color="error" onClick={() => removeComponente(i)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <SezionePersona
                    value={c}
                    onChange={(v) => updateComponente(i, v)}
                    label=""
                  />
                  {i < componentiExtra.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </Stack>
          )}
          </Box>
        </Paper>

        {/* Sezione: Tessera */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 1.5, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>Tessera</Typography>
          </Box>
          <Box sx={{ p: 3 }}>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <TextField
              label="Numero tessera"
              value={tessNumero}
              onChange={(e) => setTessNumero(e.target.value)}
              sx={{ flex: 1, minWidth: 160 }}
            />
            <TextField
              label="Scadenza precedente" type="date" value={tessScadVecchia}
              onChange={(e) => setTessScadVecchia(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 160 }}
            />
            <TextField
              label="Scadenza nuova" type="date" value={tessScadNuova}
              onChange={(e) => setTessScadNuova(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 160 }}
            />
          </Stack>
          </Box>
        </Paper>

        {/* Azioni */}
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={() => navigate('/utenti')} disabled={loading}>
            Annulla
          </Button>
          <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 160 }}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Salva nucleo'}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
