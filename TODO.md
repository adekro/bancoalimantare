# TODO – Gestionale Solidale: Banco Alimentare

Checklist di sviluppo fase per fase. Spunta ogni voce al completamento.

---

## Fase 0 — Setup & Infrastruttura ✅

- [x] Scaffolda progetto React + Vite (`npm create vite@latest`)
- [x] Installa dipendenze: `@mui/material @emotion/react @emotion/styled @mui/icons-material react-router-dom @supabase/supabase-js`
- [x] Installa TypeScript e tipi: `typescript @types/react @types/react-dom @types/node`
- [x] Crea `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- [x] Migra file sorgente: `main.jsx → main.tsx`, `App.jsx → App.tsx`, `vite.config.js → vite.config.ts`
- [x] Aggiorna `index.html` (lang=it, punta a `main.tsx`)
- [x] Crea `src/api/supabase.ts` (client Supabase)
- [x] Crea `.env.local` con `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- [x] Crea `vercel.json` con rewrite SPA
- [x] **[MANUALE]** Crea progetto su [dashboard.supabase.com](https://supabase.com/dashboard)
- [x] **[MANUALE]** Incolla URL e ANON_KEY in `.env.local`
- [x] **[MANUALE]** Crea tabelle Supabase (vedere script SQL in `doc/supabase_schema.sql`)
- [x] **[MANUALE]** Collega repo GitHub a Vercel con le variabili d'ambiente

---

## Fase 1 — Tema, Layout e Routing

- [x] Crea `src/theme.ts` — tema MUI (colori, font leggibili per utenti 70+)
- [x] Crea `src/hooks/useAuth.ts` — context Supabase Auth (`session`, `user`, `signOut`)
- [x] Crea `src/components/common/ProtectedRoute.tsx` — redirect a `/` se non autenticato
- [x] Crea `src/router.tsx` — rotte con `createBrowserRouter` + `RouterProvider`
- [x] Aggiorna `src/App.tsx` — usa `RouterProvider`
- [x] Crea `src/components/layout/AppLayout.tsx` — `Box` flex con Drawer + `<Outlet>`
- [x] Crea `src/components/layout/Sidebar.tsx` — Drawer con `ListItemButton` e `useNavigate`
- [x] Crea `src/pages/Dashboard.tsx` — placeholder dashboard

**Verifiche:**
- [x] `npm run dev` compila senza errori TypeScript
- [x] Navigazione sidebar porta alla rotta corretta
- [x] Redirect a `/` se non autenticato

---

## Fase 2 — Landing Page (Pubblica)

- [ ] Crea `src/pages/Landing.tsx`
  - [ ] Tab "Accedi": form email/password → `supabase.auth.signInWithPassword()` → redirect `/dashboard`
  - [ ] Tab "Richiedi Accesso": form nome, email, zona → insert in tabella `access_requests`
  - [ ] Redirect automatico a `/dashboard` se sessione già attiva
- [ ] Crea tabella Supabase `access_requests` (id, nome, email, centro, stato, created_at)

**Verifiche:**
- [ ] Login funziona, redirect a `/dashboard`
- [ ] Richiesta accesso inserisce riga in `access_requests`
- [ ] Utente non autenticato su rotta protetta → torna a `/`

---

## Fase 3 — Modulo Utenti / Anagrafica

### Schema Supabase da creare:
- [ ] Tabella `nuclei` (id, codice_fiscale, zona, stato `verde|nero|rosso`, archiviato, created_at)
- [ ] Tabella `componenti` (id, nucleo_id, ruolo `capofamiglia|titolare|componente`, nome, cognome, data_nascita, nazionalita, fascia_eta)
- [ ] Tabella `tessere` (id, nucleo_id, numero, scadenza_vecchia, scadenza_nuova, rinnovato)

### Componenti:
- [ ] Crea `src/pages/utenti/ListaUtenti.tsx`
  - [ ] Tabella MUI con filtri (zona, stato semaforico, ricerca testo)
  - [ ] Badge `<Chip>` Verde/Nero/Rosso per stato rinnovo
  - [ ] Pulsanti "Nuovo", "Archivia", "Modifica"
- [ ] Crea `src/pages/utenti/NuovoUtente.tsx`
  - [ ] Form con logica: titolare tessera = capofamiglia? (sì/no)
  - [ ] Se NO: campi separati per capofamiglia e titolare
  - [ ] Selezione zona (Pombio / Duomo / Medassino / San Rocco)
  - [ ] Numero e scadenza tessera
- [ ] Crea `src/pages/utenti/DettaglioUtente.tsx`
  - [ ] Visualizza e modifica nucleo + componenti
  - [ ] Import copia-incolla Excel (textarea → parsing → autofill)
- [ ] Crea `src/components/common/StatusChip.tsx` — chip Verde/Nero/Rosso
- [ ] Funzione "Rinnovo Massivo Annuale" — reset stato `verde` al 1° gennaio (RPC Supabase)

**Verifiche:**
- [ ] CRUD nucleo funziona (crea, modifica, archivia)
- [ ] Sistema semaforico visibile in lista
- [ ] Import da copia-incolla Excel crea il nucleo correttamente
- [ ] Ricerca per codice fiscale, numero tessera, nome/cognome funziona

---

## Fase 4 — Modulo Distribuzione

### Schema Supabase da creare:
- [ ] Tabella `distribuzioni` (id, nucleo_id, centro, data, operatore_id, note)

### Componenti:
- [ ] Crea `src/pages/distribuzione/Distribuzione.tsx`
  - [ ] Selezione centro (Pombio / Duomo / Medassino / San Rocco)
  - [ ] Lista famiglie del centro con checkbox ritiro
  - [ ] Blocco automatico: nucleo già servito nella stessa settimana
  - [ ] Salvataggio aggiorna giacenze magazzino
- [ ] Crea `src/hooks/useDistribuzione.ts`

**Verifiche:**
- [ ] Distribuzione blocca doppio ritiro settimanale
- [ ] Giacenze magazzino si aggiornano dopo la distribuzione
- [ ] Lista ordinata per cognome

---

## Fase 5 — Modulo Magazzino

### Schema Supabase da creare:
- [ ] Tabella `articoli` (id, nome, unita_misura, fondo `FSE+|nazionale|cofinanziato`)
- [ ] Tabella `movimenti_magazzino` (id, articolo_id, tipo `carico|scarico`, quantita_pezzi, data, riferimento)

### Componenti:
- [ ] Crea `src/pages/magazzino/Magazzino.tsx`
  - [ ] Riepilogo giacenze per articolo (giacenza = sum carichi - sum scarichi)
  - [ ] Form carico: selezione articolo, fondo ministeriale, quantità con helper pacchi×pezzi
  - [ ] Storico movimenti con filtro per data e fondo
- [ ] Helper conversione `pacchi × pezzi_per_pacco + pezzi_sfusi`

**Verifiche:**
- [ ] Giacenza calcolata correttamente dopo carico + scarico
- [ ] Fondo ministeriale (FSE+ / Nazionale / Cofinanziato) tracciato per ogni movimento
- [ ] Allineamento con bolle Banco Alimentare

---

## Fase 6 — Stampe e Reportistica

### Componenti:
- [ ] Crea `src/pages/stampe/Stampe.tsx`
  - [ ] Lista nuclei attivi (tutti o per zona), ordinabili alfabet.
  - [ ] Stampa con `window.print()` + stile CSS `@media print`
  - [ ] Report FSE+/FEAD: fasce età (0-18, 18-29, 30-64, 65+), nazionalità, disabilità
  - [ ] Esportazione CSV (download diretto) per portali esterni Ospo/FSE+
  - [ ] Riepilogo rimanenze magazzino
- [ ] Storico modifiche fascicolo (log variazioni nucleo)

**Verifiche:**
- [ ] Stampa lista per zona funziona su tablet
- [ ] CSV contiene campi richiesti dal portale FSE+
- [ ] Report fasce età corrette

---

## Backlog / Idee future

- [ ] Dark mode
- [ ] Notifiche in-app per ISEE in scadenza
- [ ] Storico completo del nucleo (log modifiche)
- [ ] App mobile (React Native o PWA)
- [ ] Sincronizzazione automatica portale FSE+ via API

---

## Note tecniche

| Voce | Valore |
|------|--------|
| Framework | React 19 + Vite + TypeScript |
| UI | MUI v6 |
| Routing | React Router v7 |
| Database/Auth | Supabase |
| Hosting | Vercel |
| Lingue UI | Italiano |
| Auth flow | Supabase Auth — approvazione nuovi utenti MANUALE (admin dashboard) |
| Sidebar mobile | Drawer temporaneo con hamburger menu |
