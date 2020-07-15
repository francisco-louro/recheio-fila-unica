/**
 * Created by nunofernandes on 10/03/16.
 */

define(function () {
  var endPoint;
  var socket;
  var messageHandler;
  var connectionInterval;
  var messageController;
  var communicationObserver;
  var isReconnect;

  function WebsocketClient() {}

  function init() {
    isReconnect = false;
    communicationObserver = {
      onConnected: null,
      onDisconnected: null,
      onReconnected: null,
      onSubscribed: null,
      onUnsubscribed: null,
    };
  }

  function handleConnection() {
    try {
      socket = new WebSocket(endPoint);

      socket.onopen = function () {
        if (isReconnect) {
          communicationObserver.onReconnected();
        } else {
          isReconnect = true;
          communicationObserver.onConnected();
        }
      };

      socket.onmessage = function (msg) {
        if (messageHandler) {
          if (msg.type == "message") {
            messageHandler(msg.data);
            messageController = 0;
          }
        }
      };

      socket.onclose = function () {
        reset();
      };

      socket.onerror = function (event) {
        reset();
      };
    } catch (exception) {
      reset();
    }
  }

  function checkConnectionStatus() {
    if (messageController < -Config.message_contacline.reconnect_interval) {
      messageController = 0;
      socket.close();
      socket = null;
    }

    if (socket) {
      switch (socket.readyState) {
        case 0:
          console.log("Connecting to WebSockets ");
          break;
        case 1:
          console.log("Yuppi, I'm connected to WebSockets");
          messageController--;
          break;
        case 2:
          console.log("Closing connection to WebSockets");
          break;
        case 3:
          console.log("I'll try to connect to WebSockets");
          socket = null;
          handleConnection();
          break;
      }
    } else {
      console.log("Reset WebSockets connection");
      handleConnection();
    }
  }

  function reset() {
    console.log("Reconecting to " + endPoint);
  }

  return {
    start: function (url, handlers) {
      init();
      handlers.communicationHandler(communicationObserver);
      endPoint = url;
      messageHandler = handlers.messageHandler;
      messageController = 0;
      connectionInterval = setInterval(checkConnectionStatus, 1000);
    },

    send: function (message) {
      socket.send(message);
    },

    isConnected: function () {
      return socket.readyState == 1;
    },

    close: function () {
      socket.close();
    },
  };
});
