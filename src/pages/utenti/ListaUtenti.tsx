import { Box, Typography } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'

export default function ListaUtenti() {
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <PeopleIcon color="primary" />
        <Typography variant="h5">Utenti – Nuclei Familiari</Typography>
      </Box>
      <Typography color="text.secondary">
        Modulo in sviluppo (Fase 3).
      </Typography>
    </Box>
  )
}
