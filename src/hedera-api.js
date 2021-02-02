const fs     = require('fs').promises;
const path   = require('path');
const fetch  = require('node-fetch');
const Hedera = require("@hashgraph/sdk");
const cron   = require('./hedera-cron');
const HUNITS = 10 ** 8;


async function getFile(name) {
    let file = path.join(__dirname, 'public/hedera/'+name);
	let data = await fs.readFile(file, {encoding: 'utf-8'});
	return data;
}

async function saveFile(name, text) {
    let file = path.join(__dirname, 'public/hedera/'+name);
	let info = await fs.writeFile(file, text, {encoding: 'utf-8'});
	return info;
}

async function newAccount() {
	let res, act;
	try {
		res = await fetch('https://apifetcher.herokuapp.com/hedera/account', {method:'get'});
		act = res.json();
	} catch { act = {'error':'API unavailable'}; }
    return act;
}

async function newAccountOLD(initBalance=2000000000) {
	let account;

	try {
	    // Create our connection to the Hedera network
	    let client = Hedera.Client.forTestnet();
	    client.setOperator(process.env.OPERATORID, process.env.OPERATORKEY);

	    //Create new keys
	    let prvKey = await Hedera.PrivateKey.generate(); 
	    let pubKey = prvKey.publicKey;

	    //Create a new account with 1,000 tinybar starting balance
	    let response = await new Hedera.AccountCreateTransaction()
	        .setKey(pubKey)
	        .setInitialBalance(Hedera.Hbar.fromTinybars(initBalance))
	        .execute(client);

	    // Get the new account ID
	    let receipt = await response.getReceipt(client);
	    let accountId = receipt.accountId;

	    account = {
	    	accountId : accountId.toString(),
	    	publicKey : pubKey.toString(),
	    	privateKey: prvKey.toString()
	    };
		console.log('-- New Account', account.accountId);
	} catch(ex){
	    console.log("Error: ", ex);
	    account = { error: ex.message };
	}

    return account;
}

async function addUserToken(tokenId, symbol, name, decs, supply, price) {
	let line = [tokenId, symbol, name, decs, supply, price].join(',');
	//console.log('ADD:', line);
	try{
	    let file = path.join(__dirname, 'public/hedera/token-users.txt');
		await fs.appendFile(file, '\n'+line, {encoding: 'utf-8'});
		return true;
	} catch(ex){
		console.log('File error:', ex);
		return false;
	}
}

async function getUserTokens() {
    let file = path.join(__dirname, 'public/hedera/token-users.txt');
	let data = await fs.readFile(file, {encoding: 'utf-8'});
	return data;
}

async function getLatestPrices() {
	var info = null;
    let file = path.join(__dirname, 'public/hedera/token-prices.json');
	let data = await fs.readFile(file, {encoding: 'utf-8'});
	try { info = JSON.parse(data); }
	catch(ex) { 
		console.log('Json error:', ex); 
		data = '{"error":"api server unavailable"}';
		return data;
	}
	// if 10 mins then get else return file
	let now = (new Date()).getTime();
	let upd = (new Date(info.updated)).getTime();
	let dif = now - upd;
	let m10 = 10*60*1000; // ten minutes
	if(dif>m10){ 
		console.log('prices.fetch');
		cron.fetchAll();
	}
	return data;
}

async function getHbarPrice() {
	var info = null;
    let file = path.join(__dirname, 'public/hedera/price.json');
	let data = await fs.readFile(file, {encoding: 'utf-8'});
	try { info = JSON.parse(data); }
	catch(ex) { 
		console.log('Json error:', ex); 
		data = '{"error":"api server unavailable"}';
		return data;
	}
	let now = (new Date()).getTime();
	let dif = now - info.closeTime;
	let m10 = 10*60*1000; // ten minutes
	//console.log('hbar',m10,'>',dif,'?');
	if(dif>m10){ 
		console.log('hbar.fetch');
		try {
			let url = 'https://api.binance.com/api/v1/ticker/24hr?symbol=HBARUSDT';
			let opt = {method:'get'};
			let rex = await fetch(url,opt);
			let jsn = await rex.json();
			let tkr = JSON.stringify(jsn);
			// Save
		    let file = path.join(__dirname, 'public/hedera/price.json');
			let info = await fs.writeFile(file, tkr, {encoding: 'utf-8'});
			//let ok  = await saveFile('price.json', tkr);
			//console.log(tkr);
			data = tkr;
		} catch(ex){
			console.log('Save error:', ex)
			data = '{"error":"price server unavailable"}';
		}
	} else {
		//console.log('hbar.nofetch');
	}
	return data;
}

