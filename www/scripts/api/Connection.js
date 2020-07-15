define([
    'scripts/api/communication/MoblineCommunicationManager.js',
    Config.message_bridge.url + '/mobbitFramework/definitions.js',
    Config.message_bridge.url + '/mobbitFramework/connection/communicationManager.js'

], function (MoblineCommunicationManager) {
    var _th;
    var _comm;

        function getType(type) {

            var webKit = /WebKit/.test(navigator.userAgent),
            webkitVersion = -1,
            websocketsAvailable = false;

            if(webKit) webkitVersion =  parseInt(/WebKit\/([\d.]+)/.exec(navigator.userAgent)[1].split('.')[0]);
            if(Modernizr.websockets && webkitVersion >= 535) websocketsAvailable = true;

            return !websocketsAvailable || type === 'realtime' ? 'realtime' : 'websocket';
        }

     function onConnection(communication) {

        if(communication) {
            communication.onConnected = function() { $(_th).trigger("Connected"); };
            communication.onDisconnected = function() { $(_th).trigger("Disconnected"); };
            communication.onReconnected = function() { $(_th).trigger("Reconnected"); };
            communication.onSubscribed = function() { $(_th).trigger("Subscribed"); };
            communication.onUnsubscribed = function() { $(_th).trigger("Unsubscribed"); };
        } else {
            $(_th).trigger("Failed");
        }
    }

    function processResponse(channel, messageVO) {

       $(_th).trigger("Message", messageVO);
    }

    return {

        connect: function (type) {
            _th = this;
            if (Config.isPlatform360Server) {
                _comm = new CommunicationFactory().load(getType(type));
            } else {
                _comm = MoblineCommunicationManager;
            }

            _comm.init(onConnection);
        },

        subscribeChannel: function(channel) {

            console.log(" [Connection] : Subscribe : " + channel);

            _comm.subscribe(channel, function(channel, messageVO) {
                processResponse(channel, messageVO)
            });
        },

        sendMessage: function(channel, messageVO) {

            if(_comm.isConnected()) {
                _comm.send(channel, messageVO);
            } else {
                console.log(" [Connection] : Disconnected. " + messageVO + " not sent.");
            }
        },

        get comm() { return _comm; }
    };
});