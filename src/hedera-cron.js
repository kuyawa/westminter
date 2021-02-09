const fs     = require('fs').promises;
const path   = require('path');
const fetch  = require('node-fetch');

const ONEDAY = 24*60*60*1000;

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

function extract(text, tini, tend){
	let pini = text.indexOf(tini) + tini.length;
	let ptxt = text.slice(pini);
	let pend = ptxt.indexOf(tend);
	let res  = ptxt.slice(0, pend)
	return res;
}

let sources = ''; //1111
let prices  = {updated:'', hbarusd:1, tokens:{}};
let tokens  = {
	'HBAR': 'HBAR/USD',
	'USD' : '0.0.271860',
	'EUR' : '0.0.271861',
	'CNY' : '0.0.271862',
	'JPY' : '0.0.271863',
	'INR' : '0.0.271864',
	'BTC' : '0.0.271865',
	'ETH' : '0.0.271866',
	'DOT' : '0.0.271867',
	'ADA' : '0.0.271868',
	'LTC' : '0.0.271869',
	'AAPL': '0.0.271870',
	'AMZN': '0.0.271871',
	'GOOG': '0.0.271872',
	'NFLX': '0.0.293668',
	'TSLA': '0.0.293669',
	'GLD' : '0.0.271877',
	'SLV' : '0.0.271878',
	'WHT' : '0.0.271879',
	'CRN' : '0.0.271880',
	'SGR' : '0.0.271881'
};

async function fetchLast() {
	let txt = await getFile('token-prices.json');
	//console.log(txt);
	prices  = JSON.parse(txt);
	//console.log(prices);
}

async function fetchComex() {
	let url  = 'https://edition.cnn.com/business/markets/commodities';
	fetch(url).then(res=>{
		res.text().then(txt=>{
			let inf  = extract(txt, 'window.__DATA__=', '</script>');
			let data = JSON.parse(inf);
			let gldk = '$ROOT_QUERY.cnnBizCommodities({\"labels\":[\"Oil\",\"Brent Crude\",\"Natural Gas\",\"Unleaded Gas\",\"Heating Oil\",\"Gold\",\"Silver\",\"Platinum\",\"Copper\",\"Corn\",\"Soybeans\",\"Wheat\",\"Lean Hogs\",\"Live Cattle\",\"Feeder Cattle\"]}).commodities.5';
			let slvk = '$ROOT_QUERY.cnnBizCommodities({\"labels\":[\"Oil\",\"Brent Crude\",\"Natural Gas\",\"Unleaded Gas\",\"Heating Oil\",\"Gold\",\"Silver\",\"Platinum\",\"Copper\",\"Corn\",\"Soybeans\",\"Wheat\",\"Lean Hogs\",\"Live Cattle\",\"Feeder Cattle\"]}).commodities.6';
			let whtk = '$ROOT_QUERY.cnnBizCommodities({\"labels\":[\"Oil\",\"Brent Crude\",\"Natural Gas\",\"Unleaded Gas\",\"Heating Oil\",\"Gold\",\"Silver\",\"Platinum\",\"Copper\",\"Corn\",\"Soybeans\",\"Wheat\",\"Lean Hogs\",\"Live Cattle\",\"Feeder Cattle\"]}).commodities.11';
			let crnk = '$ROOT_QUERY.cnnBizCommodities({\"labels\":[\"Oil\",\"Brent Crude\",\"Natural Gas\",\"Unleaded Gas\",\"Heating Oil\",\"Gold\",\"Silver\",\"Platinum\",\"Copper\",\"Corn\",\"Soybeans\",\"Wheat\",\"Lean Hogs\",\"Live Cattle\",\"Feeder Cattle\"]}).commodities.9';
			let sgrk = '$ROOT_QUERY.cnnBizCommodities({\"labels\":[\"Brent Crude\",\"Cocoa\",\"Coffee\",\"Copper\",\"Corn\",\"Cotton\",\"Feeder Cattle\",\"Gold\",\"Heating Oil\",\"Lean Hogs\",\"Live Cattle\",\"Natural Gas\",\"Oil\",\"Orange Juice\",\"Platinum\",\"Silver\",\"Soybeans\",\"Sugar #11\",\"Unleaded Gas\",\"Wheat\"]}).commodities.17';
			let glds = data[gldk].last;
			let slvs = data[slvk].last;
			let whts = data[whtk].last;
			let crns = data[crnk].last;
			let sgrs = data[sgrk].last;
			let gld  = (parseFloat(glds) || 0.0);
			let slv  = (parseFloat(slvs) || 0.0);
			let wht  = (parseFloat(whts) || 0.0);
			let crn  = (parseFloat(crns) || 0.0);
			let sgr  = (parseFloat(sgrs) || 0.0);
			//console.log(gld);
			//console.log(slv);
			//console.log(wht);
			//console.log(crn);
			//console.log(sgr);
			if(gld>0) { prices.tokens[tokens['GLD']] = gld.toFixed(8); }
			if(slv>0) { prices.tokens[tokens['SLV']] = slv.toFixed(8); }
			if(wht>0) { prices.tokens[tokens['WHT']] = wht.toFixed(8); }
			if(crn>0) { prices.tokens[tokens['CRN']] = crn.toFixed(8); }
			if(sgr>0) { prices.tokens[tokens['SGR']] = sgr.toFixed(8); }
			sources += '1';
			if(sources=='1111'){ savePrices(); }
		}).catch(ex=>{
			console.log('JError:', ex);
		});
	}).catch(ex=>{
		console.log('FError:', ex);
	});
}

