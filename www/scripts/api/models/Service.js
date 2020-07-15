define(function () {

    function Service(data, groupId) {

        this.id = data.serviceVO.serviceId;
        this.deviceId = data.deviceId;
        this.name = data.serviceVO.serviceName.split('|')[0];
        this.description = data.serviceVO.serviceDescription;
        this.code = data.serviceVO.code;
        this.storeId = data.serviceVO.storeId;
        this.groupId = groupId;
        this.presentationOrder = data.presentationOrder;
        this.waitingTime = " ";
        this.deskCode = "-";
        this.predictableTime = " ";
        this.ui = null;
        this.history = [];
        this.children = [];
        this.parent = data.serviceVO.serviceParentId;

        if(Config.monitor) this.ticketNumber = Utils.formatLeftChars(0, Config.monitor.display.ticket_number_length);
    }

     return Service;
 });