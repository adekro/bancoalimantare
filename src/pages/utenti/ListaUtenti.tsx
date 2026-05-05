import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Button, TextField, MenuItem, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip, Stack, Card,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  InputAdornment, Chip, Pagination,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import SearchIcon from '@mui/icons-material/Search'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import TuneIcon from '@mui/icons-material/Tune'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabase'
import type { StatoNucleo } from '@/components/common/StatusChip'

const ZONE_FILTER = ['Tutte', 'Pombio', 'Duomo', 'Medassino', 'San Rocco']
const STATO_FILTER = [
  { value: '', label: 'Tutti' },
  { value: 'verde', label: 'Attivo' },
  { value: 'nero',  label: 'Non rinnovati' },
  { value: 'rosso', label: 'Sospesi' },
]
const PAGE_SIZE = 10

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

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('it-IT')
}

function getScadenzaTone(value: string | null | undefined) {
  if (!value) return 'text.secondary'
  const now = new Date()
  const target = new Date(value)
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return 'error.main'
  if (diff <= 1000 * 60 * 60 * 24 * 7) return 'warning.main'
  return 'text.primary'
}

function initialsFromName(fullName: string) {
  const parts = fullName.split(' ').filter(Boolean)
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
}

function renderInlineStatus(stato: StatoNucleo) {
  if (stato === 'verde') {
    return { label: 'Attivo', color: '#1a6e3c' }
  }
  if (stato === 'nero') {
    return { label: 'Non Rinnovato', color: '#8c4a1e' }
  }
  return { label: 'Sospeso', color: '#b3261e' }
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
  const [page, setPage] = useState(1)

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

  useEffect(() => {
    setPage(1)
  }, [search, zonaFilter, statoFilter, showArchiviati])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pagedRows = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  const totaleFamiglie = nuclei.length
  const attiviCount = nuclei.filter((n) => n.stato === 'verde').length
  const inScadenzaCount = nuclei.filter((n) => {
    const date = n.tessere[0]?.scadenza_nuova
    if (!date) return false
    const diff = new Date(date).getTime() - Date.now()
    return diff > 0 && diff <= 1000 * 60 * 60 * 48
  }).length
  const zoneAttiveCount = new Set(nuclei.map((n) => n.zona)).size

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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
          alignItems: { xs: 'start', md: 'center' },
          columnGap: 2,
          rowGap: 1.2,
          mb: 4.2,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: { xs: '2rem', md: '2.15rem' }, fontWeight: 800, lineHeight: 1.1 }}>
            Nuclei Familiari
          </Typography>
          <Typography sx={{ fontSize: { xs: '0.98rem', md: '1.02rem' }, color: 'text.secondary', mt: 0.4 }}>
            Gestione anagrafica e monitoraggio beneficiari
          </Typography>
        </Box>
        <Stack
          direction="row"
          sx={{
            gap: 0.8,
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
            justifySelf: { md: 'end' },
            mt: { xs: 0.2, md: 0.4 },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ContentPasteIcon />}
            onClick={() => setSuccessMsg('La funzione di import rapido e disponibile nella pagina di dettaglio nucleo.')}
            size="small"
            sx={{ minHeight: 34, px: 1.3, fontSize: '0.9rem', m: 0.25 }}
          >
            Copia-incolla da Excel
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/utenti/nuovo')}
            sx={{ minHeight: 34, px: 1.3, fontSize: '0.9rem', m: 0.25, bgcolor: '#0c6a3a', '&:hover': { bgcolor: '#09582f' } }}
          >
            Nuovo Nucleo
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<AutorenewIcon />}
            onClick={() => setRinnovoOpen(true)}
            sx={{ minHeight: 34, px: 1.3, fontSize: '0.9rem', m: 0.25 }}
          >
            Rinnovo Annuale
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
          mb: 3.4,
        }}
      >
        <Card variant="outlined" sx={{ p: 2.4, minHeight: 132 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.7, fontWeight: 700 }}>TOTALE FAMIGLIE</Typography>
            <GroupOutlinedIcon fontSize="small" color="success" />
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{totaleFamiglie.toLocaleString('it-IT')}</Typography>
          <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>+12%</Typography>
        </Card>
        <Card variant="outlined" sx={{ p: 2.4, minHeight: 132 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.7, fontWeight: 700 }}>ATTIVI</Typography>
            <CheckCircleOutlineOutlinedIcon fontSize="small" color="success" />
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{attiviCount.toLocaleString('it-IT')}</Typography>
          <Typography variant="caption" color="text.secondary">Verifica mensile completata</Typography>
        </Card>
        <Card variant="outlined" sx={{ p: 2.4, minHeight: 132 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.7, fontWeight: 700 }}>IN SCADENZA (48H)</Typography>
            <WarningAmberOutlinedIcon fontSize="small" color="warning" />
          </Stack>
          <Typography variant="h4" color="#8c4a1e" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{inScadenzaCount.toLocaleString('it-IT')}</Typography>
          <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>Richiede Rinnovo</Typography>
        </Card>
        <Card variant="outlined" sx={{ p: 2.4, minHeight: 132 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.7, fontWeight: 700 }}>ZONIZZAZIONE</Typography>
            <MapOutlinedIcon fontSize="small" color="disabled" />
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{zoneAttiveCount.toLocaleString('it-IT')}</Typography>
          <Typography variant="caption" color="text.secondary">Aree urbane attive</Typography>
        </Card>
      </Box>

      {/* Filtri */}
      <Paper variant="outlined" sx={{ p: 2.4, mb: 3.2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.2}
            sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <TextField
              placeholder="Cerca nome, CF, tessera..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              size="small"
              label="Filtra per zona"
              value={zonaFilter}
              onChange={(e) => setZonaFilter(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              {ZONE_FILTER.map((z) => <MenuItem key={z} value={z}>{z}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {STATO_FILTER.map((item) => (
                <Chip
                  key={item.value || 'all'}
                  label={item.label}
                  onClick={() => setStatoFilter(item.value)}
                  color={statoFilter === item.value ? 'success' : 'default'}
                  variant={statoFilter === item.value ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="text"
              startIcon={<TuneIcon />}
              color="inherit"
              sx={{ color: 'text.secondary' }}
            >
              Filtri Avanzati
            </Button>
            <Button
              variant={showArchiviati ? 'outlined' : 'text'}
              color="inherit"
              onClick={() => setShowArchiviati((v) => !v)}
            >
              {showArchiviati ? 'Mostra Attivi' : 'Mostra Archiviati'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, mt: 0.4 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Nominativo', 'Codice Fiscale', 'Zona', 'N. Tessera', 'Scadenza', 'Stato', 'Azioni'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    Nessun nucleo trovato
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((n) => {
                  const nome = getNomePrincipale(n.componenti)
                  const scadenza = n.tessere[0]?.scadenza_nuova ?? null
                  const status = renderInlineStatus(n.stato)
                  return (
                  <TableRow key={n.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: 'rgba(26, 110, 60, 0.12)',
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {initialsFromName(nome)}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{nome}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Nucleo: {Math.max(n.componenti.length, 1)} persone
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{n.codice_fiscale ?? '—'}</TableCell>
                    <TableCell>{n.zona}</TableCell>
                    <TableCell>{n.tessere[0]?.numero ?? '—'}</TableCell>
                    <TableCell sx={{ color: getScadenzaTone(scadenza), fontWeight: 700 }}>
                      {formatDate(scadenza)}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: status.color }} />
                        <Typography variant="body2" sx={{ color: status.color, fontWeight: 700 }}>
                          {status.label}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ gap: 0.5 }}>
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
                )})
              )}
            </TableBody>
          </Table>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.3,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.7 }}>
              VISUALIZZANDO {filtered.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filtered.length)} DI {filtered.length.toLocaleString('it-IT')} RISULTATI
            </Typography>
            <Pagination
              count={pageCount}
              page={safePage}
              onChange={(_, value) => setPage(value)}
              size="small"
              shape="rounded"
              color="primary"
            />
          </Box>
        </TableContainer>
      )}



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
          <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
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
