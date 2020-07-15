this["templates"] = this["templates"] || {};
this["templates"]["base"] = Handlebars.template({
    compiler: [6, ">= 2.0.0-beta.1"],
    main: function (depth0, helpers, partials, data) {
        var helper,
            functionType = "function",
            helperMissing = helpers.helperMissing,
            escapeExpression = this.escapeExpression;
        return (
            '<div class="container">\n	<header class="header">\n	    <div class="logo"></div>\n	</header>\n   <section class="text-container">\n <div class="text-container-title">' +
            escapeExpression(
                ((helper =
                        (helper =
                            helpers.title || (depth0 != null ? depth0.title : depth0)) != null ?
                        helper :
                        helperMissing),
                    typeof helper === functionType ?
                    helper.call(depth0, {
                        name: "title",
                        hash: {},
                        data: data,
                    }) :
                    helper)
            ) +
            '</div>\n <hr class="text-container-line">\n <div class="text-container-subtitle">' +
            escapeExpression(
                ((helper =
                        (helper =
                            helpers.subtitle || (depth0 != null ? depth0.subtitle : depth0)) !=
                        null ?
                        helper :
                        helperMissing),
                    typeof helper === functionType ?
                    helper.call(depth0, {
                        name: "subtitle",
                        hash: {},
                        data: data,
                    }) :
                    helper)
            ) +
            '</div>\n </section>\n <section class="device"></section>\n    <footer class="footer">\n	    <hr class="footer-line">\n <div>\n            <span class="footer-date"></span>\n            <span class="footer-time"></span>\n        </div>\n    </footer>\n</div>\n'
        );
    },
    useData: true,
});
this["templates"]["monitorBase"] = Handlebars.template({
    compiler: [6, ">= 2.0.0-beta.1"],
    main: function (depth0, helpers, partials, data) {
        return '    <div class="services"></div>\n';
    },
    useData: true,
});


this["templates"]["monitorService"] = Handlebars.template({
    "1": function (depth0, helpers, partials, data) {
        var helper,
            functionType = "function",
            helperMissing = helpers.helperMissing,
            escapeExpression = this.escapeExpression;
        return (
            '<li>\n    <div class="service">\n        <div class="desk-container">\n            <div class="desk-content">\n                <div class="desk-label"><span>Guichê</span></div>\n                <div class="desk-code"><span>' + escapeExpression(((helper = (helper = helpers.deskCode || (depth0 != null ? depth0.deskCode : depth0)) != null ? helper : helperMissing), (typeof helper === functionType ? helper.call(depth0, {
                "name": "deskCode",
                "hash": {},
                "data": data
            }) : helper))) + '</span></div>\n            </div>\n        </div>\n        </div>\n</li>\n'
        );
    },
    "compiler": [6, ">= 2.0.0-beta.1"],
    "main": function (depth0, helpers, partials, data) {
        var stack1, buffer = "";
        stack1 = helpers.each.call(depth0, depth0, {
            "name": "each",
            "hash": {},
            "fn": this.program(1, data),
            "inverse": this.noop,
            "data": data
        });
        if (stack1 != null) {
            buffer += stack1;
        }
        return buffer;
    },
    "useData": true
});

this["templates"]["serviceWait"] = Handlebars.template({
    compiler: [6, ">= 2.0.0-beta.1"],
    main: function (depth0, helpers, partials, data) {
        return (
            '<div class="serviceWait">\n   <div class="serviceWait-container">\n <div class="xl"></div>\n <div class="l"></div>\n <div class="m"></div>\n <div class="s"></div> \n    </div>\n        </div>\n'
        );
    },
    useData: true,
});

this["templates"]["servicePopUp"] = Handlebars.template({
    compiler: [6, ">= 2.0.0-beta.1"],
    main: function (depth0, helpers, partials, data) {
        var helper,
            functionType = "function",
            helperMissing = helpers.helperMissing,
            escapeExpression = this.escapeExpression;
        return (
            '<div class="servicePopUp">\n   <div class="servicePopUp-container">\n  <div class="servicePopUp-content">\n  <div class="desk-code"><span>' +
            escapeExpression(
                ((helper =
                        (helper =
                            helpers.deskCode || (depth0 != null ? depth0.deskCode : depth0)) !=
                        null ?
                        helper :
                        helperMissing),
                    typeof helper === functionType ?
                    helper.call(depth0, {
                        name: "deskCode",
                        hash: {},
                        data: data,
                    }) :
                    helper)
            ) +
            "</span></div>\n            </div>\n        </div>\n        </div>\n"
        );
    },
    useData: true,
});