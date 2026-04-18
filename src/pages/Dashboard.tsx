import { Box, Typography, Grid, Paper } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import WarehouseIcon from '@mui/icons-material/Warehouse'

const stats = [
  { label: 'Nuclei attivi', value: '—', icon: <PeopleIcon fontSize="large" color="primary" /> },
  { label: 'Distribuzioni questa settimana', value: '—', icon: <LocalShippingIcon fontSize="large" color="secondary" /> },
  { label: 'Articoli a magazzino', value: '—', icon: <WarehouseIcon fontSize="large" color="primary" /> },
]

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Benvenuto nel gestionale del Banco Alimentare.
      </Typography>

      <Grid container spacing={3}>
        {stats.map((s) => (
          <Grid item xs={12} sm={6} md={4} key={s.label}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              {s.icon}
              <Box>
                <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
