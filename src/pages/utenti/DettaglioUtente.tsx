import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, TextField, MenuItem, Paper, Stack,
  Alert, CircularProgress, Divider, Switch, FormControlLabel, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import TableRowsIcon from '@mui/icons-material/TableRows'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/api/supabase'
import StatusChip from '@/components/common/StatusChip'
import type { StatoNucleo } from '@/components/common/StatusChip'

const ZONE = ['Pombio', 'Duomo', 'Medassino', 'San Rocco']
const STATI: { value: StatoNucleo; label: string }[] = [
  { value: 'verde', label: 'Attivo' },
  { value: 'nero',  label: 'Non rinnovato' },
  { value: 'rosso', label: 'Sospeso' },
]

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

/** Tenta di normalizzare DD/MM/YYYY → YYYY-MM-DD, altrimenti restituisce inalterato */
function normalizzaData(s: string): string {
  const m = s.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return s.trim()
}

/** Parsing copia-incolla da Excel (colonne tab-separate: Cognome, Nome, DataNascita, Nazionalità) */
function parseExcel(text: string): PersonaForm[] {
  const righe = text
    .split(/\r?\n/)
    .map((r) => r.split('\t').map((c) => c.trim()))
    .filter((r) => r.length >= 2 && r.some(Boolean))

  // Salta eventuale riga di intestazione
  const prima = righe[0]
  const isHeader =
    prima &&
    ['cognome', 'nome', 'cf', 'cod'].some((k) => prima[0]?.toLowerCase().includes(k))
  const dati = isHeader ? righe.slice(1) : righe

  return dati.map((r) => ({
    cognome:      r[0] ?? '',
    nome:         r[1] ?? '',
    data_nascita: r[2] ? normalizzaData(r[2]) : '',
    nazionalita:  r[3] ?? '',
  }))
}

