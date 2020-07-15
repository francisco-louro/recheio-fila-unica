function StatisticsSender(opts) {
    this.communication = opts.communication;
    this.channel = opts.channel || GlobalDefinitions.channels.statistics;
    this.version = opts.version || GlobalDefinitions.preferences.version || "0";
    this.source = opts.source || Main.getId();
    this.destination = opts.destination || "BamServer";
}   

StatisticsSender.prototype = {
    /**
     * Send the specific log message with the already defined properties 
     * defined on object instantiation
     * @param {type} type
     * @param {type} message - Message to send, in Object type
     * @returns {undefined}
     */
    logStatistic: function(type, message){
        var msg = this.communication.createMessageVO({
            type: type,
            version: this.version,
            source: this.source,
            destination: this.destination,
            message: JSON.stringify(message)
        });
        msg && this.communication.send(this.channel, msg);
    },
    logContentRetrieval: function(clientId, contentUrl, contentName, contentId, response) {
        if (!clientId) {
            if (contentId != 0)
                debug("failed to stat content retrieval, undefined client id");
            return;
        }
        var type = 2001;
        var innerMessage = {
            clientId: clientId,
            url: contentUrl,
            contentName: contentName,
            contentId: contentId,
            response: response,
            time: GlobalDefinitions.getTime("gmt"),
            timezone: GlobalDefinitions.getTime("string")
        };
        this.destination = this.destination || "BamServer";
        this.logStatistic(type, innerMessage);
    },
    logPlayContent: function(content) {
        var grid = content.getGrid();
        if (!grid) {
            return; // default content
        }

        var type = 2002;
        var playlist = content.getPlaylist();

        var innerMessage = {
            clientId: playlist && playlist.clientId || "",
            gridId: grid.id,
            gridName: grid.name,
            contentName: content.name,
            contentId: content.id,
            duration: content.duration,
            code: content.code,
            time: GlobalDefinitions.getTime("gmt"),
            timezone: GlobalDefinitions.getTime("string")
        };
        
        this.destination = this.destination || "BamServer";
        this.logStatistic(type, innerMessage);
    },
    logQuestion: function(question, answer) {
        var type = 2003;
        var innerMessage = {
            question: question,
            answer: answer
        };
        this.logStatistic(type, innerMessage);
    }
}; // prototype


