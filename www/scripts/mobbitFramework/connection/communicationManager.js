/**
 * Factory
 * The communication is defined through this class. 
 * The communication types allowed are: 
 * - realtime
 * - websocket
 * Example:
 * var communicator = new CommunicationFactory().load("websocket");
 * @returns {undefined}
 */
function CommunicationFactory() {
    Object.defineProperties(this, {
        // rewritable at the moment of load, it holds the default type chosen for fallback purposes in the future
        defaultType: {
            value: "realtime",
            writable: true
        },
        load: {
            value: function (type) {
                this.defaultType = type;
                if (type === "realtime") {
                    if (!(CommunicationFactory.prototype && CommunicationFactory.prototype.realtime)) {
                        CommunicationFactory.prototype = {};
                        CommunicationFactory.prototype.realtime = new RealtimeCommunicationManager();
                    }
                    return CommunicationFactory.prototype.realtime;
                }
                else if (type === "websocket") {
                    return new WebsocketCommunicationManager();
                }
                else if (type === "preview") {
                    return new DummyCommunicationManager();
                }
                else
                    debug("Invalid connection type passed, failed to establish a connection");
            },
            enumerable: true
        }
    });

    // ******************** CONNECTION PRODUCTS ********************

    /*
     * This is an abstract class that is takes care of the messaging based
     * communication with the server.
     * Communication classes must implement this class
     */
    function CommunicationManager() {

        Object.defineProperties(this, {
            inited: {
                value: false,
                enumerable: true,
                writable: true
            },
            version: {
                value: GlobalDefinitions.version || 1.0
            },
            subscriptions: {
                value: {},
                writable: true,
                enumerable: true
            },
            afterConnectOperations: {
                value: new Array(),
                writable: true
            },
            reconnectCallbacks: {
                value: new Array(),
                writable: true
            }
        });
        if (typeof window.addEventListener === 'undefined') {
            window.addEventListener = function (e, callback) {
                // for browsers that don't support addEventListener
                return window.attachEvent('on' + e, callback);
            };
        }
        // IMPORTANT! other applications could attach this same event and 
        // execute their code as well, both will be triggered.
        var self = this;
        window.addEventListener('beforeunload', function (event) {
            self.disconnect();
        }, false);
    }

    Object.defineProperties(CommunicationManager.prototype, {
        CONNECTING: {
            value: 0,
            enumerable: true
        },
        OPEN: {
            value: 1,
            enumerable: true
        },
        CLOSING: {
            value: 2,
            enumerable: true
        },
        CLOSED: {
            value: 3,
            enumerable: true
        },
        RECONNECTING: {
            value: 4,
            enumerable: true
        },
        connectRetryTime: {
            value: 10e3
        },
        isSubscribed: {
            value: function (ch) {
                return this.subscriptions[ch];
            },
            enumerable: true
        },
        sendAndReceiveOnce: {
            value: function (params) {
                var message = params.message;
                var sendChannel = params.sendChannel;
                var receiveChannel = params.receiveChannel;
                var onAnswer = params.onAnswer;
                var timeout = params.timeout || 30e3;
                var onTimeout = params.onTimeout;
                var timeoutObj = setTimeout(function (self) {
                    self.unsubscribe(receiveChannel);
                    onTimeout();
                }, timeout, this);
                var that = this;
                this.subscribe(receiveChannel, function (ch,
                        answer) {
                    clearTimeout(timeoutObj);
                    that.unsubscribe(receiveChannel);
                    onAnswer(answer);
                    onAnswer = null;
                    timeoutObj = null;
                    that = null;
                });
                this.send(sendChannel, message);
            },
            enumerable: true
        },
        readyState: {
            value: this.CLOSED,
            enumerable: true,
            writable: true
        },
        postponeWhenUnconnected: {
            value: function (operation) {
                if (this.isConnected())
                    operation(this);
                else
                    this.addToAfterConnect(operation);
            },
            enumerable: true
        },
        addReconnectCallback: {
            value: function (operation) {
                this.reconnectCallbacks.push(operation);
            },
            enumerable: true
        },
        executeReconnectCallbacks: {
            value: function () {
                for (var i = 0, len = this.reconnectCallbacks.length; i < len; i++) {
                    this.reconnectCallbacks[i](this);
                }
            },
            enumerable: true
        },
        reconnect: {
            value: function () {
                this.initReconnectCommunication();
            },
            enumerable: true
        },
        addToAfterConnect: {
            value: function (operation) {
                this.afterConnectOperations.push(operation);
            },
            enumerable: true
        },
        executeAfterConnectOperations: {
            value: function () {
                var operations = this.afterConnectOperations;
                this.afterConnectOperations = new Array();
                for (var i = 0, len = operations.length; i < len; i++) {
                    operations[i](this);
                }
            },
            enumerable: true
        },
        routeThisMessage: {
            value: function (ch, message) {
                var cb = this.subscriptions[ch];
                if (cb) {
                    debug("received message from " + ch);
                    cb(ch, message);
                }
            }
        },
        /**
         * Create a message VO according to the provided values.
         * REQUIRED: opts.type, opts.source, opts.destination must be defined and not empty or null
         */
        createMessageVO: {
            value: function (opts) {
                if (JSON && opts.type && opts.source && opts.destination) {
                    var messageVO = {
                        type: opts.type,
                        version: opts.version || this.version || 1.0,
                        source: opts.source,
                        destination: opts.destination,
                        answerChannel: opts.answerChannel || "",
                        size: opts.size || (opts.message && opts.message.length) || 0,
                        time: opts.time || new Date().getTime() / 1000 | 0,
                        messageType: "JSON",
                        message: opts.message || ""
                    };
                    return JSON.stringify(messageVO);
                }
                debug("Failed to create message VO, undefined properties! " + opts);
            },
            enumerable: true
        }
    });

    /*
     * This class encapsulates the realtime protocol 
     * and inherits from Communication Manager
     */
    function RealtimeCommunicationManager() {

        // inheritance of CommunicationManager class
        CommunicationManager.call(this);
        Object.defineProperties(this, {
            virtualHost: {
                value: GlobalDefinitions.realtime.appKey
            },
            token: {
                value: GlobalDefinitions.realtime.token || "myAuthToken"
            },
            url: {
                value: GlobalDefinitions.realtime.url,
                enumerable: true
            },
            clientId: {
                value: GlobalDefinitions.realtime.clientId || "mobbitSystems"
            },
            metaData: {
                value: GlobalDefinitions.realtime.metaData || "clientConnMeta"
            },
            inited: {
                value: false,
                enumerable: true,
                writable: true
            },
            ortcClient: {
                value: null,
                writable: true
            }
        });
    }

    RealtimeCommunicationManager.prototype = Object.create(CommunicationManager.prototype, {
        // I/O channels to communicate with message bridge through realtime
        messageBrigdeRealtimeSysClient: {
            value: "mobbit.realtime.system.client."
        },
        messageBrigdeRealtimeSysServer: {
            value: "mobbit.realtime.system.server"
        },
        getSessionId: {
            value: function () {
                return this.sessionId;
            },
            enumerable: true
        },
        loadScript: {
            value: function (url, callback)
            {
                // Adding the script tag to the head as suggested before
                var head = document.getElementsByTagName('head')[0];
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = url;

                // Then bind the event to the callback function.
                // There are several events for cross browser compatibility.
                script.onreadystatechange = callback;
                script.onload = callback;

                // Fire the loading
                head.appendChild(script);
            }
        },
        init: {
            value: function (afterCallback) {
                if (this.inited) {
                    afterCallback && afterCallback(this);
                    return;
                }
                this.inited = true;
                if (typeof IbtRealTimeSJType !== "undefined") {
                    this.start(afterCallback);
                }
                else {
                    // load external library
                    var self = this;
                    this.loadScript(GlobalDefinitions.realtime.cdn, function () {
                        self.start(afterCallback);
                        self = null;
                        afterCallback = null;
                    });
                }
            },
            enumerable: true
        },
        start: {
            value: function (afterCallback) {
                if (this.isConnected()) {
                    debug("Already connected");
                } else {
                    this.initORTC.call(this, function () {
                        this.readyState = this.OPEN;
                        // notify server of this client connection
                        var message = new MessageBridgeVO(9, this.getSessionId(), "");
                        this.ortcClient.send(this.messageBrigdeRealtimeSysServer, JSON.stringify(message));
                        this.subscribeMessageBridgeChannel();
                        afterCallback(this.ortcClient.communicationManager);
                        afterCallback = null;
                        this.executeAfterConnectOperations();
                    }, function () {
                        afterCallback(null);
                        afterCallback = null;
                    });
                }
            }
        },
        initReconnectCommunication: {
            value: function () {
                debug("TODO: not implemented!");
            }
        },
        subscribeMessageBridgeChannel: {
            value: function () {
//                if (this.isConnected()) {
//                    if (!this.isSubscribed(channel)) {
                this.ortcClient.subscribe(this.messageBrigdeRealtimeSysClient + this.getSessionId(), true, this.processOnMessage);
//                    }
//                } else {
//                    debug("unable to subscribe channel becasuse it is unconnected, postponed operation");
//                    var self = this;
//                    this.addToAfterConnect(function() {
//                        self.subscribeMessageBridgeChannel(self.messageBrigdeRealtimeSysClient + self.getSessionId());
//                        channel = null;
//                        self = null;
//                    });
//                }
            },
            enumerable: true
        },
        processOnMessage: {
            value: function (ortc, ch, message) {
//                debug("server message: " + message);
                var cm = ortc.communicationManager;
                var mObj = JSON && JSON.parse(message);
                if (mObj) {
                    switch (mObj.type) {
                        case 1:
                            // route message
                            var innerMessage = mObj.message;
                            try {
                                innerMessage = JSON && JSON.parse(mObj.message);
                            }
                            catch (err) {
                            }
                            cm.routeThisMessage(mObj.channel, innerMessage);
                            break;
                        case 2:
                            // server disconnected
                            debug("Server has lost internal connection!");
                            cm.onException && cm.onException(cm, mObj.message);
                            break;
                        case 3:
                            // subscribe
                        case 4:
                            // unsubscribe
                            if (mObj.message === 'OK') {
                                if (mObj.type === 3) {
                                    debug(" [RT] rabbit subscribed: " + mObj.channel);
                                    cm.onSubscribed && cm.onSubscribed(cm, mObj.channel);
                                }
                                else if (mObj.type === 4) {
                                    debug(" [RT] rabbit unsubscribed: " + mObj.channel);
                                    cm.onUnsubscribed && cm.onUnsubscribed(cm, mObj.channel);
                                }
                            }
                            else if (mObj.message === 'NOK') {
                                if (mObj.type === 3)
                                    debug("Fail to subscribe channel: " + mObj.channel);
                                else if (mObj.type === 4)
                                    debug("Fail to unsubscribe channel: " + mObj.channel);
                            }
                            else {
                                debug("Malformed received message! OK or NOK expected ->" + message);
                            }
                            break;
                        case 5:
                            // error
                            debug("exception: " + mObj.message);
                            cm.onException && cm.onException(cm, mObj.message);
                            break;
                        case 6:
                            // close
                            debug("close: " + mObj.message);
                            break;
                        case 7:
                            // server reconnecting
                            debug("server communications lost, reconnecting: " + mObj.message);
                            cm.onServerReconnecting && cm.onServerReconnecting(cm);
                            break;
                        case 8:
                            // server reconnected
                            debug("server communications restablished! " + mObj.message);
                            cm.onServerReconnected && cm.onServerReconnected(cm);
                            break;
                        case 9:
                            debug(" [RT] Connection established with the server");
                            cm.onServerConnected && cm.onServerConnected(cm);
                            break;
                        default:
                            debug("Unknow type of message: " + mObj.message);
                    }
                }
                else
                    debug("Malformed received message! " + message);
            }
        },
        subscribe: {
            value: function (ch, cb) {
                if (this.isConnected()) {
                    if (!this.isSubscribed(ch)) {
                        this.subscriptions[ch] = cb;
                        var message = new MessageBridgeVO(3, this.getSessionId(), [ch]);
                        this.ortcClient.send(this.messageBrigdeRealtimeSysServer, JSON.stringify(message));
//                        debug(" [RT] send to message bridge '" + JSON.stringify(message) + "' to channel '" + this.messageBrigdeRealtimeSysServer + "'");
                    }
                    else
                        debug("channel already subscribed: " + ch);
                } else {
                    debug("fail, subscribe channel: not connected, tying to postpone");
                    var self = this;
                    this.addToAfterConnect(function () {
                        self.subscribe(ch, cb);
                        ch = null;
                        cb = null;
                        self = null;
                    });
                }
            },
            enumerable: true
        },
//        isSubscribed: {
//            value: function(channel) {
//                if (this.isConnected()) {
//                    return this.ortcClient.isSubscribed(channel);
//                }
//                return false;
//            },
//            enumerable: true
//        },
        unsubscribe: {
            value: function (channel) {
                if (this.subscriptions[channel]) {
                    debug("unsubscribing channel: " + channel);
                    delete this.subscriptions[channel];
                }

                if (this.isConnected()) {
                    var message = new MessageBridgeVO(4, this.getSessionId(), [channel]);
                    this.ortcClient.send(this.messageBrigdeRealtimeSysServer, JSON.stringify(message));
                    debug("send to message bridge'" + JSON.stringify(message) + "' to channel '" + this.messageBrigdeRealtimeSysServer + "'");
                }
            },
            enumerable: true
        },
        send: {
            value: function (channel, message) {
                if (this.isConnected() && message) {
                    var messageVO = new MessageBridgeVO(1, this.getSessionId(), message, channel);
                    this.ortcClient.send(this.messageBrigdeRealtimeSysServer, JSON.stringify(messageVO));
                }
                else
                    debug("failed to send message to " + channel + ", not connected");
            },
            enumerable: true
        },
        disconnect: {
            value: function () {
                // TODO: must send a disconnect message to server
                this.subscriptions = {};
                this.readyState = this.CLOSING;
                this.inited = false;
                if (this.ortcClient) {
                    var messageVO = new MessageBridgeVO(6, this.getSessionId(), "");
                    this.ortcClient.send(this.messageBrigdeRealtimeSysServer, JSON.stringify(messageVO));
                    this.ortcClient.disconnect();
                }
                for (var ch in this.subscriptions) {
                    this.unsubscribe(ch);
                }
            },
            enumerable: true
        },
        isConnected: {
            value: function () {
                return (navigator.onLine && this.inited && this.readyState === this.OPEN);
            },
            enumerable: true
        },
        reconnect: {
            value: function () {
                debug("trying to connect again to realtime ... ");
                if (this.isConnected()) {
                    this.ortcClient.connect(this.appkey, this.token);
                } else if (!this.ortcClient) {
                    this.initORTC(null);
                }
            },
            enumerable: true
        },
        initORTC: {
            value: function (successCallback, errorCallback) {
                if (!navigator.onLine) {
                    errorCallback();
                    return;
                }
                var self = this;
                loadOrtcFactory(
                        IbtRealTimeSJType,
                        function (factory, error) {
                            if (error != null) {
                                debug(" [RT] factory error: " + error.message);
                            } else {
                                if (factory) {

                                    // Create ORTC client
                                    var ortcClient = factory.createClient();
                                    if (!ortcClient) {
                                        debug("unable to connect to realtime");
                                    }

                                    // populate ortcClient with required data
                                    ortcClient.communicationManager = self;
                                    ortcClient.afterConnectCallback = successCallback;
                                    ortcClient.afterErrorConnectCallback = errorCallback;
                                    self.ortcClient = ortcClient;
                                    successCallback = null;
                                    errorCallback = null;

                                    // Set ORTC client properties
                                    ortcClient
                                            .setId(GlobalDefinitions.realtime.clientId);
                                    ortcClient
                                            .setConnectionMetadata(GlobalDefinitions.realtime.metaData);
                                    ortcClient
                                            .setClusterUrl(GlobalDefinitions.realtime.url);
                                    // CONNECTED handler
                                    ortcClient.onConnected = function (ortc) {
                                        var cm = ortc.communicationManager;
                                        cm.readyState = cm.OPEN;
                                        var sid = ortc.getSessionId() || GlobalDefinitions.getTime("ms");
                                        Object.defineProperty(cm, "sessionId", {
                                            value: GlobalDefinitions.communications.appID ? GlobalDefinitions.communications.appID + "." + sid : GlobalDefinitions.getTime("ms") + "." + sid
                                        });

                                        if (ortc.afterConnectCallback) {
                                            ortc.afterConnectCallback.call(cm);
                                        }
                                        delete ortc.afterConnectCallback;
                                        cm.onConnected && cm.onConnected(ortc);
                                    };
                                    // DISCONNECTED handler
                                    ortcClient.onDisconnected = function (ortc) {
                                        debug(" [RT] disconnected");
                                        var cm = ortc.communicationManager;
                                        cm.readyState = cm.RECONNECTING;
                                        delete cm.sessionId;
                                        // cm.inited = false;
                                        cm.onDisconnected && cm.onDisconnected(cm);
                                    };
                                    // ONSUBSCRIBED handler
                                    ortcClient.onSubscribed = function (ortc, channel) {
                                        debug(" [RT] subscribed channel: " + channel);
                                    };
                                    // ONUNSUBSCRIBED handler
                                    ortcClient.onUnsubscribed = function (ortc, channel) {
                                        debug(" [RT] unsubscribed channel: " + channel);
                                    };
                                    // ONEXCEPTION handler
                                    ortcClient.onException = function (ortc, exception) {
                                        debug(" [RT] exception: " + exception);
                                        ortc.communicationManager.onException && ortc.communicationManager.onException(ortc.communicationManager, exception);
                                    };
                                    // ONRECONNECTING handler
                                    ortcClient.onReconnecting = function (ortc) {
                                        ortc.communicationManager.readyState = ortc.communicationManager.RECONNECTING;
                                        debug(" [RT] onReconnecting");
                                        ortc.communicationManager.onReconnecting && ortc.communicationManager.onReconnecting(ortc.communicationManager);
                                    };
                                    // ONRECONNECTED handler
                                    ortcClient.onReconnected = function (ortc) {
                                        ortc.communicationManager.readyState = ortc.communicationManager.OPEN;
                                        debug(" [RT] onReconnected");
                                        ortc.communicationManager.onReconnected && ortc.communicationManager.onReconnected(ortc.communicationManager);
                                    };
                                    debug(" [RT] starting realtime connection ... " + GlobalDefinitions.realtime.url);
                                    ortcClient.connect(GlobalDefinitions.realtime.appKey, GlobalDefinitions.realtime.token);
                                }
                                self = null;
                            }
                        });
            },
            enumerable: true
        }
    });

    /**
     * This class encapsulates the websocket protocol 
     * and inherits from Communication Manager
     */
    function WebsocketCommunicationManager() {
        CommunicationManager.call(this);

        Object.defineProperties(this, {
            inited: {
                value: false,
                writable: true,
                enumerable: true
            },
            client: {
                value: null,
                writable: true
            },
            readyState: {
                value: this.CLOSED,
                writable: true
            }
        });
    }
    ;

    WebsocketCommunicationManager.prototype = Object.create(CommunicationManager.prototype, {
        init: {
            value: function (successCb) {
                if (this.isConnected()) {
                    debug("Already connected");
                    return;
                }
                else {
                    this.initWebsocket(successCb);
                }
            },
            enumerable: true
        },
        initWebsocket: {
            value: function (successCb) {
                // TODO: check if in a LAN environment this flag apply!
                if (!navigator.onLine) {
                    successCb(null);
                    return;
                }

                if ("WebSocket" in window) {
                    this.errorTimeout = setTimeout(function (callback) {
                        debug("fail, websocket connection timeout!");
                        callback(null);
                    }, GlobalDefinitions.websocket.timeout, successCb);

                    this.client = new WebClient(GlobalDefinitions.websocket.url);
                    this.client.init(this, successCb, this.errorTimeout);
                    this.inited = true;
                }
                else {
                    debug("Websockets not supported!");
                    callback(null);
                    this.onException && this.onException(this, "Websockets not supported");
                }
            },
            enumerable: true
        },
        /**
         * @deprecated
         */
        initReconnectCommunication: {
            value: function () {
                debug("deprecated!!!");
            },
            enumerable: true
        },
        onMessage: {
            value: function (ch, message) {
                this.routeThisMessage(ch, message);
            }
        },
        restartSubscriptions: {
            value: function () {
                for (var ch in this.subscriptions) {
                    this.client.subscribe(ch, this.subscriptions[ch]);
                }
            },
            enumerable: true
        },
        subscribe: {
            value: function (ch, cb) {
                if (this.isConnected()) {
                    if (!this.isSubscribed(ch)) {
                        this.subscriptions[ch] = cb;
                        return this.client.subscribe(ch, cb);
                    }
                    else {
                        this.client.onException(this, "channel already subscribed: " + ch);
                    }
                } else
                    this.client.onException(this, "failed to subscribe channel: " + ch + ", not connected");
            },
            enumerable: true
        },
        unsubscribe: {
            value: function (ch) {
                if (this.isConnected()) {
                    if (this.subscriptions[ch]) {
                        delete this.subscriptions[ch];
                    }
                    return this.client.unsubscribe(ch);
                } else
                    this.client.onException(this, "fail, unsubscribe channel: not connected");
            },
            enumerable: true
        },
        send: {
            value: function (ch, msg) {
                if (this.isConnected())
                    return this.client.send(ch, msg);
                else
                    this.client.onException(this, "fail, send message: not connected");
            },
            enumerable: true
        },
        disconnect: {
            value: function () {
                this.subscriptions = {};
                this.readyState = this.CLOSING;
                if (this.client) {
                    this.client.disconnect();
                }
                this.inited = false;
            },
            enumerable: true
        },
        isConnected: {
            value: function () {
                return this.client && navigator.onLine && this.inited && this.client.isConnected();
            },
            enumerable: true
        }
    });
    /**
     * for WEBSOCKET connection only
     * 
     * This class is responsible to create the connection through websockets and 
     * register the necessary handlers
     * @param {type} url - the url of the server holding the websocket endpoint
     */
    function WebClient(url) {

        // make use of the "manager" property that has pointer to WebsocketCommunicationManager if needed

        Object.defineProperties(this, {
            url: {
                value: url
            },
            maxWebSocketFrameSize: {
                value: (16 * 1024)
            },
            connected: {
                value: false,
                writable: true
            },
            init: {
                value: function (manager, successCb, timeoutID) {
                    this.manager = manager;
//                    this.client.onMessage = function(wsc, channel, message) {
//                        debug(" [WS] on message from " + channel);
//                        wsc.routeThisMessage && wsc.routeThisMessage(channel, message);
//                    };
                    this.onConnected = function (wscm) {
                        debug(" [WS] : websocket connection");
                        clearTimeout(timeoutID);
                        wscm.executeAfterConnectOperations();
                        successCb(wscm);
                        timeoutID = null;
//                        successCb = null;
//                        self.executeAfterConnectOperations();
//                        successCb(self);
                        wscm.onConnected && wscm.onConnected(wscm);
                    };
                    this.onDisconnected = function (wscm) {
                        debug(" [WS] : disconnected: " + wscm.client.url);
                        wscm.onDisconnected && wscm.onDisconnected(wscm);
                    };
                    this.onSubscribed = function (wscm, ch) {
                        debug(" [WS] : subscribed channel: " + ch);
                        wscm.onSubscribed && wscm.onSubscribed(wscm, ch);
                    };
                    this.onUnsubscribed = function (wscm, ch) {
                        debug(" [WS] : unsubscribed channel: " + ch);
                        wscm.onUnsubscribed && wscm.onUnsubscribed(wscm, ch);
                    };
                    this.onException = function (wscm, exception) {
                        debug(" [WS] : exception: " + exception);
                        wscm.onException && wscm.onException(wscm, exception);
                    };
                    this.onReconnecting = function (wscm) {
                        debug(" [WS] : onReconnecting");
                        wscm.onReconnecting && wscm.onReconnecting(wscm);
                    };
                    this.onServerDisconnected = function (wscm) {
                        debug(" [WS] : onServerDisconnected");
                        wscm.onServerDisconnected && wscm.onServerDisconnected(wscm);
                    };
                    this.onServerReconnecting = function (wscm) {
                        debug(" [WS] : onServerReconnecting");
                        wscm.onServerReconnecting && wscm.onServerReconnecting(wscm);
                    };
                    this.onServerReconnected = function (wscm) {
                        debug(" [WS] : onServerReconnected");
                        wscm.onServerReconnected && wscm.onServerReconnected(wscm);
                    };
                    this.onReconnected = function (wscm) {
                        debug(" [WS] : onReconnected");
                        clearTimeout(timeoutID);
                        wscm.executeAfterConnectOperations();
                        wscm.executeReconnectCallbacks();
                        wscm.restartSubscriptions();
                        wscm.onReconnected && wscm.onReconnected(wscm.manager);
                    };
                    // TODO: the connection should contain an authentication to be register in the server so that it doesn't interfere with other connections
                    this.connect("", "");
                }
            }
        });
    }

    Object.defineProperties(WebClient.prototype, {
        /**
         * Websocket server message receiver
         */
        onMessage: {
            value: function (evt) {
                var wsc = this.client;
                var manager = wsc.manager;

                var mObj;
                try {
                    mObj = JSON && JSON.parse(evt.data);
                }
                catch (err) {
                }

                if (mObj) {
                    switch (mObj.type) {
                        case 1:
                            var innerMessage = mObj.message;
                            try {
                                innerMessage = JSON && JSON.parse(mObj.message);
                            }
                            catch (err) {
                            }
//                                self.manager.routeThisMessage(mObj.channel, innerMessage);
                            manager.onMessage(mObj.channel, innerMessage);
                            break;
                        case 2:
                            wsc.onException(wsc, "Server has lost internal connection!");
                            wsc.onServerDisconnected(manager);
                            break;
                        case 3:
                        case 4:
                            if (mObj.message === 'OK') {
                                if (mObj.type === 3 && typeof manager.onSubscribed === 'function')
                                    wsc.onSubscribed(manager, mObj.channel);
                                else if (mObj.type === 4 && typeof wsc.onUnsubscribed === 'function')
                                    wsc.onUnsubscribed(manager, mObj.channel);
                            }
                            else if (mObj.message === 'NOK') {
                                if (mObj.type === 3)
                                    wsc.onException(manager, "Fail to subscribe channel: " + mObj.channel);
                                else if (mObj.type === 4)
                                    wsc.onException(manager, "Fail to unsubscribe channel: " + mObj.channel);
                            }
                            else {
                                wsc.onException(manager, "Malformed received message! OK or NOK expected ->" + evt.data);
                            }
                            break;
                        case 5:
                            // error
                            wsc.onException(manager, mObj.message);
                            break;
                        case 6:
                            // close
                            wsc.onException(manager, "close: " + mObj.message);
                            break;
                        case 7:
                            // server reconnecting
                            debug("server communications lost, reconnecting: " + mObj.message);
                            wsc.onServerReconnecting(manager);
                            break;
                        case 8:
                            // server reconnected
                            debug("server communications restablished! " + mObj.message);
                            wsc.onServerReconnected(manager);
                            break;
                        default:
                            wsc.onException(manager, "Unknow type of message: " + mObj.message);
                    }
                }
                else
                    wsc.onException(manager, "Malformed received message! " + evt.data);
            }
        },
        /**
         * Websocket server connection established
         */
        onOpen: {
            value: function () {
                var wsc = this.client;
                var manager = wsc.manager;
                wsc.connected = true;

                var previous = manager.readyState;
                manager.readyState = manager.OPEN;

                if (previous === manager.RECONNECTING)
                    wsc.onReconnected(manager);
                else
                    wsc.onConnected(manager);
            }
        },
        /**
         * Websocket server connection terminated
         */
        onClose: {
            value: function () {
                var wsc = this.client;
                var manager = wsc.manager;

                wsc.connected = false;
                if (wsc.onDisconnected) {
                    wsc.onDisconnected(manager);
                }

                // check if it was wanted or not
                if (manager.readyState !== manager.CLOSING) {
                    manager.readyState = manager.RECONNECTING;
                    wsc.reconnect();
                }
            }
        },
        /**
         * Websocket server connection error event
         */
        onError: {
            value: function (error) {
                if (this.client) {
                    this.client.onException(this.client.manager, "websocket connection reported an error");
                }
                console.error(' [WS] error ', error);
            }
        },
        reconnect: {
            value: function () {
                if (!this.connectRetryTimeout) {
                    this.connectRetryTimeout = setTimeout(function (self) {
                        clearTimeout(self.connectRetryTimeout);
                        self.connectRetryTimeout = null;
                        self.ws = null; // discard previous connection
                        self.connect(self.user, self.pass);
                    }, this.manager.connectRetryTime, this);
                    this.onReconnecting(this.manager);
                }
            }
        },
        connect: {
            value: function (user, pass) {
                debug("ws: starting webocket connection ...  " + this.url);
                // FIXME: user and pass are not currently being used
                if (this.ws) {
                    this.onException(this.manager, "Already connected!");
                    return;
                }

                this.user = user;
                this.pass = pass;

                this.ws = new WebSocket(this.url);
                this.ws.client = this; // doesn't work in SAMSUNG

                // websocket callbacks
                this.ws.onmessage = this.onMessage;
                this.ws.onopen = this.onOpen;
                this.ws.onclose = this.onClose;
                this.ws.onerror = this.onError;
            },
            enumerable: true
        },
        disconnect: {
            value: function () {
                if (this.isConnected()) {
                    this.ws.close();
                }
                else {
                    this.onException(this.manager, "Not connected");
                }
            },
            enumerable: true
        },
        subscribe: {
            value: function (ch, cb) {
                if (this.isConnected()) {
                    var channels = (Array.isArray(ch)) ? ch : [ch];
                    var msg = new MessageBridgeVO(3, this.getSessionId(), channels);
                    this.ws.send(JSON.stringify(msg));
                }
                else {
                    this.onException(this.manager, "Not connected");
                }
            },
            enumerable: true
        },
        unsubscribe: {
            value: function (ch) {
                if (this.isConnected()) {
                    var channels = (Array.isArray(ch)) ? ch : [ch];
                    var msg = new MessageBridgeVO(4, this.getSessionId(), channels);
                    this.ws.send(JSON.stringify(msg));
                }
                else {
                    this.onException(this.manager, "Not connected");
                }
            },
            enumerable: true
        },
        isConnected: {
            value: function () {
                return this.ws && this.connected;
                // && this.ws.readyState == 1;
            },
            enumerable: true
        },
        send: {
            value: function (ch, m) {
                if (this.isConnected() && ch && m) {
                    var msg = new MessageBridgeVO(1, this.getSessionId(), m, ch);
                    this.ws.send(JSON.stringify(msg));
                    return true;
                }
                return false;
            },
            enumerable: true
        },
        getUrl: {
            value: function () {
                return this.url;
            },
            enumerable: true
        },
        getSessionId: {
            value: function () {
                return "";
            },
            enumerable: true
        }
    }); // end of prototype


    /**
     * This class is responsible to hold all public method without any 
     * relevant implementation, like simple stubs
     * @returns {undefined}
     */
    function DummyCommunicationManager() {
        CommunicationManager.call(this);
    }

    DummyCommunicationManager.prototype = Object.create(CommunicationManager.prototype, {
        init: {
            value: function (callback) {
                callback && callback();
            }
        },
        isConnected: {
            value: function () {
                return true;
            }
        },
        subscribe: {
            value: function () {
            }
        },
        unsubscribe: {
            value: function () {
            }
        },
        send: {
            value: function () {
            }
        },
        disconnect: {
            value: function () {
            }
        }
    });
}

var MessageBridgeVO = function (type, sessionId, message, channel) {
    this.id = sessionId;
    this.type = type;
    this.channel = (channel) ? channel : 'mobbit.messageBridge.system';
    this.message = message;
};

var debug = debug || console.log.bind(console);