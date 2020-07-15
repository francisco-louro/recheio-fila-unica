require.config({
    baseUrl: 'scripts',
    paths: {
        'controller' : ['api/controllers/MainController']
    },
    waitSeconds: 10
});

require(['controller'], function(MainController){

    $(document).ready(function () {
        if(typeof cordova != 'undefined') {
            document.addEventListener('deviceready', init, false);
            console.log("1");
        } else {
            init();
        }
    });

    function init() {
        console.log("init in main.js!!!");
        MainController.init();
    }
});