define(['api/models/ObjGroupVO'],function() {


    var _th;
    var _url;
    var _socket;
    var _messageHandler;
    var _connectionInterval;

     function ConnectionMobline(){

     }

    function handleConnection() {
        try {
            _socket = new WebSocket(_url);

            console.log("_socket: " + _socket);
            console.log("_url: " + _url);
            _socket.onopen = function () {
                console.log("onopen");
               _th.sendMessage(_messageHandler);

            };

            _socket.onmessage = function (msg) {
                console.log("onmessage");
                if (msg) {
                    if (msg.type == 'message') {

                    console.log(msg.data);

                    var xmlDoc = new DOMParser().parseFromString(msg.data, "application/xml");
                    var dataObj = xmlToJson.dataToConvert(xmlDoc);

                    console.log("xml: " + dataObj);

                    var dataVO = groupVO;

                    console.log("tickets length: " + dataObj.message.tickets.ticket.length);

                    var arrTickets = dataObj.message.tickets.ticket;
                    var totalItems = arrTickets.length;

                    for(var i = 0; i < totalItems;i++){


                        dataVO.iDevices.push({
                            deviceGroupId: 0,
                            deviceId: arrTickets[i].entity.id['#text'],
                            deviceName: arrTickets[i].entity.name['#text'],
                            deviceDescription: "",
                            serviceVO: {
                                clientVO: "",
                                serviceId: arrTickets[i].service.id['#text'],
                                hasForm: false,
                                priorityService: "",
                                answerProcedure: "",
                                serviceName: arrTickets[i].service.name_dispenser_screen['#text'].split('|')[0],
                                serviceDescription: arrTickets[i].service.name_dispenser_screen['#text'],
                                serviceParentId: "",
                                iSchedules: [],
                                code: arrTickets[i].service.identifier['#text'],
                                isAvailable: false,
                                storeId: arrTickets[i].local.id['#text'],
                                serviceConditions: "",
                                questionnaireVO: "",
                                mobileScheduleId: 0,
                                isSchedulingTicketActive: false,
                                isRemoteTicketActive: false,
                                schedulingTicketActive: false,
                                userCounterConfig: "",
                                counterAlerts: 0
                            },
                            actionVO: "",
                            iSchedules: [],
                            isAvailable: false,
                            presentationOrder: 0
                        });
                    }

                }

                //
                $(_th).trigger("Message", dataVO);

                }
            }

            _socket.onclose = function () {
                console.log("onclose");
                reset();
            };

            _socket.onerror = function (event) {
                console.log("onerror");
                reset();
            }

        } catch (exception) {
            reset();
        }
    }

    function checkConnectionStatus() {

        if (_socket) {
            switch (_socket.readyState) {
                case 0:
                    console.log("Connecting to mobline ");
                    break;
                case 1:
                    console.log("Yuppi, I'm connected to mobline");
                    break;
                case 2:
                    console.log("Closing connection to mobline");
                    break;
                case 3:
                    console.log("I'll try to connect to mobline");
                    _socket = null;
                    handleConnection();
                    break;
            }
        } else {
            console.log("Reset mobline connection");
            handleConnection();
        }
    }

    function reset() {
        console.log('Reconnecting to ' + _url);
        checkConnectionStatus();
    }

    return {
        start: function (url, handler) {
            _th = this;
            _url = url;
            _messageHandler = handler;
            handleConnection();
           _connectionInterval = setInterval(checkConnectionStatus, 30000);
        },
        sendMessage: function(message) {
            if(_socket && _socket.readyState === 1) {
                _socket.send(message);
                console.log(" [Connection] : sendMessage. " + message + " to sent.");
            } else {
                console.log(" [Connection] : Disconnected. " + message + " not sent.");
            }
        }
    };
});