// ---- Sub-componente form persona ----
function SezionePersona({
  value, onChange, label,
}: {
  value: PersonaForm
  onChange: (v: PersonaForm) => void
  label: string
}) {
  return (
    <Box>
      {label && <Typography variant="subtitle1" fontWeight={600} mb={1.5}>{label}</Typography>}
      <Stack direction="row" gap={2} flexWrap="wrap">
        <TextField
          label="Cognome" value={value.cognome} required
          onChange={(e) => onChange({ ...value, cognome: e.target.value })}
          sx={{ flex: 1, minWidth: 160 }}
        />
        <TextField
          label="Nome" value={value.nome} required
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
export default function DettaglioUtente() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Stato form nucleo
  const [cf, setCf] = useState('')
  const [zona, setZona] = useState('')
  const [stato, setStato] = useState<StatoNucleo>('verde')

  // Stato componenti
  const [stessoSoggetto, setStessoSoggetto] = useState(true)
  const [capofamiglia, setCapofamiglia] = useState<PersonaForm>({ ...PERSONA_VUOTA })
  const [titolare, setTitolare] = useState<PersonaForm>({ ...PERSONA_VUOTA })
  const [componentiExtra, setComponentiExtra] = useState<PersonaForm[]>([])

  // Stato tessera
  const [tesseraId, setTesseraId] = useState<string | null>(null)
  const [tessNumero, setTessNumero] = useState('')
  const [tessScadVecchia, setTessScadVecchia] = useState('')
  const [tessScadNuova, setTessScadNuova] = useState('')

  // Dialog import Excel
  const [excelOpen, setExcelOpen] = useState(false)
  const [excelText, setExcelText] = useState('')

  useEffect(() => {
    if (!id) return
    const carica = async () => {
      setPageLoading(true)
      const { data: nucl, error: e1 } = await supabase
        .from('nuclei')
        .select('*')
        .eq('id', id)
        .single()
      const { data: comps, error: e2 } = await supabase
        .from('componenti')
        .select('*')
        .eq('nucleo_id', id)
        .order('created_at')
      const { data: tess, error: e3 } = await supabase
        .from('tessere')
        .select('*')
        .eq('nucleo_id', id)

      if (e1 || e2 || e3) {
        setError('Errore nel caricamento dei dati.')
        setPageLoading(false)
        return
      }

      // Popola stato form
      setCf(nucl.codice_fiscale ?? '')
      setZona(nucl.zona ?? '')
      setStato(nucl.stato ?? 'verde')

      const capoFound  = comps?.find((c: {ruolo: string}) => c.ruolo === 'capofamiglia')
      const titolFound = comps?.find((c: {ruolo: string}) => c.ruolo === 'titolare')
      const extrasFound = comps?.filter((c: {ruolo: string}) => c.ruolo === 'componente') ?? []

      if (capoFound) {
        setCapofamiglia({
          nome: capoFound.nome ?? '',
          cognome: capoFound.cognome ?? '',
          data_nascita: capoFound.data_nascita ?? '',
          nazionalita: capoFound.nazionalita ?? '',
        })
      }
      setStessoSoggetto(!titolFound)
      if (titolFound) {
        setTitolare({
          nome: titolFound.nome ?? '',
          cognome: titolFound.cognome ?? '',
          data_nascita: titolFound.data_nascita ?? '',
          nazionalita: titolFound.nazionalita ?? '',
        })
      }
      setComponentiExtra(
        extrasFound.map((c: {nome: string; cognome: string; data_nascita: string | null; nazionalita: string | null}) => ({
          nome: c.nome ?? '',
          cognome: c.cognome ?? '',
          data_nascita: c.data_nascita ?? '',
          nazionalita: c.nazionalita ?? '',
        }))
      )

      const t = tess?.[0]
      if (t) {
        setTesseraId(t.id)
        setTessNumero(t.numero ?? '')
        setTessScadVecchia(t.scadenza_vecchia ?? '')
        setTessScadNuova(t.scadenza_nuova ?? '')
      }

      setPageLoading(false)
    }
    carica()
  }, [id])

  const addComponente = () => setComponentiExtra((prev) => [...prev, { ...PERSONA_VUOTA }])
  const removeComponente = (i: number) =>
    setComponentiExtra((prev) => prev.filter((_, idx) => idx !== i))
  const updateComponente = (i: number, v: PersonaForm) =>
    setComponentiExtra((prev) => prev.map((c, idx) => (idx === i ? v : c)))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!zona) { setError('Seleziona una zona.'); return }
    if (!capofamiglia.cognome || !capofamiglia.nome) {
      setError('Inserisci almeno cognome e nome del capofamiglia.')
      return
    }
    setError('')
    setSaving(true)

    // 1. Aggiorna nucleo
    const { error: nuclErr } = await supabase
      .from('nuclei')
      .update({
        codice_fiscale: cf.trim() || null,
        zona,
        stato,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (nuclErr) { setError(nuclErr.message); setSaving(false); return }

    // 2. Rimuovi tutti i componenti e re-inserisci (approccio semplice)
    await supabase.from('componenti').delete().eq('nucleo_id', id)

    const toInsert = [
      {
        nucleo_id: id,
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
        nucleo_id: id,
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
          nucleo_id: id,
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
    if (compErr) { setError(compErr.message); setSaving(false); return }

    // 3. Aggiorna / crea tessera
    if (tessNumero.trim()) {
      if (tesseraId) {
        await supabase.from('tessere').update({
          numero: tessNumero.trim(),
          scadenza_vecchia: tessScadVecchia || null,
          scadenza_nuova: tessScadNuova || null,
        }).eq('id', tesseraId)
      } else {
        const { data: newTess } = await supabase.from('tessere').insert({
          nucleo_id: id,
          numero: tessNumero.trim(),
          scadenza_vecchia: tessScadVecchia || null,
          scadenza_nuova: tessScadNuova || null,
        }).select('id').single()
        if (newTess) setTesseraId(newTess.id)
      }
    }

    setSaving(false)
    setSuccessMsg('Dati salvati correttamente.')
  }

  const handleImportaExcel = () => {
    const persone = parseExcel(excelText)
    if (persone.length === 0) return
    // Il primo diventa capofamiglia (se vuoto), gli altri vanno in componentiExtra
    if (!capofamiglia.cognome && !capofamiglia.nome && persone[0]) {
      setCapofamiglia(persone[0])
      setComponentiExtra((prev) => [...prev, ...persone.slice(1)])
    } else {
      setComponentiExtra((prev) => [...prev, ...persone])
    }
    setExcelText('')
    setExcelOpen(false)
  }

  if (pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleSave}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => navigate('/utenti')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Dettaglio Nucleo</Typography>
          <StatusChip stato={stato} />
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<TableRowsIcon />}
            onClick={() => setExcelOpen(true)}
          >
            Importa da Excel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
            sx={{ minWidth: 130 }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Salva'}
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      <Stack gap={3}>
        {/* Sezione: Dati nucleo */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" mb={2}>Dati nucleo</Typography>
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
            <TextField
              select label="Stato" value={stato}
              onChange={(e) => setStato(e.target.value as StatoNucleo)}
              sx={{ flex: 1, minWidth: 180 }}
            >
              {STATI.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>
          </Stack>
        </Paper>

        {/* Sezione: Persone */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" mb={1}>Capofamiglia e Titolare tessera</Typography>
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
            />
            {!stessoSoggetto && (
              <>
                <Divider />
                <SezionePersona value={titolare} onChange={setTitolare} label="Titolare tessera" />
              </>
            )}
          </Stack>
        </Paper>

        {/* Sezione: Altri componenti */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Altri componenti del nucleo</Typography>
            <Button startIcon={<AddIcon />} onClick={addComponente} size="small">
              Aggiungi
            </Button>
          </Box>
          {componentiExtra.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              Nessun altro componente.
            </Typography>
          ) : (
            <Stack gap={3}>
              {componentiExtra.map((c, i) => (
                <Box key={i}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle2" color="text.secondary">Componente {i + 1}</Typography>
                    <Tooltip title="Rimuovi">
                      <IconButton size="small" color="error" onClick={() => removeComponente(i)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <SezionePersona value={c} onChange={(v) => updateComponente(i, v)} label="" />
                  {i < componentiExtra.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        {/* Sezione: Tessera */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" mb={2}>Tessera</Typography>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <TextField
              label="Numero tessera" value={tessNumero}
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
        </Paper>

        {/* Azioni finali */}
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={() => navigate('/utenti')} disabled={saving}>
            Torna alla lista
          </Button>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving} sx={{ minWidth: 130 }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Salva'}
          </Button>
        </Box>
      </Stack>

      {/* Dialog import Excel */}
      <Dialog open={excelOpen} onClose={() => setExcelOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Importa componenti da Excel</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Copia le celle da Excel e incollale qui sotto. Il formato atteso è:
            <br />
            <strong>Cognome [TAB] Nome [TAB] Data nascita [TAB] Nazionalità</strong>
            <br />
            La data può essere nel formato GG/MM/AAAA oppure AAAA-MM-GG.
            Se la prima riga è un'intestazione viene ignorata automaticamente.
          </Typography>
          <TextField
            multiline rows={8} fullWidth
            placeholder={'Rossi\tMario\t01/01/1970\titaliana\nRossi\tMaria\t15/06/1995\titaliana'}
            value={excelText}
            onChange={(e) => setExcelText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setExcelOpen(false); setExcelText('') }}>Annulla</Button>
          <Button variant="contained" onClick={handleImportaExcel} disabled={!excelText.trim()}>
            Importa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
