// HEDERA

const HBAR  = 100000000;
const DEXID = '0.0.252932'; // TREASURY ID

let session = {
	network: 'TESTNET',
	hbar   : '1.00',
	wallet : null,
	admin  : { accountId: null, privateKey: null },
	user   : { accountId: null, privateKey: null },
	token  : { tokenId: null, name: null, symbol: null, decs: 8, supply: 0 },
	trade  : '0.0.0',
	price  : 1.0,
	buying : true,
	mobile : false,
	refresh: true
}

let tokens = {
	'0.0.271860': { symbol: 'USD',  name: 'Dollar',     decs: 8, supply:    100000000000000, price: 0.0, quote: true  },
	'0.0.271861': { symbol: 'EUR',  name: 'Euro',       decs: 8, supply:    100000000000000, price: 0.0, quote: true  },
	'0.0.271862': { symbol: 'CNY',  name: 'Yuan',       decs: 8, supply:   1000000000000000, price: 0.0, quote: true  },
	'0.0.271863': { symbol: 'JPY',  name: 'Yen',        decs: 8, supply:  10000000000000000, price: 0.0, quote: true  },
	'0.0.271864': { symbol: 'INR',  name: 'Rupee',      decs: 8, supply:  10000000000000000, price: 0.0, quote: true  },
	'0.0.271865': { symbol: 'BTC',  name: 'Bitcoin',    decs: 8, supply:       100000000000, price: 0.0, quote: false },
	'0.0.271866': { symbol: 'ETH',  name: 'Ethereum',   decs: 8, supply:      1000000000000, price: 0.0, quote: false },
	'0.0.271867': { symbol: 'DOT',  name: 'Polkadot',   decs: 8, supply:    100000000000000, price: 0.0, quote: false },
	'0.0.271868': { symbol: 'ADA',  name: 'Cardano',    decs: 8, supply:   1000000000000000, price: 0.0, quote: false },
	'0.0.271869': { symbol: 'LTC',  name: 'Litecoin',   decs: 8, supply:     10000000000000, price: 0.0, quote: false },
	'0.0.271870': { symbol: 'AAPL', name: 'Apple',      decs: 8, supply:      1000000000000, price: 0.0, quote: false },
	'0.0.271871': { symbol: 'AMZN', name: 'Amazon',     decs: 8, supply:       100000000000, price: 0.0, quote: false },
	'0.0.271872': { symbol: 'GOOG', name: 'Google',     decs: 8, supply:       100000000000, price: 0.0, quote: false },
	'0.0.293668': { symbol: 'NFLX', name: 'Netflix',    decs: 8, supply:      1000000000000, price: 0.0, quote: false },
	'0.0.293669': { symbol: 'TSLA', name: 'Tesla',      decs: 8, supply:      1000000000000, price: 0.0, quote: false },
	'0.0.271877': { symbol: 'GLD',  name: 'Gold',       decs: 8, supply:      1000000000000, price: 0.0, quote: false },
	'0.0.271878': { symbol: 'SLV',  name: 'Silver',     decs: 8, supply:       100000000000, price: 0.0, quote: false },
	'0.0.271879': { symbol: 'WHT',  name: 'Wheat',      decs: 8, supply:       100000000000, price: 0.0, quote: false },
	'0.0.271880': { symbol: 'CRN',  name: 'Corn',       decs: 8, supply:      1000000000000, price: 0.0, quote: false },
	'0.0.271881': { symbol: 'SGR',  name: 'Sugar',      decs: 8, supply:      1000000000000, price: 0.0, quote: false },
	'0.0.271882': { symbol: 'TST',  name: 'Test Token', decs: 8, supply:    100000000000000, price: 0.0, quote: false },
	'0.0.271883': { symbol: 'LUV',  name: 'Love All',   decs: 8, supply:    100000000000000, price: 0.0, quote: false },
	'0.0.271884': { symbol: 'SUN',  name: 'Sun Rays',   decs: 8, supply:    100000000000000, price: 0.0, quote: false },
	'0.0.271885': { symbol: 'BAR',  name: 'Open Bar',   decs: 8, supply:    100000000000000, price: 0.0, quote: false },
	'0.0.271886': { symbol: 'RUM',  name: 'Rum Bottle', decs: 8, supply:    100000000000000, price: 0.0, quote: false }
};


//---- UTILS

function $(id) { return document.getElementById(id); }

