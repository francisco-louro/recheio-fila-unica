define(['api/models/Service'], function (Service) {

    var _this,
        _services, _count = 0;

    var _groupId, _devices;

    function createServices() {

        _services = [];

        _devices.map(function(device, i){

            var serviceName = device.serviceVO.serviceName;
            var serviceId = device.serviceVO.serviceId;

            if (device.actionVO.actionId === 1 || device.actionVO.actionId === 13) {

                var service = new Service(device, _groupId);
                _services.push(service);

                console.log(" [SRV] : Service Created " + serviceName + " (id) " + serviceId + " (device) " + device.deviceId);
            } else {
                console.log(" [SRV] : Service Not Available " + serviceName + " (id) " + serviceId + " (actionId) " + device.actionVO.actionId);
            }
        });

        _services.length > 0 ? orderServices() : console.log(" [SRV] : No Services Available");
    }

    function orderServices() {

        _services.sort(Utils.sortBy('presentationOrder', true, parseInt));
    }

    function updateData(data) {

        var tickets = data.itickets;

        for (var s in _services) {

            for (var t in tickets) {

                if (parseInt(t) == _services[s].id) {

                    var ticketNumber = Utils.formatLeftChars(tickets[t].ticketNumber, Config.monitor.display.ticket_number_length);
                    var deskCode = data.deskCode;
                    //var code = data.code;

                    _services[s].ticketNumber = ticketNumber;
                    _services[s].deskCode = deskCode;
                   // _services[s].code = code;

                    console.log(" [SRV] : Updated Ticket Number : (service) " + _services[s].name + " (ticket) " + _services[s].ticketNumber + " (deskCode) " + _services[s].deskCode);
                    break;
                }
            }
        }
    }

    function updateTicketData(data) {

        var ticketData = data.serviceVO;

        for (var s in _services) {

            if(_services[s].id === ticketData.serviceId) {

                var ticketNumber = Utils.formatLeftChars(data.ticketNumber, Config.monitor.display.ticket_number_length);
                var deskCode = data.deskCode;
               // var code = data.code;

                _services[s].ticketNumber = ticketNumber;
                _services[s].deskCode = deskCode;
               // _services[s].code = code;

                console.log(" [SRV] : Updated Ticket Number : (service) " + _services[s].name + " (ticket) " + _services[s].ticketNumber + " (deskCode) " + _services[s].deskCode);
                break;
            }
        }
    }

    return {

        processData: function (data) {
            _this = this;

            _groupId = data.groupVO.groupId;
            _devices = data.groupVO.idevices;

            _devices.length > 0 ? createServices() : console.log(" [SRV] : No Devices Available : (group)" + _groupId);
        },

        updateData: function (data) {
            updateData(data);
        },

        updateTicketData: function (data) {
            updateTicketData(data);
        },

        get services() {
            return _services;
        }
    };
});