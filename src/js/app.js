App = {
    web3Provider: null,
    contracts: {},
    accoutn: '0x0',
    loading: false,
    tokenPrice: 1000000000000000, // in wei
    tokenSold: 0,
    tokensAvailable: 750000,

    init : function() {
        console.log("App initialized...");
        return App.initWeb3();
    },

    initWeb3: function() {
        if (typeof window.ethereum !== 'undefined') {
            App.web3Provider = window.ethereum;
            web3 = new Web3(window.ethereum);
            // Request account access
            window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Log network ID for debugging
            window.ethereum.request({ method: 'eth_chainId' }).then(function(chainId) {
                console.log("Connected to network ID:", parseInt(chainId, 16));
            });
        } else if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }

        return App.initContracts();
    },

    initContracts: function() {
        $.getJSON("js/ParinTokenSale.json", function(parinTokenSale) {
            App.contracts.parinTokenSale = TruffleContract(parinTokenSale);
            App.contracts.parinTokenSale.setProvider(App.web3Provider);
            App.contracts.parinTokenSale.deployed().then(function(parinTokenSale) {
                console.log("Parin Token Sale Address:", parinTokenSale.address);
            });
        })
            .done(function() {
                $.getJSON("js/ParinToken.json", function(parinToken) {
                    App.contracts.parinToken = TruffleContract(parinToken);
                    App.contracts.parinToken.setProvider(App.web3Provider);
                    App.contracts.parinToken.deployed().then(function(parinToken) {
                        console.log("Parin Token Address:", parinToken.address);
                    });
                    return App.render();
                });
        })
    },

    listenForEvents: function() {
        App.contracts.parinTokenSale.deployed().then(function(instance) {
            instance.Sell({}, {
                fromBlock: 0,
                toBlock: 'latest',
            }).watch(function(error, event) {
                console.log("event triggered", event);
                App.render();
            });
        });
    },

    render: function() {
        if (App.loading) {
            return;
        }

        App.loading = true;
        var loader  = $(".loader");
        var content = $("#content");

        loader.show();
        content.hide();

        web3.eth.getCoinbase(function(err, account) {
            if (err === null) {
                App.account = account;
                $("#accountAddress").html("Your Account: " + account);
            }
        })

        App.contracts.parinTokenSale.deployed().then(function(instance) {
            parinTokenSaleInstance = instance;
            return parinTokenSaleInstance.tokenPrice();
        }).then(function(tokenPrice) {
            App.tokenPrice = tokenPrice;
            $('#token-price').html(web3.fromWei(App.tokenPrice, 'ether').toNumber());
            return parinTokenSaleInstance.tokensSold();
        }).then(function(tokensSold) {
            App.tokenSold = tokensSold.toNumber();
            $('.tokens-sold').html(App.tokenSold);
            $('.tokens-available').html(App.tokensAvailable);

            var progressPercent = (Math.ceil(App.tokenSold) / App.tokensAvailable) * 100;
            console.log("Progress Percent:", progressPercent);
            $('#progress').css('width', progressPercent + '%');

            App.contracts.parinToken.deployed().then(function(instance) {
                parinTokenInstance = instance;
                return parinTokenInstance.balanceOf(App.account);
            }).then(function(balance) {
                $('#user-tokens').html(balance.toNumber());
                App.loading = false;
                loader.hide();
                content.show();
            });

        });

        
    },

    buyTokens: function() {
        $("#content").hide();
        $(".loader").show();
        var numberOfTokens = $('#numberOfTokens').val();
        App.contracts.parinTokenSale.deployed().then(function(instance) {
            return instance.buyTokens(numberOfTokens, {
                from: App.account,
                value: numberOfTokens * App.tokenPrice,
                gas: 500000,
            });
        }).then(function(result) {
            console.log("Tokens bought...");
            $('form').trigger('reset'); // reset number of tokens in form
            // Wait for transaction to be mined, then refresh the page
            return App.render();
        });
    }
}

$(function() {
    $(window).load(function() {
        App.init();
    });
});