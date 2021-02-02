// WESTMINTER

const os         = require('os');
const path       = require('path');
const ejs        = require('ejs');
const express    = require('express');
const bodyParser = require('body-parser');
const hederaApi  = require('./hedera-api');

function hit(action) { console.log(new Date(), action); }

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);

app.get('/', (req, res) => { res.render('index.html'); });
app.get('/hedera', (req, res) => { res.render('hedera.html'); });
app.get('/hedera/account', async (req, res) => { 
    hit('account');
    let act = await hederaApi.newAccount();
    res.writeHead(200, {'Content-Type': 'application/json'}); 
    res.end(JSON.stringify(act));
});
app.get('/hedera/gethbarprice', async (req, res) => { 
    let data = await hederaApi.getHbarPrice();
    res.writeHead(200, {'Content-Type': 'application/json'}); 
    res.end(data);
});
app.get('/hedera/latestprices', async (req, res) => { 
    let data = await hederaApi.getLatestPrices();
    res.writeHead(200, {'Content-Type': 'application/json'}); 
    res.end(data);
});
app.get('/hedera/getusertokens', async (req, res) => { 
    let data = await hederaApi.getUserTokens();
    res.writeHead(200, {'Content-Type': 'text/plain'}); 
    res.end(data);
});
app.get('/hedera/addusertoken/:tid/:sym/:name/:decs/:supply/:price', async (req, res) => { 
    hit('addtoken');
    let tokenId = req.params.tid;
    let symbol  = req.params.sym;
    let name    = req.params.name;
    let decs    = req.params.decs;
    let supply  = req.params.supply;
    let price   = req.params.price;
    let ok = await hederaApi.addUserToken(tokenId, symbol, name, decs, supply, price);
    res.end(ok?'OK':'ERROR');
});
app.get('/hedera/buy', async (req, res) => { 
    let actid = req.query.actid;
    let token = req.query.token;
    let txid  = req.query.txid;
    hit(`buy ${actid} ${token} ${txid}`);
    let info = await hederaApi.buyToken(actid, token, txid);
    res.writeHead(200, {'Content-Type': 'application/json'}); 
    res.end(JSON.stringify(info));
});
app.get('/hedera/sell', async (req, res) => { 
    let actid = req.query.actid;
    let token = req.query.token;
    let txid  = req.query.txid;
    hit(`sel ${actid} ${token} ${txid}`);
    let info = await hederaApi.sellToken(actid, token, txid);
    res.writeHead(200, {'Content-Type': 'application/json'}); 
    res.end(JSON.stringify(info));
});
//app.get('/hedera/credentials', (req, res) => { 
//	let act = {
//		accountId:  process.env.OPERATORID,
//		privateKey: process.env.OPERATORKEY
//	}
//    res.writeHead(200, {'Content-Type': 'application/json'}); 
//	res.end(JSON.stringify(act));
//});
app.get('/*', (req, res) => { res.end('NOTFOUND'); }); // Catch all

let now = new Date();
console.log(now, 'WestMinter server is running');
app.listen();

// END