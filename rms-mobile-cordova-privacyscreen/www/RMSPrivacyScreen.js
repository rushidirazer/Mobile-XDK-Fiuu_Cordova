(function(module){
    function RMSPrivacy(){
        var core = {};
        core.enable = function(success,error){
            cordova.exec(function(data){}, function(err){}, "RMSPrivacyScreen", "enable", []);
        };

        core.disable = function(success,error){
            cordova.exec(function(data){}, function(err){}, "RMSPrivacyScreen", "disable", []);
        };
        return core;
    }

    module.exports = new RMSPrivacy();
})(module);