async function transactionInfo(sid) {
    console.log('TxInfo:', sid);
    let info = null;
	try {
	    // Create our connection to the Hedera network
	    let client = Hedera.Client.forTestnet();
	    client.setOperator(process.env.OPERATORID, process.env.OPERATORKEY);

	    // Get Tx Record
        let txid = Hedera.TransactionId.fromString(sid)
        const response = await new Hedera.TransactionRecordQuery()
            .setQueryPayment(new Hedera.Hbar(1))
            .setTransactionId(txid)
            .execute(client);

        //console.log('Response:', response);
        let status    = response.receipt.status.toString();
        let transfers = []; //response.transfers.toString();
        let tokens    = {};
        for (var i = 0; i < response.transfers.length; i++) {
        	let act = response.transfers[i].accountId.toString();
        	let amt = response.transfers[i].amount.toTinybars().toString();
            //console.log('- Transfer:', act, amt);
            transfers.push({accountId:act, amount:amt});
        }
        let toks = JSON.parse(response.tokenTransfers.toString());
        //let keys = Object.keys(toks);
        for (var key in toks) {
        	tokens[key] = JSON.parse(toks[key]);
        }
        //console.log('Status:', status);
        //console.log('Transfers:', transfers);
        //console.log('Tokens:', tokens);
        info = { status: status, transfers: transfers, tokens: tokens };
    } catch(ex) {
        //console.log('Error:', ex.message);
        //console.log('Time lapsed, transaction not available');
        info = {'error': ex.message};
    }
	
	console.log('Info', info);
    return info;
}

async function buyToken(actid, token, txid) {
	let res, act;
	try {
		res = await fetch(`https://apifetcher.herokuapp.com/hedera/buy?actid=${actid}&token=${token}&txid=${txid}`, {method:'get'});
		act = res.json();
	} catch { act = {'error':'API unavailable'}; }
    return act;
}

async function buyTokenOLD(actid, token, txid) {
	let res = null;
	if(!actid){ return { 'error': 'Trade error: Account not found' }; }
	if(!token){ return { 'error': 'Trade error: Token not found' }; }
	if(!txid) { return { 'error': 'Trade error: Invalid transaction Id' }; }
	try {
		res = await transactionInfo(txid);
		//console.log('Tokens', res.tokens);
		//console.log('TokensN', Object.keys(res.tokens).length);
		if(!res){ return { 'error': 'Trade error: Transaction not found' }; }
		if(res.error){ return { 'error': 'Trade error: Transaction not available' }; }
		if(res.status!=='SUCCESS'){ return { 'error': 'Trade error: Transaction failed' }; }
		if(Object.keys(res.tokens).length>0){
			return { 'error': 'Trade error: Invalid operation' };
		}
		// Check sender and destin accounts and amounts
		let bankId = process.env.BANKID;
		let actFnd = false;
		let bnkFnd = false;
		let actAmt = 0;
		let bnkAmt = 0;
        for (var i = 0; i < res.transfers.length; i++) {
            //console.log('- Transfer:', res.transfers[i].accountId.toString(), res.transfers[i].amount.toString());
            let ract = res.transfers[i].accountId;
            let ramt = res.transfers[i].amount;
        	if( actid==ract){ actFnd = true; actAmt = ramt; }
        	if(bankId==ract){ bnkFnd = true; bnkAmt = ramt; }
        }
        if(!actFnd){ return { 'error': 'Trade error: Account not found' }; }
        if(!bnkFnd){ return { 'error': 'Trade error: Destin not treasury' }; }
        if(parseInt(actAmt)>=0){ 
        	return { 'error': 'Trade error: Invalid sender amount' }; 
        }
        if(parseInt(bnkAmt)>0){ 
        	console.log('BUY', actid, bnkAmt, token);
        	let content = await getFile('token-prices.json');
        	let prices  = JSON.parse(content);
        	let hbrprc  = prices['HBAR/USD'];
        	//let usdprc  = 1 / hbrprc;
        	let tknprc  = prices[token];
        	if(!tknprc){ return { 'error': 'Trade error: token price not available' };  }
        	let price   = tknprc / hbrprc;
        	if(['0.0.271860', '0.0.271861', '0.0.271862', '0.0.271863', '0.0.271864'].indexOf(token)>=0){
        		price = 1 / hbrprc / tknprc;
        	}
	        console.log('Price', price);
        	let recAmt  = (bnkAmt / HUNITS) / price;
        	let units   = parseInt(recAmt * HUNITS);
        	console.log('Transfer token', recAmt, token);
        	// Transfer token units
        	let ret = await tokenTransfer(actid, units, token);
        	console.log('Result', ret);
        	if(ret=='SUCCESS'){ return { status: 'SUCCESS' }; }
        	else { return { 'error': 'Trade error: '+ret }; }
        } else {
        	return { 'error': 'Trade error: Invalid buy amount' }; 
        }
	} catch(ex) {
    	return { 'error': 'Trade error: '+ex.message }; 
	}
	return res;
}