function isOnline(){ 
	if(navigator.onLine){ return true; }
	alert('No internet connection'); 
	return false; 
}

async function webget(url) {
	console.log('Fetch', url);
	let res, inf;
	try {
		res = await fetch(url, { method: 'get' });
		inf = await res.json();
	} catch(ex) {
		console.log('Error', ex)
		inf = { error: ex.message };
	}
	return inf;
}

function testPrivateKey(key) {
	let ok = true;
	try { Hedera.PrivateKey.fromString(key); } catch(ex){ ok = false; }
	return ok;
}

function decOrInt(num, decs=8) { 
	decs = parseInt(num)==num ? 0 : decs;
	let opt = {useGrouping:false, maximumFractionDigits:decs};
	let res = Number(num).toLocaleString('en-us', opt); 
	return res;
}

function money(num, decs=8, dim=false) { 
	let opt = {minimumFractionDigits:decs, maximumFractionDigits:decs};
	let res = Number(num).toLocaleString('en-us', opt); 
	if(dim){
		if(res.indexOf('.')>=0){ res = res.replace('.', '<i class="dec">.')+'</i>'; }
	}
	return res;
}

function validNumber(text='') {
    let number, value;
    //let sep = Intl.NumberFormat(navigator.language).format(1000).substr(1,1) || ',';
    let sep = ',';
    if(sep==','){ value = text.replace(/\,/g,''); }
    else if(sep=='.'){ value = text.replace(/\./g,'').replace(',','.'); }
    try { number = parseFloat(value) || 0.0; } catch(ex){ console.log(ex); number = 0.0; }
    return number;
}

function checkMobile(){ 
	session.mobile = (document.body.clientWidth<=720);
}


//---- Methods

function setColorTheme(mode='dark-mode') {
	document.body.className = mode;
	$('theme-icon').title   = (mode=='dark-mode')?'Light mode':'Dark mode'; 
	$('theme').className    = (mode=='dark-mode')?'lighter':'darker'; 
}

function swapColorTheme() {
	let mode = document.body.className;
	document.body.className = (mode=='dark-mode')?'light-mode':'dark-mode'; 
	$('theme').title        = (mode=='dark-mode')?'Dark mode':'Light mode'; 
	$('theme').className    = (mode=='dark-mode')?'lighter':'darker'; 
}

//async function getBalance() {
//    let res = await session.wallet.getBalance(session.user.accountId);
//    let bal = res.tbar / HBAR;
//    $('balance').innerHTML = money(bal, 8, true);
//}

async function getBalances() {
	let tmp = '<tr id="mytoken-{tid}"><td class="mytokensym">{sym}</td><td class="mytokenid">{tid}</td><td class="mytokenbal">{bal}</td></tr>'
	let ldn = '<tr><td class="mytokensym">Loading tokens...</td><td class="mytokenid"></td><td class="mytokenbal"></td></tr>'
	let emp = '<tr><td class="mytokensym">No tokens</td><td class="mytokenid"></td><td class="mytokenbal"></td></tr>'
    let tbl = $('list-mytokens');
    let data = await session.wallet.getBalance(session.user.accountId);
    if(data.error){
    	$('balance').innerHTML = 'Not found'
		tbl.tBodies[0].innerHTML = emp;
    } else {
    	let bal = data.tbar / HBAR;
    	$('balance').innerHTML = money(bal, 8, true);
    	// tokens
    	let html = '';
   		tbl.tBodies[0].innerHTML = ldn;
    	for(var tknId in data.tokens){
    		let tbal = data.tokens[tknId];
    		//console.log(tknId, tbal);
    		// Add token to list
    		let info = await session.wallet.getTokenInfo(tknId);
    		//console.log(info);
    		let val = tbal / (10**info.decimals);
    		let row = tmp.replace(/{tid}/g, info.tokenId)
    					 .replace('{sym}',  info.symbol)
    					 .replace('{bal}',  money(val, 8, true));
    		//console.log('Row', row);
    		html += row;
    	}
    	if(Object.keys(data.tokens).length){
    		tbl.tBodies[0].innerHTML = html;
    	} else {
			tbl.tBodies[0].innerHTML = emp;
    	}
    }
}

async function getTokenBalance() {
    let bal = await session.wallet.getTokenBalance(session.user.accountId);
    console.log('Balance', bal);
    $('balance').innerHTML = bal;
}

