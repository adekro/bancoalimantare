import * as XLSX from 'xlsx'

export type ImportPerson = {
  cognome: string
  nome: string
  dataNascita: string | null
  nazionalita: string | null
  sesso: 'M' | 'F' | null
  paesiTerziUe: boolean
  isCapofamiglia: boolean
  isTesserato: boolean
}

export type ImportNucleo = {
  sourceRowStart: number
  sourceRowEnd: number
  numeroNucleoFamiliare: string | null
  zona: string | null
  codiceFiscale: string | null
  telefono: string | null
  indirizzo: string | null
  tesseraNumero: string | null
  tesseraScadenza: string | null
  persone: ImportPerson[]
  validationErrors: string[]
}

export type ImportIssue = {
  row: number
  message: string
}

export type ParseNucleiResult = {
  nuclei: ImportNucleo[]
  issues: ImportIssue[]
}

type HeaderMap = {
  nr: number
  gr: number
  cognome: number
  nome: number
  nazNascita: number
  sesso: number
  paesiTerziUe: number
  data: number
  tess: number
  scad: number
  telefono: number
  indirizzo: number
  codFisc: number
}

const DEFAULT_HEADER_MAP: HeaderMap = {
  nr: -1,
  gr: -1,
  cognome: -1,
  nome: -1,
  nazNascita: -1,
  sesso: -1,
  paesiTerziUe: -1,
  data: -1,
  tess: -1,
  scad: -1,
  telefono: -1,
  indirizzo: -1,
  codFisc: -1,
}

const ZONA_BY_GR: Record<string, string> = {
  S: 'San Rocco',
  D: 'Duomo',
  P: 'Pombio',
  M: 'Medassino',
}

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/
const DATE_DD_MM_YYYY = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/

function normalizeHeaderValue(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function findHeaderMap(rows: unknown[][]): { rowIndex: number; map: HeaderMap } {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    const normalized = row.map((v) => normalizeHeaderValue(v))
    const map: HeaderMap = { ...DEFAULT_HEADER_MAP }

    normalized.forEach((cell, idx) => {
      if (cell === 'NR' || cell === 'N R') map.nr = idx
      if (cell === 'GR' || cell === 'GRUPPO') map.gr = idx
      if (cell.includes('COGNOME')) map.cognome = idx
      if (cell === 'NOME' || cell.startsWith('NOME ')) map.nome = idx
      if (cell.includes('NAZ NASCITA') || cell.includes('NAZIONALITA')) map.nazNascita = idx
      if (cell === 'SESSO' || cell === 'SEX') map.sesso = idx
      if (cell.includes('PAESI TERZI UE') || cell.includes('EXTRA UE') || cell.includes('NON UE')) {
        map.paesiTerziUe = idx
      }
      if (cell === 'DATA' || cell.includes('DATA NASCITA')) map.data = idx
      if (cell.startsWith('TESS')) map.tess = idx
      if (cell.startsWith('SCAD')) map.scad = idx
      if (cell.startsWith('TELEFONO') || cell === 'TEL') map.telefono = idx
      if (cell.startsWith('INDIRIZZO')) map.indirizzo = idx
      if (cell.includes('COD FISC')) map.codFisc = idx
    })

    if (map.cognome >= 0 && map.nome >= 0) {
      return { rowIndex, map }
    }
  }

  throw new Error('Intestazione non trovata: servono almeno le colonne Cognome e Nome.')
}

function getCell(row: unknown[], idx: number): unknown {
  if (idx < 0) return ''
  return row[idx] ?? ''
}

function asTrimmedString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value)
    return String(value).replace('.', ',')
  }
  return String(value).trim()
}

function normalizeCodiceFiscale(value: unknown): string | null {
  const v = asTrimmedString(value).toUpperCase().replace(/\s+/g, '')
  if (!v) return null
  return v
}

function normalizeTessera(value: unknown): string | null {
  const raw = asTrimmedString(value)
  if (!raw) return null
  if (/^\d+(\.0+)?$/.test(raw)) return String(parseInt(raw, 10))
  return raw
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function normalizeDate(value: unknown): string | null {
  if (value == null || value === '') return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) {
      return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`
    }
  }

  const raw = asTrimmedString(value)
  if (!raw) return null

  if (DATE_YYYY_MM_DD.test(raw)) return raw

  const ddmmyyyy = raw.match(DATE_DD_MM_YYYY)
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1])
    const month = Number(ddmmyyyy[2])
    let year = Number(ddmmyyyy[3])
    if (ddmmyyyy[3].length === 2) year += 2000
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`
    }
  }

  return null
}

