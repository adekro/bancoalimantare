import { useEffect, useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { supabase } from '@/api/supabase'

type NationalityAutocompleteProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  sx?: SxProps<Theme>
}

let nationalityCache: string[] | null = null
let nationalityLoadPromise: Promise<string[]> | null = null

function normalizeNationality(value: string): string {
  return value.trim().toLowerCase()
}

function dedupeNationalities(values: string[]): string[] {
  const uniqueMap = new Map<string, string>()

  for (const rawValue of values) {
    const trimmed = rawValue.trim()
    if (!trimmed) continue

    const key = normalizeNationality(trimmed)
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, trimmed)
    }
  }

  return Array.from(uniqueMap.values()).sort((a, b) =>
    a.localeCompare(b, 'it', { sensitivity: 'base' })
  )
}

async function loadNationalities(): Promise<string[]> {
  if (nationalityCache) return nationalityCache
  if (nationalityLoadPromise) return nationalityLoadPromise

  nationalityLoadPromise = (async () => {
    const { data, error } = await supabase
      .from('componenti')
      .select('nazionalita')
      .not('nazionalita', 'is', null)

    if (error) {
      return []
    }

    const rawValues = (data ?? [])
      .map((row) => row.nazionalita)
      .filter((value): value is string => typeof value === 'string')

    const deduped = dedupeNationalities(rawValues)
    nationalityCache = deduped
    return deduped
  })()

  try {
    return await nationalityLoadPromise
  } finally {
    nationalityLoadPromise = null
  }
}

export default function NationalityAutocomplete({
  value,
  onChange,
  label = 'Nazionalita',
  required = false,
  sx,
}: NationalityAutocompleteProps) {
  const [options, setOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    setLoading(true)
    void loadNationalities()
      .then((loadedOptions) => {
        if (active) setOptions(loadedOptions)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <Autocomplete<string, false, false, true>
      freeSolo
      options={options}
      loading={loading}
      value={value}
      inputValue={value}
      onInputChange={(_, newInputValue) => onChange(newInputValue)}
      onChange={(_, newValue) => onChange(newValue ?? '')}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          sx={sx}
        />
      )}
    />
  )
}