async function reloadTokenPrices() {
	console.log('Reloading token prices');
	loadTokenPrices().then(()=>{
		selectToken(0, '0.0.271860'); // USD
	});
}

async function loadTokenPrices() {
	let prices = await webget('/hedera/latestprices');
	console.log('Prices', prices);
	let now = (new Date()).getTime();
	let upd = (new Date(prices.updated)).getTime();
	let dif = now - upd;
	let m10 = 10*60*1000; // ten minutes
	console.log('Diff', now, upd, dif, m10, dif>m10?'OK':'NO');
	if(dif>m10 && session.refresh){ 
		console.log('Refresh prices');
		session.refresh = false;
		setTimeout(reloadTokenPrices, 4000);
		return;
	}
	for(var tid in prices.tokens){
		if(tokens[tid]){ tokens[tid].price = prices.tokens[tid]; }
	}
	console.log('Tokens', tokens);
	// Update token price in tables
	let decs = session.mobile?2:4;
	for(var tid in prices.tokens) {
		if(tid=='HBAR/USD') { continue; }
		let row = $(tid);
		if(!row){ continue; }
		row.dataset.price = prices.tokens[tid];
		row.cells[2].innerHTML = money(prices.tokens[tid], decs, true);
	}
}
 
async function loadUserTokens() {
	let url  = '/hedera/getusertokens';
	let res  = await fetch(url, {method:'get'});
	let txt  = await res.text();
	let list = txt.split('\n');
	let html = '';
	let decs = session.mobile?2:4;
	//console.log('List', list);
	for (var i = 1; i < list.length; i++) {
		let line     = list[i];
		let token    = line.split(',');
		let tokenId  = token[0];
		let symbol   = token[1];
		let name     = token[2];
		let decimals = token[3];
		let supply   = money(token[4], 0);
		let pricex   = token[5];
		let price    = money(token[5], decs, true);
		let tmp = `<tr id="${tokenId}" data-price="${pricex}"><td>${symbol}</td><td>${name}</td><td>${price}</td><td>${supply}</td><td>${tokenId}</td><td><img class="linker" src="/hedera/icon-unlink.png" onclick="onLink()" title="Associate token"></td></tr>`;
		html += tmp;
	}
	$('list-users').tBodies[1].innerHTML = html;
}	

async function onConnect() {
	if(!isOnline()) return;
	if(!$('acctid').value)  { alert('Account Id is required');  return; }
	if(!$('acctkey').value) { alert('Private key is required'); return; }
	if(!testPrivateKey($('acctkey').value)) { alert('Private key is invalid'); return; }
    session.user.accountId  = $('acctid').value;
    session.user.privateKey = $('acctkey').value;
	session.wallet = new Wallet(session.user.accountId, session.user.privateKey);
	$('transfer-source').value = session.user.accountId;
	$('myacct').innerHTML = 'CONNECTED';
	//setTimeout(function(){$('myacct').innerHTML='CONNECT'; $('acctkey').value='';}, 3000);
    getBalances();
}

async function onGenerate() {
	if(!isOnline()) return;
	$('newacct').disabled  = true;
	$('newacct').innerHTML = 'WAIT';
	let ok = true;
	try {
		let res = await fetch('/hedera/account', {method:'get'});
		let act = await res.json();
		if(act.error){ 
    		console.log("Error:", act.error);
			alert('Error creating account\n'+act.error);
			ok = false;
		} else {
			session.user = act;
    		console.log("User:", session.user);
		}
	} catch(ex) {
    	console.log("Error:", ex);
		alert('Error creating account\n'+ex.message);
		ok = false;
	}
	if(ok){
	    $('acctid').value  = session.user.accountId;
	    $('acctkey').value = session.user.privateKey;
		$('transfer-source').value = session.user.accountId;
		session.wallet = new Wallet(session.user.accountId, session.user.privateKey);
	    getBalances();
	}
	$('newacct').innerHTML = 'GENERATE';
	$('newacct').disabled  = false;
}

function transferStatus(txt, sec) {
	$('transfer-status').innerHTML = txt;
	if(sec){ setTimeout(function(){$('transfer-status').innerHTML='';}, sec*1000); }
}

