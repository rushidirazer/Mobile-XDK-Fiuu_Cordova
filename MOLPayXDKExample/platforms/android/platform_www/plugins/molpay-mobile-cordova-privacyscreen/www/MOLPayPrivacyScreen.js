cordova.define("molpay-mobile-cordova-privacyscreen.MOLPayPrivacyScreen", function(require, exports, module) {
(function(module){
    function MOLPayPrivacy(){
        var core = {};
        core.enable = function(success,error){
            cordova.exec(function(data){}, function(err){}, "MOLPayPrivacyScreen", "enable", []);
        };

        core.disable = function(success,error){
            cordova.exec(function(data){}, function(err){}, "MOLPayPrivacyScreen", "disable", []);
        };
        return core;
    }

    module.exports = new MOLPayPrivacy();
})(module);

});
