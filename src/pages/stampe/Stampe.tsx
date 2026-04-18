import { Box, Typography } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'

export default function Stampe() {
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <PrintIcon color="primary" />
        <Typography variant="h5">Stampe e Reportistica</Typography>
      </Box>
      <Typography color="text.secondary">Modulo in sviluppo (Fase 6).</Typography>
    </Box>
  )
}