async function onTransfer() {
	if(!isOnline()) return;
	if(!session.wallet || !session.wallet.isConnected){ transferStatus('Wallet not connected', 5); return; }
	let source  = session.wallet.accountId;
	let destin  = $('transfer-target').value;
	let tokenId = $('transfer-token').value;
	let amount  = $('transfer-amount').value;
	$('transfer').disabled  = true;
	$('transfer').innerHTML = 'WAIT';
	transferStatus('Processing transaction...');
	let status  = '';
	let tinybar = 0;
	let result  = null;
	if(tokenId){
		let info = await session.wallet.getTokenInfo(tokenId);
		let decs = info.decimals;
		tinybar  = amount * 10**decs;
		result   = await session.wallet.tokenTransfer(destin, tinybar, tokenId);
	} else {
		tinybar = amount * HBAR;
		result  = await session.wallet.transfer(destin, tinybar);
	}
	//console.log('Transfer result', result);
	if(result.error) { status = 'Error: '+result.error; }
	else { status = result.status+' <a href="https://testnet.dragonglass.me/hedera/search?q='+result.hash+'" target="_blank">(Transaction)</a>'; }
	transferStatus(status);
	$('transfer').innerHTML = 'TRANSFER';
	$('transfer').disabled  = false;
	getBalances();
}

function calcBuy() {
	let amount = validNumber($('trade-amt-buy').value);
	let price  = $('trade-price').value;
	if(session.buying){ total = amount * price; }
	else { total  = amount / price; }
	$('trade-amt-sell').value = decOrInt(total, 8);
}

function calcSell() {
	let amount = validNumber($('trade-amt-sell').value);
	let price  = $('trade-price').value;
	if(session.buying){ total = amount / price; }
	else { total  = amount * price; }
	$('trade-amt-buy').value = decOrInt(total, 8);
}


function tradeStatus(txt, sec) {
	$('trade-status').innerHTML = txt;
	if(sec){ setTimeout(function(){$('trade-status').innerHTML='';}, sec*1000); }
}

async function onTrade() {
	if(!isOnline()) return;
	if(!session.wallet || !session.wallet.isConnected){ tradeStatus('Wallet not connected',5); return; }
	console.log('Trade', session.buying?'BUY':'SELL', session.trade, 'Price', session.price);
	if(session.buying){
		buyTokens(session.trade);
	} else {
		sellTokens(session.trade);
	}
}

async function showTrade(msg, cap='TRADE', disabled=false) {
	$('trade').disabled  = disabled;
	$('trade').innerHTML = cap;
	tradeStatus(msg);
}

async function buyTokens(tokenId) {
	console.log('Buying', tokenId);
	showTrade('Processing transaction...','WAIT',true);
	let source = session.wallet.operatorId;
	let destin = DEXID;
	let amount = validNumber($('trade-amt-sell').value);
	let result = null;
	let status = '';
	let tinybar = 0;
	try {
		let ok = await session.wallet.isTokenAssociated(tokenId);
		if(!ok){ ok = await session.wallet.tokenAssociate(tokenId); }
		if(!ok){ showTrade('Error: Token not associated'); return; }
		//let info = await session.wallet.getTokenInfo(tokenId);
		//let decs = info.decimals;
		tinybar = amount * HBAR;
		console.log('TRANSFER', amount, 'HBAR', 'from', source, 'to', destin);
		result = await session.wallet.transfer(destin, tinybar);
		if(result.status=='SUCCESS'){
			console.log('Transfer OK');
			let txid = result.txid;
			let url  = `/hedera/buy?actid=${source}&token=${tokenId}&txid=${txid}`;
			let rex  = await webget(url);
			if(rex.error){
				console.log('Trade error', rex);
				showTrade(rex.error);
				return; 
			} else {
				console.log('BOUGHT', amount, tokenId);
				showTrade('SUCCESS!');
				getBalances();
			}
		} else {
			console.log('Trade error', result);
			showTrade('Trade error: '+result.error);
			return; 
		}
	} catch(ex){
		console.log('Trade error', ex);
		showTrade('Trade error: '+ex.message);
		return; 
	}
}

