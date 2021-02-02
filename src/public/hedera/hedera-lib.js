// Hedera Lib

class Wallet {
	constructor(opId, opKey) {
		this.operatorId  = opId;
		this.operatorKey = opKey;
	}
}

Wallet.prototype.newAccount = async function(initBalance=2000000000) {
	console.log('-- New Account')

    // Create our connection to the Hedera network
    let client = Hedera.WebClient.forTestnet();
    client.setOperator(this.operatorId, this.operatorKey);

    //Create new keys
    let prvKey = await Hedera.PrivateKey.generate(); 
    let pubKey = prvKey.publicKey;

    //Create a new account with 1,000 tinybar starting balance
    let response = await new Hedera.AccountCreateTransaction()
        .setKey(pubKey)
        .setInitialBalance(Hedera.Hbar.fromTinybars(initBalance))
	    //.setTransactionMemo('Anything goes here max 100 chars')
        .execute(client);

    // Get the new account ID
    let receipt = await response.getReceipt(client);
    let accountId = receipt.accountId;

    let account = {
    	accountId : accountId.toString(),
    	privateKey: prvKey.toString(),
    	publicKey : pubKey.toString()
    };

    console.log("Account:", accountId.toString());
    console.log("PrvKey: ", prvKey.toString());
    console.log("PubKey: ", pubKey.toString());
    //console.log("Account:", account);

    return account;
}

Wallet.prototype.getBalance = async function(act) {
	console.log('-- Get Balance')

    // Create our connection to the Hedera network
    let client = Hedera.WebClient.forTestnet();
    client.setOperator(this.operatorId, this.operatorKey);

    //Verify the account balance
    let balance = await new Hedera.AccountBalanceQuery()
        .setAccountId(act)
        .execute(client);

    let info = {
    	account: act, 
    	hbar   : balance.hbars.toString(),
    	tbar   : balance.hbars.toTinybars().toString(),
    	tokens : JSON.parse(balance.tokens.toString())
    }

    console.log("Balance:", info);

    return info;
}

Wallet.prototype.getBalances = async function(act) {
	console.log('Balances for', act);
	let url = 'https://testnet.mirrornode.hedera.com/api/v1/balances?account.id='+act;
	let opt = { method: 'get' };
	let res = null;
	let bal = null;
	try {
		res = await fetch(url, opt);
		bal = await res.json();
	} catch(ex) {
		console.log('Error', ex)
		bal = { balances: [{"account":act, "balance":0, "tokens":[]}] };
	}
	console.log('Balances', bal);
	return bal;
}

Wallet.prototype.transfer = async function(destin, amount) {
	console.log('-- Transfer', amount, 'from', this.operatorId, 'to', destin);
	let result;

	try {
    	// Create our connection to the Hedera network
	    let client = Hedera.WebClient.forTestnet();
	    client.setOperator(this.operatorId, this.operatorKey);

	    //Create the transfer transaction
		let source = this.operatorId;
		let srckey = this.operatorKey;
	    let response = await new Hedera.TransferTransaction()
	        .addHbarTransfer(source, Hedera.Hbar.fromTinybars(-amount))
	        .addHbarTransfer(destin, Hedera.Hbar.fromTinybars( amount))
	        //.setTransactionMemo('Anything goes here max 100 chars')
	        .execute(client);

	    let receipt = await response.getReceipt(client);
		let txid  = response.transactionId.toString();
		let hash  = response.transactionHash.toString('hex');
		let final = receipt.status.toString();
		console.log('Hash:', hash);
		console.log('TxId:', txid);
	    result = { status: final, txid: txid, hash: hash };
	} catch(ex){
		result = { status: 'ERROR', error: ex.message };
	}

	console.log('Transfer result:', result);
	return result;
}

Wallet.prototype.newToken = async function(sym, name, decs, supply, adminKey, treasuryId, treasuryKey) {
	console.log('-- New Token');
	let info;

	try {
	    // Create our connection to the Hedera network
	    let client = Hedera.WebClient.forTestnet();
	    client.setOperator(this.operatorId, this.operatorKey);

	    let keyA = Hedera.PrivateKey.fromString(adminKey);
	    let keyT = Hedera.PrivateKey.fromString(treasuryKey);

		//Create the transaction and freeze for manual signing
		let transaction = await new Hedera.TokenCreateTransaction()
		     .setTokenSymbol(sym)
		     .setTokenName(name)
			 .setDecimals(decs)
		     .setInitialSupply(supply)
		     .setAdminKey(keyA)
		     .setTreasuryAccountId(treasuryId)
		     .setMaxTransactionFee(new Hedera.Hbar(10)) //Change the default max transaction fee
		     .freezeWith(client);

		//Sign the transaction with the token adminKey and the token treasury account private key
		let first = await transaction.sign(keyA);
		let final = await transaction.sign(keyT);

		//Sign the transaction with the client operator private key and submit to a Hedera network
		let response = await final.execute(client);
		console.log('Response', response)
		//Get the receipt of the transaction
		let receipt = await response.getReceipt(client);
	    let status  = receipt.status.toString();
	    let tokenId = receipt.tokenId.toString();

		//console.log('TxHash:',  response.transactionHash.toString('hex'));
	    console.log('Status:',  status);
	    console.log('TokenId:', tokenId);
	    info = { status: status, tokenId: tokenId };
	} catch(ex) {
	    console.log('Error:', ex);
	    info = { error: ex.message };
	}

	return info;
}