async function sellToken(actid, token, txid) {
	let res, act;
	try {
		res = await fetch(`https://apifetcher.herokuapp.com/hedera/sell?actid=${actid}&token=${token}&txid=${txid}`, {method:'get'});
		act = res.json();
	} catch { act = {'error':'API unavailable'}; }
    return act;
}

async function sellTokenOLD(actid, token, txid) {
	let res = null;
	if(!actid){ return { 'error': 'Trade error: Account not found' }; }
	if(!token){ return { 'error': 'Trade error: Token not found' }; }
	if(!txid) { return { 'error': 'Trade error: Invalid transaction Id' }; }
	try {
		res = await transactionInfo(txid);
		//console.log('Tokens', res.tokens);
		//console.log('TokensN', Object.keys(res.tokens).length);
		if(!res){ return { 'error': 'Trade error: Transaction not found' }; }
		if(res.error){ return { 'error': 'Trade error: Transaction not available' }; }
		if(res.status!=='SUCCESS'){ return { 'error': 'Trade error: Transaction failed' }; }
		if(Object.keys(res.tokens).length==0){ return { 'error': 'Trade error: Invalid operation' }; }
		// Check sender and destin accounts and amounts in tokens
		let op = res.tokens[token];
        //console.log('OP', op);
		if(!op) { return { 'error': 'Trade error: Tokens not received' }; }
        //console.log('OP keys', Object.keys(op).length, Object.keys(op) );
		let bankId = process.env.BANKID;
        //console.log('OP[bankId]', op[bankId]);
		let bnkAmt = parseInt(op[bankId]);
		let actAmt = parseInt(op[actid]);
        //console.log('bnkAMT', bnkAmt);
        //console.log('actAMT', actAmt);
		if(!bnkAmt || bnkAmt <= 0) { return { 'error': 'Trade error: Invalid amount received' }; }
		if(!actAmt || actAmt >= 0) { return { 'error': 'Trade error: Invalid amount sent' }; }
        if(bnkAmt>0){ 
        	console.log('SELL', actid, bnkAmt, token);
        	let content = await getFile('token-prices.json');
        	let prices  = JSON.parse(content);
        	let hbrprc  = prices['HBAR/USD'];
        	//let usdprc  = 1 / hbrprc;
        	let tknprc  = prices[token];
        	if(!tknprc){ return { 'error': 'Trade error: token price not available' };  }
        	let price   = tknprc / hbrprc;
        	if(['0.0.271860', '0.0.271861', '0.0.271862', '0.0.271863', '0.0.271864'].indexOf(token)>=0){
        		price = 1 / hbrprc / tknprc;
        	}
	        console.log('Price', price);
        	let recAmt  = (bnkAmt / HUNITS) * price;
        	let units   = parseInt(recAmt * HUNITS);
        	console.log('Transfer Hbars', recAmt);
        	// Transfer hbar units
        	let ret = await transfer(actid, recAmt.toFixed(8));
        	//console.log('Result', ret);
        	if(ret=='SUCCESS'){ return { 'status': 'SUCCESS' }; }
        	else { return { 'error': 'Trade error: '+ret }; }
        } else {
        	return { 'error': 'Trade error: Invalid sell amount' }; 
        }
	} catch(ex) {
    	return { 'error': 'Trade error: '+ex.message }; 
	}
	return res;
}

