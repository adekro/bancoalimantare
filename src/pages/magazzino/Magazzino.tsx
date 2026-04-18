import { Box, Typography } from '@mui/material'
import WarehouseIcon from '@mui/icons-material/Warehouse'

export default function Magazzino() {
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <WarehouseIcon color="primary" />
        <Typography variant="h5">Magazzino</Typography>
      </Box>
      <Typography color="text.secondary">Modulo in sviluppo (Fase 5).</Typography>
    </Box>
  )
}