async function sellTokens(tokenId) {
	console.log('Selling', tokenId);
	showTrade('Processing transaction...','WAIT',true);
	let source = session.wallet.operatorId;
	let destin = DEXID;
	let amount = validNumber($('trade-amt-sell').value);
	let result = null;
	let status = '';
	let tinybar = 0;
	try {
		let ok = await session.wallet.isTokenAssociated(tokenId);
		if(!ok){ showTrade('Error: Token not associated'); return; }
		//let info = await session.wallet.getTokenInfo(tokenId);
		//let decs = info.decimals;
		tinybar = amount * HBAR; // All tokens are 8 decs else use token.decimals
		console.log('TRANSFER', amount, 'token', tokenId, 'from', source, 'to', destin);
		result = await session.wallet.tokenTransfer(destin, tinybar, tokenId);
		if(result.status=='SUCCESS'){
			console.log('Transfer OK');
			let txid = result.txid;
			let url  = `/hedera/sell?actid=${source}&token=${tokenId}&txid=${txid}`;
			let rex  = await webget(url);
			if(rex.error){
				console.log('Trade error', rex);
				showTrade(rex.error);
				return; 
			} else {
				console.log('SOLD', amount, tokenId);
				showTrade('SUCCESS!');
				getBalances();
			}
		} else {
			console.log('Trade error', result);
			showTrade('Trade error: '+result.error);
			return; 
		}
	} catch(ex){
		console.log('Trade error', ex);
		showTrade('Trade error: '+ex.message);
		return; 
	}
}

function mintStatus(txt, sec) {
	$('mint-status').innerHTML = txt;
	if(sec){ setTimeout(function(){$('mint-status').innerHTML='';}, sec*1000); }
}