// Amount in Hbars not tinybars
async function transfer(destin, amount) {
	console.log('-- Transfer', amount, 'Hbars from', process.env.BANKID, 'to', destin);
	let status;

	try {
	    let client = Hedera.Client.forTestnet();
	    client.setOperator(process.env.BANKID, process.env.BANKPK);

		let source = process.env.BANKID;
		let srckey = process.env.BANKPK;
	    let prvKey = Hedera.PrivateKey.fromString(srckey);

    //const myBalance = await new Hedera.AccountBalanceQuery()
    //    .setAccountId(process.env.BANKID)
    //    .execute(client);

    //console.log("Account:", process.env.BANKID);
    //console.log("Balance:", myBalance.hbars.toTinybars().toString(), "tinybars");
    //console.log("Balance:", myBalance.hbars.toString());
    //console.log("Tokens :", myBalance.tokens.toString());

	    let response = await new Hedera.TransferTransaction()
	        .addHbarTransfer(source, -amount)
	        .addHbarTransfer(destin,  amount)
			.execute(client);

	    //let transaction = await new Hedera.TransferTransaction()
	        //.addHbarTransfer(source, -amount)
	        //.addHbarTransfer(destin,  amount)
			//.freezeWith(client);
		//let signTx   = await transaction.sign(prvKey);
		//let response = await signTx.execute(client);

		let txid = response.transactionId.toString();
		let hash = response.transactionHash.toString('hex');
		console.log('TxId:', txid);
		console.log('Hash:', hash);

	    let receipt = await response.getReceipt(client);
	    //status = { status: receipt.status.toString(), txid: txid, hash: hash };
	    status = receipt.status.toString();
	} catch(ex){
		//status = { status: 'ERROR', error: ex.message };
		status = ex.message;
	}

	console.log('Status:', status);
	return status;
}

async function tokenTransfer(destin, amount, tokenId) {
	console.log('-- Token Transfer', amount, 'from', process.env.BANKID, 'to', destin, 'token', tokenId);
	let status;

	try {
	    let client = Hedera.Client.forTestnet();
	    //client.setOperator(process.env.OPERATORID, process.env.OPERATORKEY);
	    client.setOperator(process.env.BANKID, process.env.BANKPK);

		let source = process.env.BANKID;
		let srckey = process.env.BANKPK;
	    let prvKey = Hedera.PrivateKey.fromString(srckey);

		let transaction = await new Hedera.TransferTransaction()
			.addTokenTransfer(tokenId, source, -amount)
			.addTokenTransfer(tokenId, destin,  amount)
			.freezeWith(client);
		
		let signTx   = await transaction.sign(prvKey);
		let response = await signTx.execute(client);
		//console.log('Response:',  response);
		let txid = response.transactionId.toString();
		let hash = response.transactionHash.toString('hex');
		console.log('TxId:', txid);
		console.log('Hash:', hash);

	    let receipt = await response.getReceipt(client);
	    status = receipt.status.toString();
	} catch(ex){
		status = ex.message;
	}
	
	console.log("Status: ", status);
    return status;
}

exports.newAccount      = newAccount;
exports.addUserToken    = addUserToken;
exports.getUserTokens   = getUserTokens;
exports.getHbarPrice    = getHbarPrice;
exports.buyToken        = buyToken;
exports.sellToken       = sellToken;
exports.getLatestPrices = getLatestPrices;


// END