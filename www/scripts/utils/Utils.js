var Utils = (function () {

    return {

        validateData: function(data) {

            if (!data.status || data.val === '')
                return null;

            return data.val;
        },

        formatLeftChars: function (val, len) {

	        var valLen = String(val).length;
	        var leftCharLen = len - valLen;

	        for (var i = 0; i < leftCharLen; i++)
	            val = String(0) + val;

	        return val;
	    },

	    sortBy: function (field, reverse, primer) {

	        var key = primer ?
	            function (x) {
	                return primer(x[field])
	            } :
	            function (x) {
	                return x[field]
	            };

	        reverse = [-1, 1][+!!reverse];

	        return function (a, b) {
	            return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
	        }
	    },

	    removeAccents: function (strAccents) {
			var strAccents = strAccents.split('');
			var strAccentsOut = new Array();
			var strAccentsLen = strAccents.length;
			var accents = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž';
			var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
			for (var y = 0; y < strAccentsLen; y++) {
				if (accents.indexOf(strAccents[y]) != -1) {
					strAccentsOut[y] = accentsOut.substr(accents.indexOf(strAccents[y]), 1);
				} else
					strAccentsOut[y] = strAccents[y];
			}
			strAccentsOut = strAccentsOut.join('');
			return strAccentsOut;
		},

		getQueryParams: function() {

	        var ls = document.location.search;
	        ls = ls.split('+').join(' ');

	        var params = {}, tokens,
	            re = /[?&]?([^=]+)=([^&]*)/g;

	        while (tokens = re.exec(ls)) {
	            params[decodeURIComponent(tokens[1])]
	                = decodeURIComponent(tokens[2]);
	        }

	        return params;
	    }
    }
})();