/**
 * Created by FranciscoGuilherme on 22/04/16.
 */


define(['scripts/api/connectors/WebsocketClient.js'], function (WebsocketClient) {


    var communicationHandler, webSocket, messageHandler, groupVO;


    getGroupInitialInfoVO = function () {
        return {
            groupVO: {
                groupId: null,
                groupName: null,
                groupDescription: null,
                storeVO: null,
                typeGroupVO: null,
                state: null,
                stateReason: null,
                businessState: null,
                idevices: [],
                isJBPMInstantiated: null
            },
            userVO: {
                id: null,
                lastName: null,
                firstName: null,
                phone: null,
                email: null,
                clientVO: null,
                iappRoles: []
            },
            channelsVO: {channelsToPublish: null, channelsToSubscribe: null},
            attendanceType: {userAttendanceTypeId: null, userAttendanceTypeName: null}
        };
    };

    getDeviceVO = function () {
        return {
            deviceGroupId: null,
            deviceId: null,
            deviceName: null,
            deviceDescription: null,
            serviceVO: null,
            actionVO: null,
            schedules: null,
            isAvailable: null,
            presentationOrder: null
        };
    };

    getServiceVO = function () {
        return {
            clientVO: null,
            serviceId: null,
            hasForm: null,
            priorityService: null,
            answerProcedure: null,
            serviceName: null,
            serviceDescription: null,
            serviceParentId: null,
            schedules: null,
            code: null,
            isAvailable: null,
            storeId: null,
            serviceConditions: null,
            questionnaireVO: null
        };
    };

    getTicketMonitorVO = function () {
        return {
            serviceVO: getServiceVO(),
            deskCode: null,
            ticketNumber: null
        };
    };

    startConnection = function () {
        webSocket = WebsocketClient;
        webSocket.start(Config.message_contacline.host, {
            messageHandler: internalMessageHandler,
            communicationHandler: communicationHandler
        });
    };


    internalMessageHandler = function (message) {
        if (messageHandler) {
            Mobline2MessageVOParser(message).map(function (item) {
                messageHandler('', item);
            });
        }
    };


    Mobline2MessageVOParser = function (message) {
        var result = [];
        var x2js = new X2JS();

        if(message != 'HIDE') {
            var messageItem = x2js.xml_str2json(message).message;

            if (messageItem.hasOwnProperty('tickets')) {
                result.push(buildServicesData(messageItem));
                result.push(buildUpdateData(messageItem));
            } else if (messageItem.hasOwnProperty('ticket')) {
                result.push(ticketData(messageItem));
            }
        }else {
            result.push({
                type: 32,
                message: JSON.stringify('')
            });
        }

        return result;
    };

    function buildUpdateData(messageItem) {
        var messageType = 40;
        var result = {};
        result['itickets'] = {};

        messageItem.tickets.ticket.map(function (item) {
            result.itickets[item.service.id] = {
                ticketNumber: item.number,
                deskCode: item.destination.text
            };
        });

        return {type: messageType, message: JSON.stringify(result)};
    }

    function buildServicesData(messageItem) {
        var result = getGroupInitialInfoVO();
        var messageType = 13;

        result.groupVO.groupId = messageItem.id;

        result.groupVO.state = 1;
        result.stateReason = "Online";

        messageItem.tickets.ticket.map(function (item) {
            var device = getDeviceVO();
            var service = getServiceVO();

            service.serviceId = item.service.id;
            service.code = item.service.identifier;
            service.serviceName = item.service.name_dispenser_screen;
            service.serviceDescription = "";
            service.isAvailable = true;
            service.serviceParentId = 0;

            device.deviceId = item.service.id;
            device.actionVO = {actionId: 13};
            device.isAvailable = true;
            device.serviceVO = service;
            device.presentationOrder = 0;

            result.groupVO.idevices.push(device);
        });

        result.groupVO.storeVO = {
            storeId: 1,
            welcomeMessage: ''
        };

        groupVO = result.groupVO;

        return {type: messageType, message: JSON.stringify(result)};
    };

    function ticketData(messageItem) {

        console.log("::: messageItem: " + JSON.stringify(messageItem));

        var result = getTicketMonitorVO();
        var messageType = 33;
        result.serviceVO.serviceId = messageItem.ticket.service.id;
        result.deskCode = messageItem.ticket.destination.text;
        result.ticketNumber = messageItem.ticket.number;
        result.code = messageItem.ticket.service.identifier;

        return {type: messageType, message: JSON.stringify(result)};
    }


    messageVO2MoblineParser = function (messageVO) {
        var result = '';
        switch (messageVO.type) {
            case 13:
                result = 'REGTECRA ' + Config.message_contacline.reg_port;
                break;
            case 9:
                result = "IMPRSENH " + groupVO.groupId + " " + messageVO.message;
                break;
        }
        return result;
    };


    return {

        init: function (handler) {
            communicationHandler = handler;
            startConnection();
            if (communicationHandler.onConnected)communicationHandler.onConnected();
        },
        initWebsocket: function () {

        },
        onMessage: function () {
            console.log('new Message');
        },
        restartSubscriptions: function () {

        },
        subscribe: function (channel, mHandler) {
            messageHandler = mHandler;
        },
        unsubscribe: function () {

        },
        send: function (channel, message) {
            webSocket.send(message);
        },
        disconnect: function () {
            webSocket.close();
            if (communicationHandler.onDisconnected) communicationHandler.onDisconnected();

        },
        isConnected: function () {
            return webSocket.isConnected();
        },
        createMessageVO: function (messageVO) {
            return messageVO2MoblineParser(messageVO);
        }
    };
});
