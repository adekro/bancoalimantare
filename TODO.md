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

## Fase 2 — Landing Page (Pubblica) ✅

- [x] Crea `src/pages/Landing.tsx`
  - [x] Tab "Accedi": form email/password → `supabase.auth.signInWithPassword()` → redirect `/dashboard`
  - [x] Tab "Richiedi Accesso": form nome, email, zona → insert in tabella `access_requests`
  - [x] Redirect automatico a `/dashboard` se sessione già attiva
- [x] Crea tabella Supabase `access_requests` (id, nome, email, centro, stato, created_at)

**Verifiche:**
- [x] Login funziona, redirect a `/dashboard`
- [x] Richiesta accesso inserisce riga in `access_requests`
- [x] Utente non autenticato su rotta protetta → torna a `/`

---

## Fase 3 — Modulo Utenti / Anagrafica ✅

### Schema Supabase da creare:
- [x] Tabella `nuclei` (id, codice_fiscale, zona, stato `verde|nero|rosso`, archiviato, created_at)
- [x] Tabella `componenti` (id, nucleo_id, ruolo `capofamiglia|titolare|componente`, nome, cognome, data_nascita, nazionalita, fascia_eta)
- [x] Tabella `tessere` (id, nucleo_id, numero, scadenza_vecchia, scadenza_nuova, rinnovato)

### Componenti:
- [x] Crea `src/pages/utenti/ListaUtenti.tsx`
  - [x] Tabella MUI con filtri (zona, stato semaforico, ricerca testo)
  - [x] Badge `<Chip>` Verde/Nero/Rosso per stato rinnovo
  - [x] Pulsanti "Nuovo", "Archivia", "Modifica"
- [x] Crea `src/pages/utenti/NuovoUtente.tsx`
  - [x] Form con logica: titolare tessera = capofamiglia? (sì/no)
  - [x] Se NO: campi separati per capofamiglia e titolare
  - [x] Selezione zona (Pombio / Duomo / Medassino / San Rocco)
  - [x] Numero e scadenza tessera
- [x] Crea `src/pages/utenti/DettaglioUtente.tsx`
  - [x] Visualizza e modifica nucleo + componenti
  - [x] Import copia-incolla Excel (textarea → parsing → autofill)
- [x] Crea `src/components/common/StatusChip.tsx` — chip Verde/Nero/Rosso
- [x] Funzione "Rinnovo Massivo Annuale" — reset stato `verde` al 1° gennaio (RPC Supabase)

**Verifiche:**
- [ ] CRUD nucleo funziona (crea, modifica, archivia)
- [ ] Sistema semaforico visibile in lista
- [ ] Import da copia-incolla Excel crea il nucleo correttamente
- [ ] Ricerca per codice fiscale, numero tessera, nome/cognome funziona

---

## Fase 4 — Modulo Distribuzione

### Schema Supabase da creare:
- [ ] Tabella `distribuzioni` (id, nucleo_id, centro, data, operatore_id, note)

### Regole Dati e Affidabilità:
- [x] Definisci `codice_fiscale` e `numero_tessera` come chiavi univoche operative per identificare il nucleo avente diritto
- [ ] Prevedi controllo di "pulizia" dati prima della registrazione consegne (evita duplicati/incongruenze)
- [ ] Verifica che ogni consegna sia attribuita in modo univoco al nucleo corretto
- [ ] Conferma che la qualità dei dati garantisca affidabilità della reportistica

### Componenti:
- [x] Crea `src/pages/distribuzione/Distribuzione.tsx`
  - [x] Selezione centro (Pombio / Duomo / Medassino / San Rocco)
  - [x] Modello interfaccia "Elenco Rapido" senza sotto-menu complessi
  - [x] Lista famiglie del centro con selezione diretta del nominativo
  - [x] Registrazione consegna one-click sulla data corrente
  - [x] Filtro dinamico istantaneo per zona, stato tessera, codice fiscale
  - [x] Blocco automatico: nucleo già servito nella stessa settimana
  - [x] Salvataggio distribuzione (solo tracciamento in Fase 4)
  - [x] Ordinamento alfabetico per cognome del tesserato
- [x] Crea `src/hooks/useDistribuzione.ts`

**Verifiche:**
- [ ] Distribuzione blocca doppio ritiro settimanale
- [ ] Integrazione giacenze demandata a Fase 5 (fuori scope Fase 4)
- [ ] Lista ordinata per cognome
- [ ] Ricerca/filtro dinamico restituisce risultati corretti in tempo reale
- [ ] Registrazione one-click riduce i passaggi operativi rispetto al flusso con apertura singole schede
- [ ] Tempo medio di servizio per famiglia ridotto grazie al flusso snello

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
