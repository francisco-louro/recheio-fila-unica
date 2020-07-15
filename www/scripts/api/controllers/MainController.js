define([
    "api/Connection",
    "api/ConnectionContactline",
    "api/MessageAPI",
    "api/controllers/ServiceController",
    "api/views/MonitorView",
], function (
    Connection,
    ConnectionContactline,
    MessageAPI,
    ServiceController,
    MonitorView
) {
    var _th, _answerChannel, _groupId, _storeId;

    /*==========  Initital Info  ==========*/

    function setInitialInfo() {
        console.log("setInitialInfo");
        !Config.console.state ? (console.log = function () {}) : "";

        _answerChannel = Config.message_bridge.answer_channel;
        if (Config.message_bridge.unique_channel)
            _answerChannel += "_" + Math.round(new Date() / 1000);

        // Get app 'groupId' from url param
        _groupId = 1; /*parseInt(Utils.getQueryParams().groupId);*/

        /*if (isNaN(_groupId)) {
            MonitorView.updateState(0, Config.messages.group_id_error1, false);
            return;
        }*/


        configureListeners();
        initConnection();
    }

    /*==========  Listeners  ==========*/

    function configureListeners() {
        $(MessageAPI)
            .off()
            .on("ServicesData", onServicesData)
            .on("TicketsData", onTicketsData)
            .on("MonitorTicketData", onMonitorTicketData)
            .on("ErrorData", onErrorData)
            .on("hidePopUp", onHidePopUp);
    }

    /*==========  Connection  ==========*/

    function initConnection() {
        console.log("initConnection");

        Connection.connect();

        $(Connection)
            .off()
            .on("Connected", onConnected)
            .on("Disconnected", function (e) {})
            .on("Reconnected", onReconnect)
            .on("Failed", function (e) {});
    }

    /*==========  Connection Handlers  ==========*/

    function onConnected() {
        console.log("onConnected");
        MessageAPI.init(Connection);
        setcommunicationParameters();
    }

    function onReconnect() {
        setcommunicationParameters();
    }

    function setcommunicationParameters() {
        Connection.subscribeChannel(_answerChannel);
        Connection.subscribeChannel(
            "ContactLineManagerMonitorActualInfoResponse_" + _groupId
        );

        if (Config.monitor.voiceControllerEndPoint) {
            /*WebsocketClient.start(Config.monitor.voiceControllerEndPoint, function (data) {
                       var messageVO = JSON.parse(data);
                       if (messageVO.type == 33) {
                       console.log("mostra mensagem " + new Date().getTime());
                       onMonitorTicketData(null, JSON.parse(messageVO.message));
                       } else if (messageVO.type == 32) {
                       console.log("esconde mensagem " + new Date().getTime());
                       onHidePopUp();
                       }

                       })*/
        } else {
            Connection.subscribeChannel(
                "ContactLineManagerShowTicketRequest_" + _groupId
            );
        }

        MessageAPI.getMonitorData(_answerChannel, _groupId);
    }

    /*==========  Message Handlers  ==========*/

    function onServicesData(e, data) {
        _storeId = data.groupVO.storeVO.storeId;

        if (!validateState(data)) return;

        ServiceController.processData(data);

        MonitorView.renderServices(ServiceController.services);

        MessageAPI.getTicketsStatus(_answerChannel, data.groupVO.storeVO.storeId);
    }

    function onTicketsData(event, data) {
        console.log("::: onTicketsData: " + JSON.stringify(data));
        ServiceController.updateData(data);
        MonitorView.highlightTicket(ServiceController.services, data.serviceId);
        MonitorView.updateTickets(ServiceController.services);
        MonitorView.updatePopUp(
            data.serviceVO,
            ServiceController.services
        ); /* new to display actual values in popup in normal state */
    }

    function onMonitorTicketData(e, data) {
        console.log(
            ":: onMonitorTicketData: " + JSON.stringify(data.serviceVO.ticketNumber)
        );

        ServiceController.updateTicketData(data);
        if (Config.monitor.popUp.enabled) {
            MonitorView.highlightPopUp(
                ServiceController.services,
                data.serviceVO.serviceId
            );
            MonitorView.updatePopUp(data.serviceVO, ServiceController.services);
        } else {
            MonitorView.highlightTicket(
                ServiceController.services,
                data.serviceVO.serviceId
            );
        }
        MonitorView.updateTickets(ServiceController.services);
    }

    function onHidePopUp() {
        MonitorView.hidePopUp();
    }

    function onErrorData(e, data) {
        var message;
        var isGroupError = data.errors.ERROR.indexOf("groupId") !== -1;
        if (isGroupError) message = Config.messages.group_id_error2;

        MonitorView.updateState(0, message, false);
    }

    /*==========  State  ==========*/

    function validateState(data) {
        if (data.groupVO.state !== 1) {
            MonitorView.updateState(0, Config.messages.unavailable);
            console.log(" [App] : ", data.groupVO.stateReason);
            return false;
        }

        if (data.groupVO.idevices.length === 0) {
            MonitorView.updateState(0, Config.messages.unavailable);
            console.log(" [App] : No Services available.");
            return false;
        }

        return true;
    }

    return {
        init: function () {
            console.log("init MainController");
            _th = this;

            MonitorView.init();

            setInitialInfo();
        },
    };
});