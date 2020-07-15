var Config = {
  message_bridge: {
    url: "http://10.23.131.141/Lateral_fila_unica/scripts",
    answer_channel: "MONITOR_ANSWER_CHANNEL",
    unique_channel: false,
  },
  message_contacline: {
    host: "ws://10.23.131.141:4445",
    reg_port: "5555",
    client_type: "REGTECRA",
    reconnect_interval: "12000",
    registration_interval: "5",
  },
  isPlatform360Server: false,
  messages: {
    connecting: "Carregando informação...",
    group_id_error1: "'groupId'<br>não definido.",
    group_id_error2: "Grupo inválido.",
    unavailable: "Serviço indisponível.<br>Por favor, forme fila única.",
    titulo: "FILA ÚNICA",
    subtitulo: "DIRIJA-SE À CAIXA",
  },
  monitor: {
    voiceControllerEndPoint: "",
    services: {
      limit_visible: 0,
    },
    display: {
      blink_times: 3,
      ticket_number_length: 2,
    },
    sound: {
      state: true,
      file: [
        "dirija-se_a_caixa1.mp3",
        "dirija-se_a_caixa2.mp3",
        "dirija-se_a_caixa3.mp3",
        "dirija-se_a_caixa4.mp3",
      ],
    },
    popUp: {
      enabled: true, // use popup to show called ticket
      autoHide: true, //true = hide after delay time, false = will wait for message from server
      delay: 30, // in seconds
    },
  },
  date: {
    format: "w d mm y",
    separator: [" ", " "],
    symbol: " . ",
  },
  time: {
    format: "h m",
    separator: ":",
  },
  console: {
    state: true,
  },
  colors: {
    title: "#bf282d",
    subtitle: "#bf282d",
    topLine: "#bf282d",
    bottomLine: "#316c3a",
    date: "#316c3a",
    clock: "#316c3a",
    xlDummy: "#bf282d",
    lDummy: "#d67579",
    mDummy: "#e1989a",
    sDummy: "#e5a9ab",
    deskNumberOff: "#bf282d",
    deskNumberOn: "#ffffff",
    deskBgOff: "#ffffff",
    deskBgOn: "#bf282d",
    deskBorder: "#bf282d",
  },
};