Wallet.prototype.getTokenBalance = async function(act) {
	console.log('-- Token Balance for', act);
	let balance = null;
	try {
	    // Create our connection to the Hedera network
	    let client = Hedera.WebClient.forTestnet();
	    client.setOperator(this.operatorId, this.operatorKey);

	    //Verify the account balance
	    res = await new Hedera.AccountBalanceQuery()
	        .setAccountId(act)
	        .execute(client);

	    balance = res.hbars.toTinybars().toString()
	    console.log("Balance:", res.hbars.toTinybars().toString(), "tinybars");
	    console.log("Tokens :", JSON.parse(res.tokens.toString()));
	} catch(ex) {
	    console.log('Error:', ex);
	}

	return balance;
}

Wallet.prototype.getTokenInfo = async function(tkn) {
	console.log('-- Token info for', tkn)
	let info = null;
	try {
	    // Create our connection to the Hedera network
	    let client = Hedera.WebClient.forTestnet();
	    client.setOperator(this.operatorId, this.operatorKey).setMaxQueryPayment(Hedera.Hbar.fromTinybars(10));

		//Create the query
		let tokenId = Hedera.TokenId.fromString(tkn);
		let query   = new Hedera.TokenInfoQuery().setTokenId(tokenId);
		let result  = await query.execute(client);

		console.log("Result:", result);
		//console.log("Name    : " + result.name);
		//console.log("Symbol  : " + result.symbol);
		//console.log("Decimals: " + result.decimals);
		//console.log("Supply  : " + result.totalSupply);
		//console.log("Treasury: " + result.treasuryAccountId);
		//console.log("AdminPub: " + result.adminKey);

		info = {
			tokenId:  result.tokenId.toString(),
			name:     result.name,
			symbol:   result.symbol,
			decimals: result.decimals,
			supply:   result.totalSupply.toString(),
			treasury: result.treasuryAccountId.toString()
		};
	} catch(ex) {
	    console.log('Error:', ex);
	    info = { error: ex.message };
	}

	return info;
}

Wallet.prototype.isTokenAssociated = async function(tkn, act) {
    if(!act) { act = this.operatorId; }
	console.log('-- Token Associated?', tkn, 'to', act);

    let client = Hedera.WebClient.forTestnet();
    client.setOperator(this.operatorId, this.operatorKey);

    let balance = await new Hedera.AccountBalanceQuery()
        .setAccountId(act)
        .execute(client);

    let info = {
    	account: act, 
    	hbar   : balance.hbars.toString(),
    	tbar   : balance.hbars.toTinybars().toString(),
    	tokens : JSON.parse(balance.tokens.toString())
    }

    var ok = false;
    //console.log("Info:", info);
    //console.log("Keys:", Object.keys(info.tokens));
    //if(Object.keys(info.tokens).indexOf(tkn)>-1){
    if(info.tokens[tkn]){
    	ok = true;
    }

    console.log("Associated:", ok);
    return ok;
}

Wallet.prototype.tokenAssociate = async function(tkn) {
	console.log('Token Associate', tkn, 'to account', this.operatorId)
	let status;
	try {
	    // Create our connection to the Hedera network
	    let client = Hedera.WebClient.forTestnet();
	    client.setOperator(this.operatorId, this.operatorKey);

		//Create the query
		let tokenId = Hedera.TokenId.fromString(tkn);
		let privKey = Hedera.PrivateKey.fromString(this.operatorKey);

		//Associate a token to an account and freeze the unsigned transaction for signing
		let transaction = await new Hedera.TokenAssociateTransaction()
		     .setAccountId(this.operatorId)
		     .setTokenIds([tokenId])
		     .freezeWith(client);

		//Sign with the private key of the account that is being associated to a token 
		let signTx = await transaction.sign(privKey);

		//Submit the transaction to a Hedera network    
		let response = await signTx.execute(client);

		//Request the receipt of the transaction
		let receipt = await response.getReceipt(client);
	    status = receipt.status.toString();
	} catch(ex){
		status = ex.message;
	}

	console.log("Status:", status);
    return status;
}

Wallet.prototype.tokenTransfer = async function(destin, amount, tokenId) {
	console.log('-- Transfer', amount, 'from', this.operatorId, 'to', destin, 'token', tokenId);
	let status;
	try {
	    // Create our connection to the Hedera network
	    let client = Hedera.WebClient.forTestnet();
	    client.setOperator(this.operatorId, this.operatorKey);

	    //Create the transfer transaction
		let source = this.operatorId;
		let srckey = this.operatorKey;
		let transaction = await new Hedera.TransferTransaction()
			.addTokenTransfer(tokenId, source, -amount)
			.addTokenTransfer(tokenId, destin,  amount)
			.freezeWith(client);
		
		//Sign with the sender account private key
	    let privKey = Hedera.PrivateKey.fromString(srckey);
		let signTx  = await transaction.sign(privKey);
		
		//Sign with the client operator private key and submit to a Hedera network
		let response = await signTx.execute(client);
	    let receipt  = await response.getReceipt(client);
		
		//console.log('Response:',  response);
		let txid  = response.transactionId.toString();
		let hash  = response.transactionHash.toString('hex');
		let final = receipt.status.toString();
		console.log('Hash:', hash);
		console.log('TxId:', txid);
	    status = { status: final, txid: txid, hash: hash };
	} catch(ex){
		status = { status: 'ERROR', error: ex.message };
	}

	console.log('Status:', status);
	return status;
}


// END