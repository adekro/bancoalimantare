import { Box, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'

export default function DettaglioUtente() {
  const { id } = useParams()
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Dettaglio Nucleo #{id}</Typography>
      <Typography color="text.secondary">Modulo in sviluppo (Fase 3).</Typography>
    </Box>
  )
}
