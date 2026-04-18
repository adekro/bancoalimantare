import { Box, Typography } from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'

export default function Distribuzione() {
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <LocalShippingIcon color="primary" />
        <Typography variant="h5">Distribuzione</Typography>
      </Box>
      <Typography color="text.secondary">Modulo in sviluppo (Fase 4).</Typography>
    </Box>
  )
}
