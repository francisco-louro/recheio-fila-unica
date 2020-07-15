define(function () {

    var _th,
        _connection,
        _source = 'MessageApi';

    function onMessage(e, res) {

        var data = JSON.parse(res.message);

        switch (res.type) {
            case 13:
                console.log(" [Message] : (" + res.type + ") Services Data ",  data);
                _th.trigger("ServicesData", data);
                break;
            case 31:
                if(!data.successOperation) {
                    console.log(" [Message] : (" + res.type + ") Error ",  data);
                    _th.trigger("ErrorData", data);
                }
                break;
            case 33:
                console.log(" [Message] : (" + res.type + ") Monitor Ticket Data ",  data);
                _th.trigger("MonitorTicketData", data);
                break;
            case 40:
                console.log(" [Message] : (" + res.type + ") Tickets Data ",  data);
                _th.trigger("TicketsData", data);
                break;
            case 32:
                console.log(" [Message] : (" + res.type + ") Hide PopUp  ");
                _th.trigger("hidePopUp");
                break;
            default:
                console.log(" [Message] : (" + res.type + ") Unknown ",  data);
                break;
        }
    }

    return {

        init: function(connection) {
            _th = $(this);
            _connection = connection; 

            $(_connection).on("Message", onMessage)
        },

        getMonitorData: function(channel, groupId) {

            var mVO = _connection.comm.createMessageVO ({
                type: 13,
                source: _source,
                destination: "ContactlineManager",
                answerChannel: channel,
                messageType: "JSON",
                message: JSON.stringify({groupVO: {groupId: groupId, groupName: null, groupDescription: null, storeVO: null, typeGroupVO: null, state: null, stateReason: null, businessState: null, idevices: [], isJBPMInstantiated: null},
                    userVO: {id: null, lastName: null, firstName: null, phone: null, email: null, clientVO: null, iappRoles: []},
                    channelsVO: {channelsToPublish: null, channelsToSubscribe: null}, attendanceType: {userAttendanceTypeId: null,userAttendanceTypeName: null}})
            });

            console.log(" [Message] : Get monitor data : (gropuId)", groupId);

            _connection.sendMessage("ContactLineManagerMonitorActualInfoRequest", mVO);
        },

        getTicketsStatus: function(channel, storeId) {

            var mVO = _connection.comm.createMessageVO ({
                type: 40,
                source: _source,
                destination: "ContactlineManager",
                answerChannel: channel,
                messageType: "JSON",
                message: JSON.stringify({serviceId: -1, storeId: storeId, itickets: {}})
            });

            console.log(" [Message] : Get tickets status : (storeId)", storeId);

            _connection.sendMessage("ContactLineManagerTicketMonitorAppRequest_" + storeId, mVO);
        }
    };
});
