Il gestionale richiesto per sostituire e unificare i complessi fogli Excel dovrà essere strutturato partendo da una pagina iniziale divisa in tre macro-sezioni: Utenti, Magazzino e Stampe
.
Ecco come si vuole sviluppare ciascuna funzionalità nel dettaglio:
1. Gestione Utenti (Nuclei Familiari)
Struttura base: L'applicativo dovrà prevedere le funzioni per "creare", "modificare" e "archiviare" i nuclei familiari
. L'archiviazione è pensata per le famiglie che non rinnovano più la tessera
.
Ricerca e anagrafica: Il sistema dovrà permettere di richiamare i nuclei cercando per codice fiscale, numero di tessera, oppure per nome e cognome
.
Titolare vs Capofamiglia: In fase di inserimento di un nuovo nucleo, il programma chiederà se il titolare della tessera coincide con il capofamiglia; se si tratta di due persone diverse (es. viene la moglie ma il capofamiglia è il marito), il gestionale permetterà di inserire i dati anagrafici di entrambi in modo separato
.
Dati e scadenze: Dovranno essere inseriti i dati anagrafici (senza dover richiedere dettagli complessi ai familiari aggiuntivi), le informazioni della tessera (numero e scadenza vecchia e nuova), e la zona di ritiro associata (Pombio, Duomo, Medassino, San Rocco)
.
Automazione dei rinnovi: Per semplificare il lavoro, il 1° gennaio il gestionale dovrà automaticamente impostare tutti i tesserati dello storico come "non rinnovati"
. I volontari potranno poi richiamare il singolo nucleo e confermarne il rinnovo aggiornando la scadenza e il numero di tessera con un click
.
Importazione semplificata (Copia-Incolla): Per non dover digitare a mano centinaia di anagrafiche vecchie, si è richiesta un'opzione che permetta di copiare una riga dei vecchi fogli Excel e incollarla nel gestionale, in modo che il software estrapoli i dati e popoli i campi automaticamente creando il nucleo
.
2. Magazzino e Distribuzione
Carichi e scarichi: Il magazzino sarà gestito distinguendo le merci in entrata (carichi), registrate per quantità, e le merci distribuite (scarichi), calcolando di conseguenza le rimanenze in tempo reale
.
Velocizzazione della distribuzione: Invece di dover scrivere le croci su fogli separati, nella sezione degli scarichi sarà possibile selezionare un centro di consegna (ad esempio, Pombio) e visualizzare subito la lista delle famiglie associate
. I volontari potranno semplicemente spuntare le famiglie che ritirano il pacco quel giorno, aggiornando così immediatamente il magazzino e le anagrafiche
.
3. Stampe e Reportistica
Il sistema genererà report e stampe personalizzabili, mostrando ad esempio tutti i nuclei attivi ("non archiviati")
. Questi elenchi potranno essere stampati in ordine alfabetico totale, oppure suddivisi in ordine alfabetico in base allo specifico centro di destinazione in cui le famiglie ritirano la merce
.
4. Condivisione e Accessibilità
Per superare i problemi dell'attuale sistema (come i file in sola lettura, le sovrascritture accidentali o le incompatibilità di formato con Google Drive o OneDrive), il gestionale verrà ospitato su un server online o un servizio di hosting (un "posticino" virtuale accessibile in rete)
.
Questo permetterà ai diversi volontari di collegarsi al sistema e lavorare simultaneamente da più computer usando le stesse informazioni sempre aggiornate in tempo reale