function isPersonRow(cognome: unknown, nome: unknown): boolean {
  return Boolean(asTrimmedString(cognome) || asTrimmedString(nome))
}

function isLeadRow(row: unknown[], map: HeaderMap): boolean {
  return Boolean(
    asTrimmedString(getCell(row, map.nr)) ||
    asTrimmedString(getCell(row, map.tess)) ||
    asTrimmedString(getCell(row, map.scad)) ||
    asTrimmedString(getCell(row, map.telefono)) ||
    asTrimmedString(getCell(row, map.indirizzo)) ||
    asTrimmedString(getCell(row, map.codFisc))
  )
}

function parseZonaFromGr(value: unknown): string | null {
  const gr = asTrimmedString(value).toUpperCase()
  if (!gr) return null
  return ZONA_BY_GR[gr] ?? null
}

function normalizeSesso(value: unknown): 'M' | 'F' | null {
  const raw = asTrimmedString(value).toUpperCase()
  if (!raw) return null
  if (raw === 'M' || raw === 'MASCHIO') return 'M'
  if (raw === 'F' || raw === 'FEMMINA') return 'F'
  return null
}

function normalizePaesiTerziUe(value: unknown): boolean {
  const raw = asTrimmedString(value).toUpperCase()
  if (!raw) return false
  return ['SI', 'S', 'YES', 'Y', 'TRUE', '1', 'X'].includes(raw)
}

function validateNucleo(nucleo: ImportNucleo): string[] {
  const errors: string[] = []

  if (!nucleo.zona) {
    errors.push('Zona non riconosciuta dalla colonna GR')
  }

  if (nucleo.persone.length === 0) {
    errors.push('Nessun componente valido nel blocco')
    return errors
  }

  const capofamiglia = nucleo.persone.find((p) => p.isCapofamiglia)
  if (!capofamiglia) {
    errors.push('Capofamiglia non identificato: manca il numero nucleo familiare in colonna A sulla riga persona')
  } else if (!capofamiglia.cognome || !capofamiglia.nome) {
    errors.push('Capofamiglia incompleto: cognome e nome sono obbligatori')
  }

  const capofamigliaCount = nucleo.persone.filter((p) => p.isCapofamiglia).length
  if (capofamigliaCount > 1) {
    errors.push('Capofamiglia ambiguo: trovate piu righe con numero nucleo familiare nel blocco')
  }

  if (nucleo.tesseraNumero && !nucleo.persone.some((p) => p.isTesserato)) {
    errors.push('Tesserato non identificato: tessera presente ma assente sulla riga persona in colonna J')
  }

  nucleo.persone.forEach((p, idx) => {
    if (!p.cognome && !p.nome) {
      errors.push(`Componente ${idx + 1} vuoto`)
    }
    if (p.dataNascita) {
      const birth = new Date(p.dataNascita)
      if (Number.isNaN(birth.getTime())) {
        errors.push(`Data nascita non valida per ${p.cognome} ${p.nome}`.trim())
      } else if (birth.getTime() > Date.now()) {
        errors.push(`Data nascita futura per ${p.cognome} ${p.nome}`.trim())
      }
    }
  })

  return errors
}

function applyRoleFallbacks(nucleo: ImportNucleo): void {
  if (nucleo.persone.length === 0) return

  const capofamiglia = nucleo.persone.find((p) => p.isCapofamiglia)
  if (!capofamiglia) {
    nucleo.persone[0].isCapofamiglia = true
  }

  if (nucleo.tesseraNumero && !nucleo.persone.some((p) => p.isTesserato)) {
    const capo = nucleo.persone.find((p) => p.isCapofamiglia)
    if (capo) capo.isTesserato = true
    else nucleo.persone[0].isTesserato = true
  }
}

