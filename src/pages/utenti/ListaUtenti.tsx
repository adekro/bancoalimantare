import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Button, TextField, MenuItem, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  InputAdornment,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabase'
import StatusChip from '@/components/common/StatusChip'
import type { StatoNucleo } from '@/components/common/StatusChip'

const ZONE_FILTER = ['Tutte', 'Pombio', 'Duomo', 'Medassino', 'San Rocco']
const STATO_FILTER = [
  { value: '',      label: 'Tutti gli stati' },
  { value: 'verde', label: 'Attivi' },
  { value: 'nero',  label: 'Non rinnovati' },
  { value: 'rosso', label: 'Sospesi' },
]

type Componente = { id: string; ruolo: string; nome: string; cognome: string }
type Tessera    = { id: string; numero: string; scadenza_nuova: string | null }
type Nucleo = {
  id: string
  codice_fiscale: string | null
  zona: string
  stato: StatoNucleo
  archiviato: boolean
  created_at: string
  componenti: Componente[]
  tessere: Tessera[]
}

function getNomePrincipale(componenti: Componente[]) {
  const c =
    componenti.find((c) => c.ruolo === 'capofamiglia') ??
    componenti.find((c) => c.ruolo === 'titolare') ??
    componenti[0]
  return c ? `${c.cognome} ${c.nome}`.trim() : '—'
}

function matchSearch(n: Nucleo, q: string) {
  const low = q.toLowerCase()
  if (n.codice_fiscale?.toLowerCase().includes(low)) return true
  if (n.tessere.some((t) => t.numero.toLowerCase().includes(low))) return true
  if (n.componenti.some((c) =>
    c.cognome.toLowerCase().includes(low) || c.nome.toLowerCase().includes(low)
  )) return true
  return false
}

export default function ListaUtenti() {
  const navigate = useNavigate()
  const [nuclei, setNuclei] = useState<Nucleo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [zonaFilter, setZonaFilter] = useState('Tutte')
  const [statoFilter, setStatoFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showArchiviati, setShowArchiviati] = useState(false)
  const [archivioId, setArchivioId] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [rinnovoOpen, setRinnovoOpen] = useState(false)
  const [rinnovoLoading, setRinnovoLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('nuclei')
      .select('*, componenti(*), tessere(*)')
      .eq('archiviato', showArchiviati)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setNuclei((data as Nucleo[]) ?? [])
    setLoading(false)
  }, [showArchiviati])

  useEffect(() => { load() }, [load])

  const filtered = nuclei.filter((n) => {
    if (zonaFilter !== 'Tutte' && n.zona !== zonaFilter) return false
    if (statoFilter && n.stato !== statoFilter) return false
    if (search.trim() && !matchSearch(n, search.trim())) return false
    return true
  })

  const handleArchivia = async () => {
    if (!archivioId) return
    setArchiving(true)
    await supabase.from('nuclei').update({ archiviato: !showArchiviati }).eq('id', archivioId)
    setArchiving(false)
    setArchivioId(null)
    load()
  }

  const handleRinnovoAnnuale = async () => {
    setRinnovoLoading(true)
    const { error: err } = await supabase
      .from('nuclei')
      .update({ stato: 'verde' })
      .eq('archiviato', false)
    setRinnovoLoading(false)
    setRinnovoOpen(false)
    if (err) setError(err.message)
    else {
      setSuccessMsg('Rinnovo annuale completato: tutti i nuclei attivi sono stati reimpostati su "Attivo".')
      load()
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <PeopleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5">Nuclei Familiari</Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            color="warning"
            startIcon={<AutorenewIcon />}
            onClick={() => setRinnovoOpen(true)}
          >
            Rinnovo Annuale
          </Button>
          <Button
            variant={showArchiviati ? 'outlined' : 'text'}
            color="inherit"
            onClick={() => setShowArchiviati((v) => !v)}
          >
            {showArchiviati ? 'Mostra attivi' : 'Mostra archiviati'}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/utenti/nuovo')}>
            Nuovo
          </Button>
        </Stack>
      </Box>

      {/* Filtri */}
      <Stack direction="row" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Cerca nome, CF, tessera…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            ),
          }}
        />
        <TextField
          select label="Zona" value={zonaFilter}
          onChange={(e) => setZonaFilter(e.target.value)}
          size="small" sx={{ minWidth: 160 }}
        >
          {ZONE_FILTER.map((z) => <MenuItem key={z} value={z}>{z}</MenuItem>)}
        </TextField>
        <TextField
          select label="Stato" value={statoFilter}
          onChange={(e) => setStatoFilter(e.target.value)}
          size="small" sx={{ minWidth: 180 }}
        >
          {STATO_FILTER.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {['Nominativo', 'Cod. Fiscale', 'Zona', 'N° Tessera', 'Stato', 'Azioni'].map((h) => (
                  <TableCell key={h} sx={{ color: '#fff', fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    Nessun nucleo trovato
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((n) => (
                  <TableRow key={n.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{getNomePrincipale(n.componenti)}</TableCell>
                    <TableCell>{n.codice_fiscale ?? '—'}</TableCell>
                    <TableCell>{n.zona}</TableCell>
                    <TableCell>{n.tessere[0]?.numero ?? '—'}</TableCell>
                    <TableCell><StatusChip stato={n.stato} /></TableCell>
                    <TableCell>
                      <Stack direction="row" gap={0.5}>
                        <Tooltip title="Modifica">
                          <IconButton size="small" color="primary" onClick={() => navigate(`/utenti/${n.id}`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={showArchiviati ? 'Ripristina' : 'Archivia'}>
                          <IconButton size="small" onClick={() => setArchivioId(n.id)}>
                            {showArchiviati
                              ? <UnarchiveIcon fontSize="small" />
                              : <ArchiveIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {filtered.length} nucleo/i {showArchiviati ? 'archiviati' : 'attivi'}
      </Typography>

      {/* Dialog archivia/ripristina */}
      <Dialog open={!!archivioId} onClose={() => setArchivioId(null)}>
        <DialogTitle>{showArchiviati ? 'Ripristina nucleo' : 'Archivia nucleo'}</DialogTitle>
        <DialogContent>
          <Typography>
            {showArchiviati
              ? 'Vuoi ripristinare questo nucleo tra quelli attivi?'
              : 'Vuoi archiviare questo nucleo? Non comparirà più nelle liste attive.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchivioId(null)}>Annulla</Button>
          <Button
            variant="contained"
            color={showArchiviati ? 'primary' : 'error'}
            onClick={handleArchivia}
            disabled={archiving}
          >
            {archiving ? <CircularProgress size={20} color="inherit" /> : (showArchiviati ? 'Ripristina' : 'Archivia')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog rinnovo annuale */}
      <Dialog open={rinnovoOpen} onClose={() => setRinnovoOpen(false)}>
        <DialogTitle>Rinnovo Massivo Annuale</DialogTitle>
        <DialogContent>
          <Typography>
            Questa operazione reimposta lo stato di <strong>tutti i nuclei attivi</strong> su{' '}
            <strong>"Attivo"</strong> (verde). Solitamente viene eseguita il 1° gennaio.
          </Typography>
          <Typography mt={1} color="text.secondary" variant="body2">
            I nuclei archiviati non verranno modificati.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRinnovoOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleRinnovoAnnuale} disabled={rinnovoLoading}>
            {rinnovoLoading ? <CircularProgress size={20} color="inherit" /> : 'Conferma rinnovo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
