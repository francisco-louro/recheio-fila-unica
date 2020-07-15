GlobalDefinitions = Object.create(null,
    {
    communications: {
        value: {
            "default": "websocket",
            dispenser: "websocket",
            monitor: "websocket",
            authserver: "websocket",
            business: "websocket",
            bam: "realtime",
            desk: "websocket",
            player: "websocket",
            getConnectionType: function (caller) {
                // used for realtime connection
                if (!this.appID) {
                    Object.defineProperty(this, "appID", {
                        value: caller
                    });
                }
                return this[caller] || this.default;
            }
        },
        writable: true
    },
    websocket: {
        value: {
            url: "ws://localhost:8080/MessageBridge/server/1.1",
            timeout: 8e3 // milliseconds!
        },
        writable: true
    },
    realtime: {
        value: {
            url: "http://ortc-developers.realtime.co/server/2.1/",
            clientId: "MobbitSystems",
            appKey: "XXXXX",
            token: "myAuthToken",
            metaData: "clientConnMeta",
            cdn: "http://dfdbz2tdq3k01.cloudfront.net/js/2.1.0/ortc.js"
        }
    },
    // common
    version: {
        value: "3.6.1 Agil",
        writable: true
    },
    timeout: {
        value: 15, // seconds!
        writable: true
    },
    channels: {
        value: {
            player: "mobbit.insight.player",
            insight: "mobbit.insight.rtn",
            statistics: "mobbit.bam.statistics",
            productManagement: {
                server: "mobbit.productmanagement.server",
                web: "mobbit.productmanagement.web",
                client: "mobbit.productmanagement.client"
            },
            authserver: {
                server: "AuthenticationManagerChannel"
            }
        },
        writable: true
    },
    messageType: {
        value: {
            productManagement: {
                CREATE_PM_PRODUCT: 6004,
                UPDATE_PM_PRODUCT: 6005,
                REMOVE_PM_PRODUCT: 6006,
                CREATE_PM_STORE: 6013,
                UPDATE_PM_STORE: 6014,
                REMOVE_PM_STORE: 6015,
                CREATE_PM_REGION: 6022,
                UPDATE_PM_REGION: 6023,
                REMOVE_PM_REGION: 6024,
                CREATE_PM_CATEGORY: 6034,
                UPDATE_PM_CATEGORY: 6035,
                REMOVE_PM_CATEGORY: 6036,
                CREATE_PM_BRAND: 6042,
                UPDATE_PM_BRAND: 6043,
                REMOVE_PM_BRAND: 6044,
                EXTERNAL_PM_UPDATE: 6095,
                INSERT_MEDIATEKA_CONTENT: 10001,
                UPDATE_MEDIATEKA_CONTENT: 10002,
                DELETE_MEDIATEKA_CONTENT: 10003
            },
            authserver: {
                DELETE_USER: 4046,
                CREATE_USER: 4066,
                UPDATE_USER: 4069
            },
            // FIXME: deprecated! check who is using this types
            mediateka: {
                MEDIATEKA_CONTENT_INSERT: 10041,
                MEDIATEKA_CONTENT_UPDATE: 10042,
                MEDIATEKA_CONTENT_DELETE: 10043,
                MEDIATEKA_CONTENTGROUP_INSERT: 10051,
                MEDIATEKA_CONTENTGROUP_UPDATE: 10052,
                MEDIATEKA_CONTENTGROUP_DELETE: 10053,
                MEDIATEKA_CONTENTGROUPTYPE_INSERT: 10061,
                MEDIATEKA_CONTENTGROUPTYPE_UPDATE: 10062,
                MEDIATEKA_CONTENTGROUPTYPE_DELETE: 10063,
                MEDIATEKA_PROPERTY_INSERT: 10071,
                MEDIATEKA_PROPERTY_UPDATE: 10072,
                MEDIATEKA_PROPERTY_DELETE: 10073,
                MEDIATEKA_REPOSITORY_INSERT: 10081,
                MEDIATEKA_REPOSITORY_UPDATE: 10082,
                MEDIATEKA_REPOSITORY_DELETE: 10083
            }
        }
    },
    destination: {
        value: {
            ALL: "All",
            AUTHENTICATION_SERVER: "AuthenticationServer",
            BAM_SERVER: "BamServer",
            BUSINESS_ADMINISTRATION_SERVER: "BusinessAdministrationServer",
            BUSINESS_ADMINISTRATION_CLIENT: "BusinessFrontEnd",
            CONTACTLINE_MANAGER: "ContactlineManager",
            EXTERNAL_GATEWAY: "ExternalGateway",
            MRATE: "MRate",
            PRODUCT_MANAGEMENT_SERVER: "ProductManagementServer",
            PRODUCT_MANAGEMENT_CLIENT: "ProductManagementClient",
            SCHEDULE_SERVER: "ScheduleServer",
            SCHEDULE_CLIENT: "ScheduleClient",
            MEDIATEKA_CLIENT: "MediatekaClient",
            MEDIATEKA_SERVER: "MediatekaServer",
            insight: "Insight360",
            manager: "InsightManager",
            legacy: "InsightV3"
        },
        writable: true
    },
    getTime: {
        value: function (type, timeToUpdate) {
            // return UTC timestamp
            function getZeroTime(timeToUpd) {
                var time;
                if (this.tvSet) {
                    // only returns seconds
                    time = this.tvSet.getTime() * 1000;
                    return time;
                }
                else {
                    var d = new Date();
                    if (timeToUpd) {
                        d = new Date(timeToUpd);
                    }
                    time = d.getTime();
                    return time;
                }
            }

            // return timestamp according with timezone
            function getTimeZone(timeToUpd) {
                var time = getZeroTime(timeToUpd);
                getZeroTime = null;
                var oneHour = 1 * 60 * 60 * 1000;
                var d = new Date();
                var tzoff = (d.getHours() - d.getUTCHours() + 24) % 24;
                var dayOffSet = tzoff * oneHour;
                time = time + dayOffSet;
                return time;
            }

            if (type) {
                switch (type) {
                    case 'date':
                        return new Date(getTimeZone(timeToUpdate));
                        break;
                    case 'day':
                        return new Date(getTimeZone(timeToUpdate)).getUTCDay();
                        break;
                    case 'gmt':
                        return getZeroTime(timeToUpdate);
                        break;
                        // the next two cases already take into account the timezone
                    case 'hour-locale':
                        return new Date().toLocaleTimeString();
                        break;
                    case 'string':
                        return new Date().toTimeString();
                        break;
                    case 'ms':
                        return getTimeZone(timeToUpdate);
                        break;
                    case 's':
                        return getTimeZone(timeToUpdate) / 1000 | 0;
                        break;
                    default:
                        debug("unknown type of date, return default timestamp");
                }
            }
            return getTimeZone(timeToUpdate) / 1000 | 0; // same as Math.floor()
        }
    }
});

