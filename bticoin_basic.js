const bitcoin = require('bitcoinjs-lib');
const bip32 = require('bip32');
const network = bitcoin.networks.testnet;
let publicKey = keyPair.getAddress()
let privateKey = keyPair.toWIF()

var recieve_address=[]
var chained_address=[]
let coinSelect = require('coinselect')
let feeRate = 55 // satoshis per byte

//xpub from public key
//node derive from xpub and then derive child
//derive node from xpub

// chain->1 recieve
function address_list(network, xpub, chain, start, end) {
    //dervie the adress from index start to end using acount extended 
    //public key(X-PUB) for chain equal to (0 or 1) for testnet work
    //retrun list of adresses
    

    for(var i=start;i<end;i++){
        const adressnode_publickey= bip32.fromBase58(xpub).derive(chain).derive(i).publicKey;
        const addressObject = bitcoin.payments.p2pkh({ adressnode_publickey, network })
        if(chain==1){
            recieve_address.push(addressObject.address);
        }else{
            chained_address.push(addressObject.address);
        }
       
    }
}



function add_wallet(network, name, addresses){
    //it will add list of address to the block cypher and give that list a name
    //different list for change and recieve
    var data = {"name": name,"addresses":addresses};
    var USERTOKEN="9a847cf0af3e42e5af3417735bc84ce3";
    var str='https://api.blockcypher.com/v1/btc/';
    str+=network;
    str+="/wallets/?token=";
    str+=USERTOKEN;
    $.post(str, JSON.stringify(data))
    .then(function(d) {console.log(d)});
}


function add_addresses(network, name, addresses){
    //to append address to an existing wallet to a blockcypher (appending to above function)
    //token, for api required

    //we will call this function to make two times to make two wallets onw with name recieve and other with changed
    var data = {"addresses": ["13cj1QtfW61kQHoqXm3khVRYPJrgQiRM6j"]};
    var USERTOKEN="9a847cf0af3e42e5af3417735bc84ce3";
    var str='https://api.blockcypher.com/v1/btc/';
    str+=network;
    str+="/wallets/";
    str+=name;
    str+="/";
    str+=addresses;
    str+="?token=";
    str+=USERTOKEN
    $.post(str, JSON.stringify(data))
    .then(function(d) {console.log(d)});
}


function fetch_wallet(network, name){
    //it will fetch all the address on a particlaur wallet on block cypher
    var USERTOKEN="9a847cf0af3e42e5af3417735bc84ce3";
    var str='https://api.blockcypher.com/v1/btc/';
    str+=network;
    str+="/wallets/";
    str+=name;
    str+="/addresses?token=";
    str+=USERTOKEN
    $.get(str)
  .then(function(d) {console.log(d)});
}


function fetch_utxo(network, receive_wallet, change_wallet) {
    //(unsend transaction output)   check API
    //it will fetch tx ref for recive and change wallet stored on block cypher
    var str="https://api.blockcypher.com/v1/btc/";
    str+=network;
    str+="/addrs/";
    var utxo_list=[];
    

    //for receive wallet
    for(var i=0;i<receive_wallet.length;i++){
        str+=receive_wallet[i];
        var temp;
        $.get(str).then(function(d){temp=d});
        var texrefs=temp['txrefs'];
        var size=temp['n_tx'];
        for(var j=0;j<size;j++){
            if(texrefs[j]['spent']=='false'){
                //means it's an utxo
                utxo_list.push(texrefs[j]);
            }
        }
    }

    //for change wallet
    for(var i=0;i<change_wallet.length;i++){
        str+=change_wallet[i];
        var temp;
        $.get(str).then(function(d){temp=d});
        var texrefs=temp['txrefs'];
        var size=temp['n_tx'];
        for(var j=0;j<size;j++){
            if(texrefs[j]['spent']=='false'){
                //means it's an utxo
                utxo_list.push(texrefs[j]);
            }
        }
    }
    
}



function utxo_for_coinselect(utxolist){
    // which transactions to use as input for next transaction
    //we just have to add the nonWitnessUtxo attribute
    var formattted_utxolist=[];
    for(i=0;i<utxolist.length;i++){
        var utxo=new Object();
        var tx_hash=utxolist[i]['tx_hash'];
        utxo.tx_hash=tx_hash;
        utxo.vout=0;
        utxo.value=utxolist[i]['value'];
        
        var str="Buffer.from('";
        str+=tx_hash;
        str+="','hex')"

        utxo.nonWitnessUtxo=str;
        formattted_utxolist.push(utxo);

    }
}


//22->18->needs formating, done in 18

function build_unsigned_transaction(amount, to_address, ret_value){
    //return from function at 18 is ret_value
    //return a hex string

    let { inputs, outputs, fee } = coinSelect(utxos, to_address, feeRate)
    var txBuilder = new bitcoin.TransactionBuilder(bitcoin.networks.bitcoin)
    for(var i = 0; i < inputs.length; i++){
        var input = inputs[i]
        txBuilder.addInput(input.txid, input.vout, 0xffffffff, Buffer.from(input.scriptPubKey, 'hex'))
    }

    for(var i = 0; i < outputs.length; i++){
        var output = outputs[i]
        txBuilder.addOutput(output.address, output.amount)
    }
    var tx = txBuilder.buildIncomplete()
    for(var i = 0; i < inputs.length; i++){
        var input = inputs[i]
        tx.ins[i].script = Buffer.from(input.scriptPubKey, 'hex')
    }
    return tx.toHex()
}
