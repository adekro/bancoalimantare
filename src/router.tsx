import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import ListaUtenti from '@/pages/utenti/ListaUtenti'
import NuovoUtente from '@/pages/utenti/NuovoUtente'
import DettaglioUtente from '@/pages/utenti/DettaglioUtente'
import Distribuzione from '@/pages/distribuzione/Distribuzione'
import Magazzino from '@/pages/magazzino/Magazzino'
import Stampe from '@/pages/stampe/Stampe'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/utenti', element: <ListaUtenti /> },
          { path: '/utenti/nuovo', element: <NuovoUtente /> },
          { path: '/utenti/:id', element: <DettaglioUtente /> },
          { path: '/distribuzione', element: <Distribuzione /> },
          { path: '/magazzino', element: <Magazzino /> },
          { path: '/stampe', element: <Stampe /> },
        ],
      },
    ],
  },
])

export default router