async function fetchComexOLD() {
	// https://money.cnn.com/data/commodities/
	// GLD last_GCJ1
	// SLV last_SIH1
	// CRN last_CH1
	// WHT last_WH1
	// SGR last_YOH1

	let url = 'https://money.cnn.com/data/commodities/';
	fetch(url).then(res=>{
		res.text().then(txt=>{
			let gld = extract(txt, 'last_GCJ1">', '</').replace(/,/g,'');
			let slv = extract(txt, 'last_SIH1">', '</').replace(/,/g,'');
			let wht = extract(txt, 'last_WH1">',  '</').replace(/,/g,'');
			let crn = extract(txt, 'last_CH1">',  '</').replace(/,/g,'');
			let sgr = extract(txt, 'last_YOH1">', '</').replace(/,/g,'');
			//console.log('GLD', gld);
			//console.log('SLV', slv);
			//console.log('WHT', wht);
			//console.log('CRN', crn);
			//console.log('SGR', sgr);
			prices.tokens[tokens['GLD']] = gld;
			prices.tokens[tokens['SLV']] = slv;
			prices.tokens[tokens['WHT']] = wht;
			prices.tokens[tokens['CRN']] = crn;
			prices.tokens[tokens['SGR']] = sgr;
			sources += '1';
			if(sources=='1111'){ savePrices(); }
		}).catch(ex=>{
			console.log('JError:', ex);
		});
	}).catch(ex=>{
		console.log('FError:', ex);
	});
}

async function fetchCrypto() {
	let url = 'https://api.binance.com/api/v3/ticker/price';
	fetch(url).then(res=>{
		res.json().then(data=>{
			let btc, eth, dot, ada, ltc, hbar;
			for (var i = 0; i < data.length; i++) {
				let tick = data[i]
				if(tick.symbol=='HBARUSDT'){ hbar = tick.price; }
				if(tick.symbol=='BTCUSDT'){ btc = tick.price; }
				if(tick.symbol=='ETHUSDT'){ eth = tick.price; }
				if(tick.symbol=='DOTUSDT'){ dot = tick.price; }
				if(tick.symbol=='ADAUSDT'){ ada = tick.price; }
				if(tick.symbol=='LTCUSDT'){ ltc = tick.price; }
			}
			//console.log('HBAR', hbar);  // HBAR/USD
			//console.log('BTC', btc);
			//console.log('ETH', eth);
			//console.log('DOT', dot);
			//console.log('ADA', ada);
			//console.log('LTC', ltc);
			prices.hbarusd = hbar;
			prices.tokens[tokens['BTC']]  = btc;
			prices.tokens[tokens['ETH']]  = eth;
			prices.tokens[tokens['DOT']]  = dot;
			prices.tokens[tokens['ADA']]  = ada;
			prices.tokens[tokens['LTC']]  = ltc;
			sources += '1';
			if(sources=='1111'){ savePrices(); }
		}).catch(ex=>{
			console.log('JError:', ex);
		});
	}).catch(ex=>{
		console.log('FError:', ex);
	});
}

async function fetchForex() {
	let url = 'https://seeforex.one/api/rates';
	fetch(url).then(res=>{
		res.json().then(tkr=>{
			let usd = '1.0';
			let eur = tkr.data['USD/EUR'].price;
			let cny = tkr.data['USD/CNY'].price;
			let jpy = tkr.data['USD/JPY'].price;
			let inr = tkr.data['USD/INR'].price;
			//console.log('USD', usd);
			//console.log('EUR', eur);
			//console.log('CNY', cny);
			//console.log('JPY', jpy);
			//console.log('INR', inr);
			prices.tokens[tokens['USD']] = usd;
			prices.tokens[tokens['EUR']] = eur;
			prices.tokens[tokens['CNY']] = cny;
			prices.tokens[tokens['JPY']] = jpy;
			prices.tokens[tokens['INR']] = inr;
			sources += '1';
			if(sources=='1111'){ savePrices(); }
		}).catch(ex=>{
			console.log('JError:', ex);
		});
	}).catch(ex=>{
		console.log('FError:', ex);
	});
}

async function fetchStocks() {
	let url = 'https://price.mirror.finance/latest';
	fetch(url).then(res=>{
		res.json().then(tkr=>{
			let aapl = tkr.prices['AAPL'];
			let amzn = tkr.prices['AMZN'];
			let goog = tkr.prices['GOOGL'];
			let nflx = tkr.prices['NFLX'];
			let tsla = tkr.prices['TSLA'];
			//console.log('AAPL', aapl);
			//console.log('AMZN', amzn);
			//console.log('GOOG', goog);
			//console.log('NFLX', nflx);
			//console.log('TSLA', tsla);
			prices.tokens[tokens['AAPL']] = aapl;
			prices.tokens[tokens['AMZN']] = amzn;
			prices.tokens[tokens['GOOG']] = goog;
			prices.tokens[tokens['NFLX']] = nflx;
			prices.tokens[tokens['TSLA']] = tsla;
			sources += '1';
			if(sources=='1111'){ savePrices(); }
		}).catch(ex=>{
			console.log('JError:', ex);
		});
	}).catch(ex=>{
		console.log('FError:', ex);
	});
}

async function savePrices() {
	prices.updated = new Date().toJSON();
	console.log(prices);
	let txt = JSON.stringify(prices, null, 4);
	saveFile('token-prices.json', txt);
}

async function fetchAll() {
	// check ten minutes lapse
	await fetchLast();
	fetchComex();
	fetchCrypto();
	fetchForex();
	fetchStocks();
}

//fetchAll();

//exports.fetchComex  = fetchComex;
//exports.fetchCrypto = fetchCrypto;
//exports.fetchForex  = fetchForex;
//exports.fetchStocks = fetchStocks;
exports.fetchAll = fetchAll;

// END