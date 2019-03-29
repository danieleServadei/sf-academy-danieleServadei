
# SF-Academy Website [![CI status](http://img.shields.io/badge/gandalf-approved-61C6FF.svg)](https://www.youtube.com/watch?v=Sagg08DrO5U)

# Recap

* [Esempio](#esempio) - Prova il sito, con utenti già creati.
* [Requirements](#requirements) - Cosa fare prima dell'installazione.
* [Installazione](#installazione) - Installazione guidata del sito web.
* [Info](#info) - Informazioni su come funziona il sito, l'API etc.
* [Solidity](#solidity) - Informazioni sullo Smart Contract.

# Esempio

Link: [clicca qui](http://34.229.226.252).

**Utenti** già creati, per testare il sito (email:password)
- daniele@gmail.com:daniele

**Investitori**, con rispettivamente $10K, $25K, $100K
- investor1@gmail.com:investor1
- investor2@gmail.com:investor2
- investor3@gmail.com:investor3

Per provare il sito, visitare il [login](http://34.229.226.252/login) ed eseguire l'accesso con una delle credenziali sopracitate. Per più informazioni sulle funzionalità del sito, guarda: [Info](#info).

# Requirements

- Avere un computer e possibilmente una connessione internet.
- Avere un account su AWS.

**Windows**
- Putty (o programmi simili) per potersi successivamente connettere all'istanza di EC2.
- Comprare un Mac

# Installazione

## Key-Pair

Prima di tutto, dobbiamo generare una **key-pair** su AWS, con nome
```
sf-academy-key-pair
```
Visita [la guida ufficiale](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html#having-ec2-create-your-key-pair) se ti serve un aiuto.

![Key Pair](https://i.imgur.com/39q1LGx.png)

## CloudFormation

Dirigiti poi su [CloudFormation](https://console.aws.amazon.com/cloudformation/home)

![CloudFormation](https://i.imgur.com/ZJrEL5C.png)

Clicca su **Create Stack**, spunta l'opzione **Specify an Amazon S3 template URL** e incolla questo link

```
https://s3.amazonaws.com/cf-templates-1rts0b6b28ais-us-east-1/2019087INq-sf-academyzcevsxpti5g
```

Questo creerà un istanza di EC2 e un DataBase (MySQL, utilizzando RDS)
La procedura potrebbe richiedere qualche minuto, aspetta che tutto si concluda e che appaia `CREATE_COMPLETE`

## Amazon RDS

Una volta completato, clicca sullo stack, in seguito poi clicca su **Resources** e sul link del **Physical ID** di **DatabaseInstance**

![RDS](https://i.imgur.com/8KVnp4E.png)

Da questa pagina copia l'**Endpoint**, salvalo da qualche parte perchè ci servirà successivamente, quando utilizzeremo Docker.

## Amazon EC2

Con il procedimento di prima, accedi alla pagina della **Istanza di EC2** appena creata cliccando sul **Physical ID** di **AppNode**

![EC2](https://i.imgur.com/dsdNmfn.png)

Da questa pagina Copia l'**IPv4 Public IP** _(34.229.226.252)_
Ora accediamo all'istanza, apri il **Terminale** (o Putty, su Windows), recati nella cartella in cui hai la key-pair _(sf-academy-key-pair.pem)_ ed esegui il seguente comando:

```
ssh -i sf-academy-key-pair.pem ubuntu@<IP EC2 ISTANCE>
```

Inserendo l'IP che abbiamo trovato prima.

![EC2 SSH](https://i.imgur.com/tf6QXVN.png)

L'istanza di EC2 ha già installato **Git**, **NPM**, **Docker** e **Docker Compose**
Ora dobbiamo configurare l'account di github, per farlo usiamo i seguenti comandi:
```
git config --global user.name "<YOUR_USERNAME>"
```
```
git config --global user.email "<YOUR_EMAIL@EXAMPLE.COM>"
```

I prossimi passi **potrebbero cambiare** in base alla repo che cloni. Se la repo che cloni ha già nel master gli update del branch docker, non serve fare `git checkout docker`.

Successivamente cloniamo la repo
```
git clone https://github.com/danieleServadei/sf-academy-danieleServadei.git
```

Entriamo nella cartella della repo clonata
```
cd sf-academy-danieleServadei
```

E ci muoviamo nel branch **Docker**
```
git checkout docker
```

![Docker](https://i.imgur.com/3DEE28c.png)

Ora dobbiamo modificare il file **docker-compose.yml** inserendo l'endpoint di RDS.

```
nano docker-compose.yml
```

![Nano](https://i.imgur.com/8JW5JSG.png)

Modifichiamo quindi il campo **RDS ENDPOINT** con il link che abbiamo trovato prima. 

E' possibile anche modificare le altre variabili, se si hanno. Se invece si vogliono tenere quelle di default (per testare l'applicativo), mantenerle invariate. Sono solo credenziali di test, quindi non causano alcun problema di sicurezza.

_N.B. quando creato con CloudFormation, il database si crea automaticamente con db name, username e password **sfacademy**. Per modificarlo bisogna recarsi nell'area delle impostazioni di RDS._

Salviamo il file.

```
ctrl + x
y
invio
```

## Avviamo la WebAPP

Per avviare l'app utilizziamo **docker-compose**

```
sudo docker-compose up -d
```

La flag **-d** ci permette di avviare l'app in background.
Possiamo poi vedere i daemons in esecuzione utilizzando il comando

```
sudo docker ps
```

![Docker Compose](https://i.imgur.com/iUIiJhJ.png)

Ora la nostra WebAPP è in esecuzione, visitabile dall'**IP** di **EC2**

![SF-ICO](https://i.imgur.com/EGs762G.jpg)

## Configurazione

Non abbiamo ancora del tutto finito, ci rimane da configurare il DataBase.
Per farlo, basta semplicemente visitare un endpoint specifico, che creerà in automatico le tabelle necessarie.

```
http://<EC2-PUBLIC-IP>/api/utils/setup
```

![DB](https://i.imgur.com/BL8BpKT.png)

Finito! Puoi tornare all'index ed utilizzare il sito, normalmente!
Per maggiori informazioni su come funziona [clicca qui](#info).

# Info

## Links

[Utils](#utils) - Impostare Investors, Smart Contract tokens available etc.

[Struttura](#struttura) - Come è strutturata l'API e il BackEnd.

[Funzionamento](#funzionamento) - Come funziona il sito, cosa si può fare.


## Utils

### Investitori
Imposta i tre **investitori**, con rispettivamente $10K, $25K, $100K.
Dopo aver creato i tre investitori, utilizzando la pagina di **register**, visita il seguente EndPoint per aggiornare il loro wallet

```
http://<EC2-PUBLIC-IP>/api/utils/investors/<WALLET2>,<WALLET2>,<WALLET3>
```

### TokensAvailable

Imposta i **tokensAvailable** dello smart contract, dal seguente EndPoint

```
http://<EC2-PUBLIC-IP>/api/utils/set/<AMOUNT>
```

### Burn  Tokens

Puoi eliminare dei tokens da un qualunque wallet, visitando

```
http://<EC2-PUBLIC-IP>/api/utils/burn/<WALLET>/<QUANTITY>
```

## Struttura

### Frontend

Il Frontend è situato nella directory `/pages`

![Frontend](https://i.imgur.com/EZRTZ2Q.png)

**8** directory

_N.B. non andrò ad approfondire il frontend (CSS.. ) in quanto è per un buon 80% googlato, approfondirò il backend :D_
```
- app-assets
- assets
- assets-dashboard
- css-404
- fonts-404
- js
```

Una delle quali con i file javascript (`/js`),  utilizzati per mandare le richieste al backend (vedi [API](#api)).

Ci sono poi i file delle pagine .html
```
- dashboard
- login
- register
- 404
- buy-ico
- index
- shop
- wallet
- profile
```

### Backend

Il Backend utilizza
- **Express** per servire i file .html statici.
- **Express Session** per mantenere la sessione tra le varie pagine, consentendo l'autenticazione.
- **html** come view engine.
- **MySQL** come database.
- **Bcrypt** per hashare le password, prima di metterle nel database (con salt e rounds).
- **Functions** funzioni utilizzate, in un file a parte.
- **Contract** le funzioni per mandare le richieste allo smart contract

![Backend](https://i.imgur.com/0ZEwkkw.png)

Le credenziali sono prese dal file **config.js**:

```javascript
module.exports = {
  config: {
    mysqlHost: process.env.mysqlHost,
    mysqlUser: process.env.mysqlUser,
    mysqlPassword: process.env.mysqlPassword,
    mysqlDB: process.env.mysqlDB,
    salt: process.env.bcryptSalt,
    rounds: 10,
    provider: process.env.provider,
    contractAddress: process.env.contractAddress,
    privateKey: process.env.privateKey,
    defaultAccount: process.env.defaultAccount,
    etherscanLink: process.env.etherscanLink,
    ETHInUSD: 135, // utility
    USDinETH: 0.0075 // utility
  }
};
```

Queste sono state impostate all'avvio dell'app con docker, dal file **docker-compose.yml** nella voce `environment`

![docker-compose-yml](https://i.imgur.com/ouVXTKN.png)

La porta su cui l'applicazione viene avviata è la `3000`, ma grazie a docker possiamo mapparla sulla porta `80`
```
ports:
  - 80:3000
```

### API

Struttura dell'API
```javascript
GET
  - /api/user // Informazioni dell'utente (name, email..)
  - /api/user/transactions // Transazioni dell'utente (shop)
  - /api/shop // Prodotti disponibili nello shop
  - /api/balance // Token balance dell'utente
  - /api/ethereum/balance // ETH balance dell'utente

POST
  - /api/login // Effettuare il Login
  - /api/register // Effettuare il Register
  - /api/updateProfile // Aggiornare il proprio profilo
  - /api/deposit // Depositare ETH
  - /api/addFounds // Aggiungere tokens al proprio wallet
  - /api/order // Acquistare un prodotto nello shop
  - /api/transfer // Trasferire tokens tra due wallet
  - /api/burn // Eliminare tokens dal proprio wallet
```

Esempio di **Richiesta** `POST`

```javascript
fetch(`/api/register`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    // Dati del register, che vengono passati nel body
    body: JSON.stringify({
      username: name,
      password: password,
      email: email
    })
  })
  .then((res) => {
    res.json().then((response) => {
      // Response della richiesta
    });
  })
  .catch((err) => {
  // Errore di fetch
    console.log(`Fetch Error :-S ${err}`);
  });
```

Esempio di **Richiesta** `GET`

```javascript
fetch(`/api/balance`)
.then((res) => {
  res.json().then((response) => {
    // Response della Richiesta
  });
})
.catch((err) => {
  console.log(`Fetch Error :-S ${err}`);
});
```

Esempio di **Response**

```javascript
{
  code: 200,
  message: "Order created successfully."
}
```

Il messaggio può variare, a seconda dell'EndPoin, es:

```javascript
{
  code: 200,
  balance: 3500
}
```

### Funzionamento del Sito

```javascript
- login // Esegui l'autenticazione
- register // Registra un account sul sito
- dashboard // Visualizza le tue transazioni recenti, e il tuo balance
- 404 // 404 page
- buy-ico // acquista tokens
- shop // visualizza i prodotti che si possono comprare
- wallet // visualizza le info del tuo wallet e wallet ETH
- profile // visualizza le info del tuo profilo, cambia password etc.
```

Come **comprare tokens**

![buy-ico](https://i.imgur.com/mxntrQy.png)

Per comprare dei tokens, prima di tutto devi depositare degli **ETH** nel tuo wallet.
Visita `/buy-ico`, clicca su **Deposit**, inserisci una quantità di ETH e premi **Deposit**. Gli ETH saranno depositati immediatamente sul tuo wallet.

Ora, sempre sulla pagina `/buy-ico`, clicca su **Buy** e usa il convertitore da **SF** a **ETH** per scegliere una quantità di token da comprare, poi premi **Buy**.
I token richiedono un po' di tempo per essere accreditati nel tuo wallet.

Come creare **prodotti** nello **shop** o **comprarli**

![shop](https://i.imgur.com/jjQ45G2.png)

Per **comprare** un ordine, basta cliccarci sopra e successivamente cliccare **purchase**. Puoi comprare solo ordini che hanno lo Status `available`

Per **creare** un ordine, clicca il bottone **Create** in alto a destra, inserisci il numero di **Token** che vuoi vendere e il loro **prezzo**, clicca quindi **Create**.

Per **modificare il tuo profilo** visita la pagina `/profile`

![profile](https://i.imgur.com/WDJ967n.png)

## Solidity

Una parte fondamentale dell'applicazione è lo **Smart Contract**, per gestire i balance degli utenti, consiste infatti in un token realizzato on-top della blockchain ethereum.

Abbiamo tre file relativi a solidity, presenti nella directory `/solidity`:

```
- abi.json
- contract.js
- contract.sol
```

**abi.json** è uno schema di codifica dei dati _(data encoding scheme)_ che include gli stessi tipi di dati e funzioni definite nello Smart Contract.

in **contract.js** troviamo le funzioni che ci permettono di mandare le richieste al contratto, esempio:
```javascript
// Crea un nuovo wallet
const createWallet = (wallet) => {
  // Trasforma la stringa del wallet
  wallet = toHex(wallet);
  return new Promise((resolve, reject) => {
  // Accede al metodo del contratto
    const create = contract.methods.createWallet(wallet);
    // Manda la transazione
    resolve(sendSignTransaction(create));
  });
}
```

**contract.sol** invece è puramente a scopo dimostrativo: non ha nulla a che fare con lo smart contract in quanto esso è già in esecuzione sulla rete di Rinkeby.
Per poterlo vedere, l'address è: `0x820a64187479c4ae4f502020561192c4d1920f30`

![remix](https://i.imgur.com/UGBU2qR.png)

Lo smart contract presenta la libreria **SafeMath**, utilizzata per eseguire i calcoli (addizioni, moltiplicazioni etc) senza rischiare un overflow.

Successivamente c'è il contratto ICO, la parte principale.
- **tokensAvailable** è il numero di Token disponibili nel contratto
- **balance** `mapping (bytes => uint256) balance` contiene la key `wallet`, che ha un valore numerico `uint256` contenente il balance di token dell'utente. Esempio: `balance[<WALLET>]` restituisce `3500` 
- **Funzioni** `(createWallet, walletBalance.. )` che servono per il funzionamento del contratto, trasferire tokens tra più wallet, rimuovere o aggiungere tokens etc.

# Credits

**Autore** [danieleServadei](https://github.com/danieleServadei)

**Progetto** Sf-Academy