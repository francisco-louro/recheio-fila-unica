define([
    "templates",
    "utils/DateUtil",
    "utils/Utils",
    "utils/Color",
    "utils/xmlToJson",
], function () {
    var _th;
    var _device;
    var _highlight;
    var _servicesList;
    var _services, _visibleServices;
    var _timer, _count, _blinkTimes, _lastTicketId;

    let _audioFile; /* = "sound/" + Config.monitor.sound.file[0];*/
    let context;
    //let source = null;
    let audioBuffer = null;
    let fileNum;
    let firstTime = true;
    /*	_audio = new Audio();
	 var audioString = "";
	 _audio.addEventListener('loadeddata', function(event){
	 audioString =
	 });
	 _audio.src = _audioFile;*/
    /*loadSoundFile(_audioFile);*/
    /*============ SOUND ============*/
    function loadSoundFile(url) {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function (e) {
            initSound(this.response); // this.response is an ArrayBuffer.
        };
        xhr.send(null);
    }

    function initSound(arrayBuffer) {
        var base64String = bufferToBase64(arrayBuffer);
        var audioFromString = base64ToBuffer(base64String);
        //document.getElementById("mp3String").value=base64String;
        context.decodeAudioData(
            audioFromString,
            function (buffer) {
                // audioBuffer is global to reuse the decoded audio later.
                audioBuffer = buffer;
                //var buttons = document.querySelectorAll('button');
                //buttons[0].disabled = false;
                //buttons[1].disabled = false;
            },
            function (e) {}
        );
    }

    let bufferToBase64 = function (buffer) {
        var bytes = new Uint8Array(buffer);
        var len = buffer.byteLength;
        var binary = "";
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };
    let base64ToBuffer = function (buffer) {
        var binary = window.atob(buffer);
        var buffer = new ArrayBuffer(binary.length);
        var bytes = new Uint8Array(buffer);
        for (var i = 0; i < buffer.byteLength; i++) {
            bytes[i] = binary.charCodeAt(i) & 0xff;
        }
        return buffer;
    };

    function playSound(url) {
        console.log("playSound -> playSound", playSound);
        // source is global so we can call .noteOff() later.
        /*source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = false;
        source.connect(context.destination);
        source.start(0); // Play immediately.*/
        // Create an AudioContext instance for this sound
        var _audioContext = new(window.AudioContext || window.webkitAudioContext)();
        // Create a buffer for the incoming sound content
        var _source = _audioContext.createBufferSource();
        // Create the XHR which will grab the audio contents
        var _request = new XMLHttpRequest();
        // Set the audio file src here
        _request.open('GET', url, true);
        // Setting the responseType to arraybuffer sets up the audio decoding
        _request.responseType = 'arraybuffer';
        _request.onload = function () {
            // Decode the audio once the require is complete
            _audioContext.decodeAudioData(_request.response, function (buffer) {
                _source.buffer = buffer;
                // Connect the audio to source (multiple audio buffers can be connected!)
                _source.connect(_audioContext.destination);
                // Simple setting for the buffer
                _source.loop = false;
                // Play the sound!
                _source.start(0);
            }, function (e) {
                console.log('Audio error! ', e);
            });
        }
        // Send the request which kicks off
        _request.send();
    }

    /*==========  Services  ==========*/

    function renderServices(services, reset) {
        _services = services;
        _visibleServices =
            services.length <= _visibleServices ?
            services.length :
            Config.monitor.services.limit_visible;

        _servicesList.empty();

        _servicesList
            .append(templates.monitorService(services))
            .css({
                opacity: "0"
            })
            .animate({
                opacity: "1"
            }, 250);

        _servicesList.find("li>div").each(function (i) {
            // Hold reference to service ui
            setServiceUI(this, services[i]);
            // Hide service elem if bigger than service limit to prevent ui corruption
            if (i > _visibleServices - 1) $(this).css({
                display: "none"
            });
        });

        $(".desk").flowtype({
            minimum: 60,
            maximum: 70,
            minFont: 55,
            maxFont: 60,
        });
    }

    /*==========  Service Utils  ==========*/

    function setServiceUI(serviceUI, service) {
        for (var s in _services) {
            if (_services[s].id === service.id) _services[s].ui = $(serviceUI);
        }
    }

    /*==========  POPUP  ==========*/

    function highlightPopUp(services, serviceId) {
        clearInterval(_hideTimer);
        _hideTimer = null;

        for (var s in services) {
            console.log(
                "---- services[s].code: " +
                services[s].code
            );
            console.log(
                "---- services[s]: " +
                JSON.stringify(services[s])
            );
            if (services[s].id === serviceId) {
                $(".servicePopUp").css({
                    display: "block"
                });

                doTicketHighLight($(".desk-code"), services[s].id, services[s].deskCode);
                //console.log("highlightPopUp -> services[s].deskCode", services[s].deskCode)
                //console.log("highlightPopUp -> services[s].id", services[s].id)

                $(".serviceWait").css({
                    display: "none"
                });
            }
        }
    }

    /*==========  Highlight  ==========*/

    function highlightTicket(services, serviceId) {
        let highlightElem;
        let ticketElem;

        for (var s in services) {
            ticketElem = services[s].ui;

            if (services[s].id === serviceId) {
                //highlightElem = ticketElem;
                // Check if is recall
                doTicketHighLight(ticketElem);
            } else {
                ticketElem.removeClass("desk-code-toggle");
            }
        }
    }

    function doTicketHighLight(element, serviceId, dCode) {
        console.log("!!!!!!!!!!!!!!!! doTicketHighLight -> serviceId, deskcode", serviceId, dCode)
        _blinkTimes = Config.monitor.display.blink_times * 2;
        _count = 0;
        if (_lastTicketId === serviceId) _blinkTimes += 1;
        if (_timer) clearInterval(_timer);
        _timer = setInterval(function () {
            _count++;
            animateTicket(element);
        }, 700);

        // if (Config.monitor.sound.state) {
        //     loadSoundFile(_audioFile);
        //     playSound();
        // }

        fileNum = dCode;
        console.log("--> fileNum:  ", fileNum);
        _audioFile = "sound/" + Config.monitor.sound.file[fileNum - 1] + "?rnd=" + new Date();
        console.log("»»»»»»»»»»»»»»»»»» doTicketHighLight -> _audioFile", _audioFile)

        if (Config.monitor.sound.state && dCode) {
            //loadSoundFile(_audioFile);
            playSound(_audioFile);
        }

        _lastTicketId = serviceId;
    }

    var _hideTimer;

    var _showWait;


    function animateTicket(elem) {
        if (_count < _blinkTimes) {
            elem.toggleClass("desk-code-toggle");
            /*$(".servicePopUp-ticket-number").toggleClass(
                "servicePopUp-ticket-number-toggle"
            );*/
            // $(".servicePopUp-content-img > .cafetaria").toggleClass("active");
            // elem.css({ display: "block" });
        } else {
            clearInterval(_timer);
            if (Config.monitor.popUp.enabled && Config.monitor.popUp.autoHide) {
                // Autohide popup
                if (_hideTimer) clearInterval(_hideTimer);
                _hideTimer = setInterval(function () {
                    $(".servicePopUp").css({
                        display: "none"
                    });
                    clearInterval(_hideTimer);

                    if (_showWait) clearInterval(_showWait);
                    showWaitAnimation()

                }, Config.monitor.popUp.delay * 1000);
            }
        }
    }

    // Show waiting animation
    function showWaitAnimation() {
        console.log("showWaitAnimation -> showWaitAnimation", showWaitAnimation)
        /*if (_showWait) clearInterval(_showWait);
        _showWait = setInterval(function () {*/
        $(".serviceWait").css({
            display: "block"
        });

        $(".xl").addClass("animate-fading-xl");
        $(".l").addClass("animate-fading-l");
        $(".m").addClass("animate-fading-m");
        $(".s").addClass("animate-fading-s");
        /* clearInterval(_showWait);
        }, Config.monitor.popUp.delay * 1000);*/
    }
    /*==========  -  ==========*/

    function updateMessage(message) {
        if (typeof message === "undefined") message = "";
        $(".state-message").html(message);
    }

    function resetUI() {
        $(".overlay").css({
            display: "none"
        });
        $(".state").css({
            display: "none"
        });
        $(".header").css({
            display: "none"
        });
        $(".device").css({
            display: "none"
        });
    }

    /*==========  COLORS  ==========*/
    function redefineColors() {

        let root = document.documentElement;
        root.style.setProperty('--color-title', Config.colors.title);
        root.style.setProperty('--color-subtitle', Config.colors.subtitle);
        root.style.setProperty('--color-topLine', Config.colors.topLine);
        root.style.setProperty('--color-bottomLine', Config.colors.bottomLine);
        root.style.setProperty('--color-date', Config.colors.date);
        root.style.setProperty('--color-clock', Config.colors.clock);
        root.style.setProperty('--color-xlDummy', Config.colors.xlDummy);
        root.style.setProperty('--color-lDummy', Config.colors.lDummy);
        root.style.setProperty('--color-mDummy', Config.colors.mDummy);
        root.style.setProperty('--color-sDummy', Config.colors.sDummy);
        root.style.setProperty('--color-deskNumberOff', Config.colors.deskNumberOff);
        root.style.setProperty('--color-deskNumberOn', Config.colors.deskNumberOn);
        root.style.setProperty('--color-deskBgOff', Config.colors.deskBgOff);
        root.style.setProperty('--color-deskBgOn', Config.colors.deskBgOn);
        root.style.setProperty('--color-deskBorder', Config.colors.deskBorder);


        /* This Class allows changing png color of the dummys */
        /*const rgb_xl = hexToRgb(Config.colors.xlDummy);
        const rgb_l = hexToRgb(Config.colors.lDummy);
        const rgb_m = hexToRgb(Config.colors.mDummy);
        const rgb_s = hexToRgb(Config.colors.sDummy);

        const color_xl = new Color(rgb_xl[0], rgb_xl[1], rgb_xl[2]);
        const color_l = new Color(rgb_l[0], rgb_l[1], rgb_l[2]);
        const color_m = new Color(rgb_m[0], rgb_m[1], rgb_m[2]);
        const color_s = new Color(rgb_s[0], rgb_s[1], rgb_s[2]);
        const solver_xl = new Solver(color_xl);
        const solver_l = new Solver(color_l);
        const solver_m = new Solver(color_m);
        const solver_s = new Solver(color_s);
        const result_xl = solver_xl.solve();
        const result_l = solver_l.solve();
        const result_m = solver_m.solve();
        const result_s = solver_s.solve();

        setTimeout(function () {
            $(".serviceWait .serviceWait-container .xl").attr({
                'style': result_xl.filter
            });
        }, 100);

        setTimeout(function () {
            $(".serviceWait .serviceWait-container .l").attr({
                'style': result_l.filter
            });
        }, 200);

        setTimeout(function () {
            $(".serviceWait .serviceWait-container .m").attr({
                'style': result_m.filter
            });
        }, 300);

        setTimeout(function () {
            $(".serviceWait .serviceWait-container .s").attr({
                'style': result_s.filter
            });
        }, 100);
        */


    }

    return {
        init: function () {
            _th = this;


            $("body").empty().append(templates.base);

            _device = $(".device");
            _device.empty().append(templates.servicePopUp);
            _device.append(templates.serviceWait);
            _servicesList = $('<ul class="services"></ul>');
            _device.append(_servicesList);
            //_device.append(templates.servicePopUp);
            //$('.servicePopUp').css({display: 'none'});

            /*==========  Text  ==========*/
            $(".text-container-title").html(Config.messages.titulo);
            $(".text-container-subtitle").html(Config.messages.subtitulo);

            showWaitAnimation();

            redefineColors();

            DateUtil.getDateFormated(
                Config.date.format,
                Config.date.separator,
                "footer-date",
                Config.date.symbol
            );
            DateUtil.getTimeFormated(
                Config.time.format,
                Config.time.separator,
                "footer-time"
            );

            _th.updateState(0, Config.messages.connecting);
        },

        renderServices: function (services) {
            renderServices(services);

            _th.updateState(1);
        },

        updateState: function (state, message) {
            resetUI();

            updateMessage(message);

            switch (state) {
                case 0:
                    $(".overlay").css({
                        display: "block"
                    });
                    $(".state").css({
                        display: "table"
                    });
                    break;
                case 1:
                    // Show services
                    $(".overlay").css({
                        display: "block"
                    });
                    $(".header").css({
                        display: "table"
                    });
                    $(".device").css({
                        display: "block"
                    });
                    break;
                default:
                    break;
            }
        },

        updateTickets: function (services) {
            for (var s in services) {
                if (services[s].ui) {
                    // services[s].ui.find(".ticket-number").html(services[s].ticketNumber);
                    services[s].ui.find(".desk-code").html(services[s].deskCode);
                    console.log("updateTickets services[s].deskCode: ", services[s].deskCode);
                    /*if (Config.monitor.sound.state) {
                        playSound();
                    }*/
                    /*const serviceName = services[s].name.toLowerCase();
                    services[s].ui
                        .find(".content-img")
                        .html(`<div class="${serviceName}"></div>`);*/
                }
            }
        },

        updatePopUp: function (serviceVO, services) {
            console.log("services", JSON.stringify(services));
            console.log("serviceVO", JSON.stringify(serviceVO));


            for (var s in services) {
                console.log(
                    "---- services[s].code: " +
                    services[s].deskCode + " desk: " + fileNum
                );
                if (services[s].ui) {
                    /*$(".servicePopUp-content")
                        .find(".servicePopUp-name")
                        .html(services[s].name);

                    $(".servicePopUp-content")
                        .find(".servicePopUp-code")
                        .html(services[s].code);

                    $(".servicePopUp-content")
                        .find(".servicePopUp-ticket-number")
                        .html(services[s].ticketNumber);*/
                    if (services[s].deskCode === fileNum) {
                        $('.servicePopUp-content')
                            .find('.desk-code')
                            .html(services[s].deskCode);
                        console.log("updatePopUp services[s].deskCode", services[s].deskCode);
                    }

                }
            }
        },

        highlightTicket: function (services, serviceId) {
            highlightTicket(services, serviceId);
        },

        highlightPopUp: function (services, serviceId) {
            highlightPopUp(services, serviceId);
        },

        hidePopUp: function () {
            $(".servicePopUp").css({
                display: "none"
            });
        },
    };
});