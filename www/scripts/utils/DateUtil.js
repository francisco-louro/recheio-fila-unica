var DateUtil = (function () {

    var weekDays = {
        pt: ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'],
        en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }

    var months = {
        pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    }

    var date,
        weekDay,
        month,
        activeLang = "pt";

    var formatedDate = "",
        formatDateRequired,
        updateDateInterval = 1,
        dateElem,
        dateInterval;

    var formatedTime = "",
        formatTimeRequired,
        updateTimeInterval = 1,
        timeElem,
        timeInterval;

    function formatDate(format, separator, elem, symbol) {

        date = new Date();

        formatDateRequired = format.split(' ');
        formatedDate = "";
        updateDateInterval = 60 - date.getSeconds();

        separatorCount = 0;

        for (var f in formatDateRequired) {

            var sep = separator[separatorCount];

            switch(formatDateRequired[[f]]) {

                case 'ww':
                    formatedDate += getWeekdayFormat() + sep + symbol;
                    break;
                case 'w':
                    formatedDate += getWeekdayFormat(true) + sep + symbol;
                    break;
                case 'd':
                    formatedDate += date.getDate() + sep;
                    break;
                case 'mmm':
                    formatedDate += getMonthFormat(0) + sep;
                    break;
                case 'mm':
                    formatedDate += getMonthFormat(1) + sep;
                    break;
                case 'm':
                    formatedDate += getMonthFormat(2) + sep;
                    break;
                case 'y':
                    formatedDate += date.getFullYear()  + sep;
                    break;
                default:
                    break
            }

            if(separatorCount < separator.length-1)
                separatorCount++;
        }

        formatedDate = formatedDate.substr(0, formatedDate.length - sep.length);

        dateElem.innerHTML = formatedDate;
    }

    function getWeekdayFormat(abrev) {

        weekDay = weekDays[activeLang][date.getDay()];
        if(abrev == true) weekDay = weekDay.split('-')[0];

        return weekDay;
    }

    function getMonthFormat(format) {

        month = months[activeLang][date.getMonth()];
        if(format === 1) month = month.substring(0, 3);
        if(format === 2) month = date.getMonth() + 1;

        return month;
    }

    function formatTime(format, separator) {

        date = new Date();

        formatTimeRequired = format.split(' ');
        formatedTime = "";
        updateTimeInterval = 1; // 60 - date.getSeconds();

        for (var f in formatTimeRequired) {

            switch(formatTimeRequired[[f]]) {

                case 'h':
                    formatedTime += formatLength(date.getHours(), 2) + separator;
                    break;
                case 'm':
                    formatedTime += formatLength(date.getMinutes(), 2) + separator;
                    break;
                case 's':
                    formatedTime += formatLength(date.getSeconds(), 2) + separator;
                    updateTimeInterval = 1;
                    break;
                case 'ms':
                    formatedTime += date.getMilliseconds() + separator;
                    updateTimeInterval = 0;
                    break;
            }
        }

        formatedTime = formatedTime.substr(0, formatedTime.length-1);

        timeElem.innerHTML = formatedTime;
    }

    function formatLength(val, len) {

        val = String(val);

        if (val.length < len)
            val = '0' + val;

        return val;
    }

    return {

        getDateFromUnixTimeStamp: function (unixTimeStamp) {
            return new Date(unixTimeStamp);
        },

        getFormatedDateValue: function (value) {
            if (value < 10) value = "0" + value;
            return value;
        },

        getDateFormated: function(format, separator, elem, symbol) {

            dateElem = document.getElementById(elem);
            if(!dateElem) dateElem = document.getElementsByClassName(elem)[0];

            dateInterval = setInterval( function(){ formatDate(format, separator, elem, symbol); }, updateDateInterval * 1000);
        },

        getTimeFormated: function(format, separator, elem) {

            timeElem = document.getElementById(elem);
            if(!timeElem) timeElem = document.getElementsByClassName(elem)[0];

            timeInterval = setInterval( function(){ formatTime(format, separator, elem); }, updateTimeInterval * 1000);
        },

        get months() { return months.pt; }
    }
})();