function buildNucleoFromRow(row: unknown[], map: HeaderMap, excelRow: number): ImportNucleo {
  return {
    sourceRowStart: excelRow,
    sourceRowEnd: excelRow,
    numeroNucleoFamiliare: asTrimmedString(getCell(row, map.nr)) || null,
    zona: parseZonaFromGr(getCell(row, map.gr)),
    codiceFiscale: normalizeCodiceFiscale(getCell(row, map.codFisc)),
    telefono: asTrimmedString(getCell(row, map.telefono)) || null,
    indirizzo: asTrimmedString(getCell(row, map.indirizzo)) || null,
    tesseraNumero: normalizeTessera(getCell(row, map.tess)),
    tesseraScadenza: normalizeDate(getCell(row, map.scad)),
    persone: [],
    validationErrors: [],
  }
}

export async function parseNucleiFromExcel(file: File): Promise<ParseNucleiResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    raw: false,
    dense: false,
  })

  if (workbook.SheetNames.length === 0) {
    throw new Error('Il file non contiene fogli utilizzabili.')
  }

  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]
  if (!sheet) {
    throw new Error('Impossibile leggere il primo foglio Excel.')
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
    raw: true,
  })

  const { rowIndex: headerRowIndex, map } = findHeaderMap(rows)

  const nuclei: ImportNucleo[] = []
  const issues: ImportIssue[] = []

  let current: ImportNucleo | null = null

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    const excelRow = i + 1
    const lead = isLeadRow(row, map)

    if (lead) {
      if (!current) {
        current = buildNucleoFromRow(row, map, excelRow)
      } else if (current.persone.length > 0) {
        applyRoleFallbacks(current)
        current.validationErrors = validateNucleo(current)
        nuclei.push(current)
        current = buildNucleoFromRow(row, map, excelRow)
      } else {
        current = buildNucleoFromRow(row, map, excelRow)
      }
    }

    const cognomeCell = getCell(row, map.cognome)
    const nomeCell = getCell(row, map.nome)
    if (!isPersonRow(cognomeCell, nomeCell)) continue

    if (!current) {
      current = buildNucleoFromRow(row, map, excelRow)
    }

    if (!current) continue

    const isCapofamigliaOnRow = Boolean(asTrimmedString(getCell(row, map.nr)))
    const isTesseratoOnRow = Boolean(asTrimmedString(getCell(row, map.tess)))

    const persona: ImportPerson = {
      cognome: asTrimmedString(cognomeCell),
      nome: asTrimmedString(nomeCell),
      dataNascita: normalizeDate(getCell(row, map.data)),
      nazionalita: asTrimmedString(getCell(row, map.nazNascita)) || null,
      sesso: normalizeSesso(getCell(row, map.sesso)),
      paesiTerziUe: normalizePaesiTerziUe(getCell(row, map.paesiTerziUe)),
      isCapofamiglia: isCapofamigliaOnRow,
      isTesserato: isTesseratoOnRow,
    }

    if (!persona.dataNascita && asTrimmedString(getCell(row, map.data))) {
      issues.push({ row: excelRow, message: 'Data non interpretabile, lasciata vuota.' })
    }

    current.persone.push(persona)
    current.sourceRowEnd = excelRow

    if (!current.zona) {
      const zonaFromRow = parseZonaFromGr(getCell(row, map.gr))
      if (zonaFromRow) current.zona = zonaFromRow
    }

    if (!current.codiceFiscale) {
      current.codiceFiscale = normalizeCodiceFiscale(getCell(row, map.codFisc))
    }

    if (!current.numeroNucleoFamiliare) {
      current.numeroNucleoFamiliare = asTrimmedString(getCell(row, map.nr)) || null
    }

    if (!current.telefono) {
      current.telefono = asTrimmedString(getCell(row, map.telefono)) || null
    }

    if (!current.indirizzo) {
      current.indirizzo = asTrimmedString(getCell(row, map.indirizzo)) || null
    }

    if (!current.tesseraNumero) {
      current.tesseraNumero = normalizeTessera(getCell(row, map.tess))
    }

    if (!current.tesseraScadenza) {
      current.tesseraScadenza = normalizeDate(getCell(row, map.scad))
    }
  }

  if (current && current.persone.length > 0) {
    applyRoleFallbacks(current)
    current.validationErrors = validateNucleo(current)
    nuclei.push(current)
  }

  nuclei.forEach((n) => {
    n.validationErrors.forEach((message) => {
      issues.push({ row: n.sourceRowStart, message })
    })
  })

  return { nuclei, issues }
}