Platform360 = Object.create(null, {
    channels: {
        value: {
            business: {
                SERVER: "mobbit.business.server",
                WEB: "mobbit.business.client.web"
            },
            desk: {
                RESPONSE_DESKS: "ContactlineManagerCountersStateResponse"
            },
            mediateka: {
                SERVER: "mediateka.server",
                CLIENT: "mediateka.client",
                changedContent: "Channel_Changed_Content",
                changedRepository: "Channel_Changed_Repository"
            },
            mrate: {
                SERVER: "mobbit.mrate.server",
                WEB: "mobbit.mrate.web", // for mrate app only
                CLIENT: "mobbit.mrate.client"
            },
            platformManager: {
                REQUEST_DESKS: "ContactlineManagerCountersStateRequest",
                LOGOUT_DESK: "ContactlineManagerLogoutDesk"
            },
            schedule: {
                REQUEST_START: "schedule.manager.request.start",
                RESPONSE_START: "schedule.manager.response.start",
                REQUEST_SCHEDULES: "schedule.manager.request.schedules",
                RESPONSE_SCHEDULES: "schedule.manager.response.schedules"
            }
        }
    },
    destination: {
        value: {
            ALL: "All",
            AUTHENTICATION_SERVER: "AuthenticationServer",
            BAM_SERVER: "BamServer",
            BUSINESS_ADMINISTRATION_SERVER: "BusinessAdministrationServer",
            BUSINESS_ADMINISTRATION_CLIENT: "BusinessFrontEnd",
            CONTACTLINE_MANAGER: "ContactlineManager",
            DESK: "Desk",
            EXTERNAL_GATEWAY: "ExternalGateway",
            MRATE: "MRate",
            PRODUCT_MANAGEMENT_SERVER: "ProductManagementServer",
            PRODUCT_MANAGEMENT_CLIENT: "ProductManagementClient",
            SCHEDULE_SERVER: "ScheduleServer",
            SCHEDULE_CLIENT: "ScheduleClient",
            MEDIATEKA_CLIENT: "MediatekaClient",
            MEDIATEKA_SERVER: "MediatekaServer",
            insight: "Insight360",
            manager: "InsightManager",
            legacy: "InsightV3"
        }
    },
    types: {
        value: {
            business: {
                CREATE_GROUP: 1001,
                UPDATE_GROUP: 1002,
                DELETE_GROUP: 1003,
                CREATE_STORE: 1004,
                UPDATE_STORE: 1005,
                DELETE_STORE: 1006,
                CREATE_SERVICE: 1007,
                UPDATE_SERVICE: 1008,
                DELETE_SERVICE: 1009,
                LIST_SCHEDULES: 1010,
                START_APP: 1011,
                RESPONE_MESSAGE: 1012,
                MOBILE_CONFIG_UPDATE: 1030,
                LIST_STATEDISTRICT: 1050,
                LIST_CITY: 1051,
                LIST_LOCALITY: 1052,
                LIST_ADDRESS: 1053,
                LIST_CP: 1054
            },
            schedule: {
                REQUEST_MODEL_LOCATOR: 3001,
                NEW_SCHEDULE: 3002,
                EDIT_SCHEDULE: 3003,
                DELETE_SCHEDULE: 3004,
                RESPONSE_MESSAGE: 3005,
                LIST_SCHEDULES: 3006,
                LIST_SCHEDULES_BY_CLIENT: 3007,
                NEW_SCHEDULE_EXCEPTION: 3010,
                UPDATE_SCHEDULE_EXCEPTION: 3011,
                DELETE_SCHEDULE_EXCEPTION: 3012
            },
            mediateka: {
                MEDIATEKA_CONTENT_INSERT: 10041,
                MEDIATEKA_CONTENT_UPDATE: 10042,
                MEDIATEKA_CONTENT_DELETE: 10043,
                MEDIATEKA_CONTENTGROUP_INSERT: 10051,
                MEDIATEKA_CONTENTGROUP_UPDATE: 10052,
                MEDIATEKA_CONTENTGROUP_DELETE: 10053,
                MEDIATEKA_CONTENTGROUPTYPE_INSERT: 10061,
                MEDIATEKA_CONTENTGROUPTYPE_UPDATE: 10062,
                MEDIATEKA_CONTENTGROUPTYPE_DELETE: 10063,
                MEDIATEKA_PROPERTY_INSERT: 10071,
                MEDIATEKA_PROPERTY_UPDATE: 10072,
                MEDIATEKA_PROPERTY_DELETE: 10073,
                MEDIATEKA_REPOSITORY_INSERT: 10081,
                MEDIATEKA_REPOSITORY_UPDATE: 10082,
                MEDIATEKA_REPOSITORY_DELETE: 10083
            },
            desk: {
                // FIXME: validate if all are necessary!
                REQUEST_DESKS_TYPE: 38,
                LOGOUT_USER: 39,
                LIST_STORES: 41,
                BREAK_START: 42,
                BREAK_END: 43
            }
        }
    }
});