async function onMint() {
	if(!isOnline()) return;
	if(!session.wallet || !session.wallet.isConnected){ mintStatus('Wallet not connected',5); return; }
	let symbol   = $('mint-symbol').value;
	let name     = $('mint-name').value;
	let decimals = $('mint-decimals').value;
	let supply   = $('mint-supply').value;
	let price    = $('mint-price').value;
	let amount   = supply * 10 ** decimals;

    try { 
    	mintStatus('Wait, minting tokens...');
        //let adminKey    = session.wallet.operatorKey;
        //let treasuryId  = session.wallet.operatorId;
        //let treasuryKey = session.wallet.operatorKey;
    	let res = await session.wallet.newToken(symbol, name, decimals, amount);
    	console.log('Mint', res); 
	    if(res.error){
	        console.log('Error minting token:', res.error);
	        mintStatus('Error minting token: ' + res.error);
	    } else {
	        console.log('Token Id ' + res.tokenId);
	        mintStatus('Token Id ' + res.tokenId);
	        $('transfer-token').value = res.tokenId;
	        getBalances();
	        // Add to user token list
	        tokenId  = res.tokenId;
	        symbol   = symbol.replace(/"/g,'').replace(/'/g,'').replace(/,/g,'');
	        name     = name.replace(/"/g,'').replace(/'/g,'').replace(/,/g,'');
	        decimals = parseInt(decimals);
	        supply   = parseInt(supply);
	        price    = parseFloat(price);
	        pricex   = price.toFixed(8);
	        let url  = `/hedera/addusertoken/${tokenId}/${symbol}/${name}/${decimals}/${supply}/${pricex}`;
			let rex  = await fetch(url, {method: 'get'});
			let rez  = await rex.text();
			if(rez=='OK'){ console.log('Token saved'); }
			else { console.log('Error saving token in user list', rez); }
			// Add to user tokens list
			let tmp = '<tr id="{tid}" data-price="{pricex}"><td>{sym}</td><td>{name}</td><td>{price}</td><td>{supply}</td><td>{tid}</td><td><img class="linker" src="/hedera/icon-unlink.png" onclick="onLink()" title="Associate token"></td></tr>';
			let row = tmp.replace(/{tid}/g,   tokenId)
						 .replace('{sym}',    symbol)
						 .replace('{name}',   name)
						 .replace('{pricex}', pricex)
						 .replace('{price}',  money(price, session.mobile?2:4, true))
						 .replace('{supply}', money(supply, 0));
			console.log('ROW', row);
			$('list-users').tBodies[1].innerHTML += row;
	    }
    } catch(ex) { 
    	console.log(ex); 
    	mintStatus('Error sending transaction'); 
    }
}

async function onLink() {
	if(!isOnline()) return;
	// TODO: check session.wallet.isConnected
	let evt = window.event;
	//console.log('Event', evt);
	let tokenId = evt.target.parentNode.parentNode.id;
	console.log('Token Id', tokenId);
	let status = await session.wallet.tokenAssociate(tokenId);
	if(status=='SUCCESS'){
		getBalances();
		alert('Token '+tokenId+' associated to your account')
	} else {
		alert(status);
	}
}


async function onToken(n, evt) {
	let tokenId = evt.target.parentNode.id;
	selectToken(n, tokenId);
}

async function selectToken(n, tokenId) {
	let tables = document.getElementsByClassName('tokens');
	for (var t = 0; t < tables.length; t++) {
		let table = tables[t];
		if(table.nodeName != 'TABLE'){ continue; }
		for (var b = 0; b < table.tBodies.length; b++) {
			let body = table.tBodies[b];
			var rows = body.rows;
			for (var r = 0; r < rows.length; r++) {
				rows[r].className = '';
				if(rows[r].id==tokenId) { rows[r].className = 'select'; }
			}
		}
	}

	console.log('Token', tokenId);
	if(!tokens[tokenId]){
		let info = await session.wallet.getTokenInfo(tokenId);
		let price = $(tokenId).dataset.price;
		tokens[tokenId] = {
			symbol: info.symbol,
			name  : info.name,
			decs  : info.decimals,
			supply: info.supply,
			price : price
		}
	}

	let sym = tokens[tokenId].symbol;
	$('transfer-token').value = tokenId;

	// User tokens can not be traded, we have no admin keys, think about liquidity pools
	if(n<4){
		let base = sym; 
		let quot = 'HBAR';
		//if(n==0){ 
			//base = 'USD'; quot = sym; 
		//	if(sym=='USD'){ base = 'HBAR'; quot = 'USD'; }
		//}
		session.trade  = tokenId;
		if(sym=='USD'){ 
			session.price = 1/session.hbar;
		} else {
			if(['EUR','CNY','JPY','INR'].indexOf(sym)>-1){ 
				session.price = 1/session.hbar / tokens[tokenId].price;
			} else {
				session.price = 1/session.hbar * tokens[tokenId].price;
			}
		}
		session.buying = true;
		$('trade-price').value           = decOrInt(session.price);
		$('trade-pricex').innerHTML      = base+'/'+quot;
		$('trade-token-buy').innerHTML   = sym;
		$('trade-token-buyx').innerHTML  = sym;
		$('trade-token-sell').innerHTML  = 'HBAR';
		$('trade-token-sellx').innerHTML = 'HBAR';
		$('trade-amt-buy').value         = 1;
		calcBuy();
	}

}

async function onSwitch() {
	let sym, buy, sell;
	let tokenId = session.trade;
	if(!tokens[tokenId]){
		let info = await session.wallet.getTokenInfo(tokenId);
		let price = $(tokenId).dataset.price;
		tokens[tokenId] = {
			symbol: info.symbol,
			name  : info.name,
			decs  : info.decimals,
			supply: info.supply,
			price : price
		}
	}
	sym = tokens[tokenId].symbol;
	session.buying = !session.buying;
	if(session.buying){
		buy  = sym;
		sell = 'HBAR';
	} else {
		buy  = 'HBAR';
		sell = sym;
	}
	$('trade-token-buy').innerHTML   = buy;
	$('trade-token-buyx').innerHTML  = buy;
	$('trade-token-sell').innerHTML  = sell;
	$('trade-token-sellx').innerHTML = sell;
	let tmp = $('trade-amt-buy').value;
	$('trade-amt-buy').value = $('trade-amt-sell').value
	$('trade-amt-sell').value = tmp;
}

async function startWallet(actId, actKey) {
	session.wallet = new Wallet(actId, actKey);
}

async function getHbarPrice() {
	let data = await webget('/hedera/gethbarprice');
	session.hbar = data.weightedAvgPrice;
	$('hbar-price').innerHTML = 'HBAR '+money(session.hbar, 8);
	console.log('Price', data);
}

function eventListeners() {
    $('list-forex').addEventListener('click',  function(event){ onToken(0, event) }, false);
    $('list-crypto').addEventListener('click', function(event){ onToken(1, event) }, false);
    $('list-stocks').addEventListener('click', function(event){ onToken(2, event) }, false);
    $('list-comms').addEventListener('click',  function(event){ onToken(3, event) }, false);
    $('list-users').addEventListener('click',  function(event){ onToken(4, event) }, false);
	$('trade-amt-buy').addEventListener('keyup',  calcBuy,  true);
	$('trade-amt-sell').addEventListener('keyup', calcSell, true);
}

async function main() {
	console.log('App started...');
	checkMobile();
	getHbarPrice();
	loadUserTokens();
	loadTokenPrices().then(()=>{
		selectToken(0, '0.0.271860'); // USD
	});
	eventListeners();
}

window.onload = main()

// END