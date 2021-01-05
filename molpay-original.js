//---------------------------------------------------------------------------
//--------------- End of MOLPay Cordova Plugin Implementations --------------
//---------------------------------------------------------------------------

// Overriding native implementations for easy MOLPay frame removals --------------

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

//------------------------------------------
//--------------- Private API --------------
//------------------------------------------

// Comment this for debug mode
// console.log = function() {};

// deploy
var isInternalDebugging = true;
var moduleId = 'molpay-mobile-xdk-cordova';
var wrapperVersion = '1';

// Constants
var molpaySdkUrl = 'molpay-mobile-xdk-www/index.html';
var mpopenmolpaywindow = 'mpopenmolpaywindow:\/\/';
var mptransactionresults = 'mptransactionresults:\/\/';
var mprunscriptonpopup = 'mprunscriptonpopup:\/\/';
var mpcloseallwindows = 'mpcloseallwindows:\/\/';
var mppinstructioncapture = 'mppinstructioncapture:\/\/';
var molpayresulturl = 'MOLPay/result.php';
var molpaynbepayurl = 'MOLPay/nbepay.php';
var b4results = '"msgType":"B4"';
var c6results = '"msgType":"C6"';

// Variables
var molpayPaymentDetails;
var transactionResultCallback;
var molpayDiv, mainUiFrame, bankUiWindow, molpayTransactionRequestFrame;
var isClosingMolpay = false;

var hideFrame = function(frame) {
    frame.style.visibility = 'hidden';
    frame.style.position = 'absolute';
    frame.style.width = '0px';
    frame.style.height = '0px';
};

var showFrame = function(frame) {
    frame.style.visibility = 'visible';
    frame.style.position = 'absolute';
    frame.style.width = '100%';
    frame.style.height = '100%';
};

// Post MOLPay result screen handler
var postMolpayResultHandler = function(innHtml) {
    // Debug
    if (isInternalDebugging) {
        console.log("postMolpayResultHandler innHtml = " + innHtml);
    }

    var innHtmlString = innHtml;
    if (innHtmlString) {
        // Filter out iframe element injected by Cordova if found
        var iframeRegExp = new RegExp('<iframe');
        var match = iframeRegExp.exec(innHtmlString);
        if (match) {
            innHtmlString = innHtmlString.slice(0, match.index);
        }

        // Filter out all <> tags injected by safari if found
        var filterOutTags = function(innHtmlString) {
            var output = innHtmlString;
            var rxMatch = new RegExp('<', 'g');
            var rxOpen = new RegExp('<');
            var rxClose = new RegExp('>');
            var firstIndex;
            var secondIndex;
            var rxMatchFound = output.match(rxMatch);

            if (output && rxMatchFound && rxOpen.exec(output) && rxClose.exec(output)) {
                for (var i = rxMatchFound.length - 1; i >= 0; i--) {
                    firstIndex = rxOpen.exec(output).index;
                    secondIndex = rxClose.exec(output).index;
                    output = output.substring(0, firstIndex) + '' + output.substring(secondIndex + 1);
                }
            }
            return output;
        }

        innHtmlString = filterOutTags(innHtmlString);
        // Debug
        if (isInternalDebugging) {
            console.log("innHtmlString = " + innHtmlString);
        }

        var resultsRegExp;
        var resultObject;

        // B4 results
        resultsRegExp = new RegExp(b4results);
        if (resultsRegExp.test(innHtmlString)) {
            // Debug
            if (isInternalDebugging) {
                console.log('onMolpayUiFrameLoad B4 results = ' + innHtmlString);
            }

            resultObject = JSON.parse(innHtmlString);
            if (resultObject) {
                var transId = resultObject.tranID;
                if (transId) {
                    // Debug
                    if (isInternalDebugging) {
                        console.log('mainUiFrame.contentWindow.transactionRequestWithTransactionId = ' + transId);
                    }

                    mainUiFrame.contentWindow.transactionRequestWithTransactionId(transId);
                }
            }
        }
    }
};

var isBankUiWindowClosedByCloseWindowEvent = false;
var createBankUiWindow = function(base64HtmlString) {
    // Open bank transaction window
    var url = 'data:text/html;base64,' + base64HtmlString;
    bankUiWindow = window.open(url, '_blank', 'location=no,hardwareback=no,disallowoverscroll=yes,toolbarposition=top,transitionstyle=crossdissolve,useWideViewPort=no');

    // Exit event
    var onBankUIExit = function(evt) {
        if (!isBankUiWindowClosedByCloseWindowEvent) {
            mainUiFrame.contentWindow.transactionRequest();
        }
        bankUiWindow.removeEventListener('exit', onBankUIExit);
    };
    bankUiWindow.addEventListener('exit', onBankUIExit);

    var onBankUiLoadstop = function(event) {
        // Debug
        if (isInternalDebugging) {
            console.log('onBankUiLoadstop event.url =' + event.url);
        }

        if (event.url.indexOf("intermediate_appTNG-EWALLET.php") > -1 || event.url.indexOf("intermediate_app/processing.php") > -1){
            bankUiWindow.executeScript({
                code: 'document.getElementById("systembrowserurl").innerHTML'
            },
            function(values) {
                var returnResult = window.atob(values);

                // Debug
                if (isInternalDebugging) {
                    console.log('bankUiWindow document.getElementById("systembrowserurl").innerHTML retrieved = ' + returnResult);
                }

                if(returnResult){
                    bankUiWindow = window.open(returnResult, "_system");
                    bankUiWindow.addEventListener('loadstart', onBankUiLoadstart);
                    bankUiWindow.addEventListener('loadstop', onBankUiLoadstop);
                    bankUiWindow.addEventListener('exit', onBankUIExit);
                }
            });
        }

        // Capture MOLPay results
        var resultsRegExp;
        var resultObject;

        resultsRegExp = new RegExp(molpaynbepayurl);
        if (event && resultsRegExp.test(event.url)) {
            // Debug
            if (isInternalDebugging) {
                console.log('onBankUiLoadstop molpaynbepayurl found');
            }

            bankUiWindow.executeScript({
                    code: 'window.open = function (open) {\
                            return function (url, name, features) {\
                              window.location = url ;\
                              return window; \
                            }; \
                            } (window.open);'
                },
                function(values) {
                    // Debug
                    if (isInternalDebugging) {
                        console.log('bankUiWindow window.open to window.location inject ok');
                    }
                });

            bankUiWindow.executeScript({
                    code: 'window.close = function () {\
                            window.location.assign(window.location);\
                            };'
                },
                function(values) {
                    // Debug
                    if (isInternalDebugging) {
                        console.log('bankUiWindow window.close to window.location.assign inject ok');
                    }
                });
        }

    };
    bankUiWindow.addEventListener('loadstop', onBankUiLoadstop);

    // Loadstart event
    var onBankUiLoadstart = function(event) {
        // Debug
        if (isInternalDebugging) {
            console.log('onBankUiLoadstart event.url = ' + event.url);
        }

        // Capture MOLPay results
        var resultsRegExp;
        var resultObject;

        mainUiFrame.contentWindow.nativeWebRequestUrlUpdates({
            'requestPath': event.url
        });

        resultsRegExp = new RegExp(molpaynbepayurl);
        if (event && resultsRegExp.test(event.url)) {
            // Debug
            if (isInternalDebugging) {
                console.log('onBankUiLoadstart molpaynbepayurl found');
            }

            var maximumCheckCount = 10;
            var currentCheckCount = 0;
            var checkResultInt = setInterval(function() {
                checkResult()
            }, 1000);

            var checkResult = function() {
                currentCheckCount++;

                if (currentCheckCount > maximumCheckCount) {
                    clearInterval(checkResultInt);
                } else {
                    bankUiWindow.executeScript({
                            code: 'document.body.innerHTML'
                        },
                        function(values) {
                            var returnResult = values[0];
                            // Debug
                            if (isInternalDebugging) {
                                console.log('bankUiWindow document.body.innerHTML retrieved = ' + returnResult);
                            }

                            // B4 results
                            var b4RegExp = new RegExp(b4results);
                            if (b4RegExp.test(returnResult)) {
                                postMolpayResultHandler(returnResult);
                                bankUiWindow.removeEventListener('loadstart', onBankUiLoadstart);
                                bankUiWindow.close();
                                clearInterval(checkResultInt);
                            }
                        });
                }
            }
        }
    };

    bankUiWindow.addEventListener('loadstart', onBankUiLoadstart);

    // Loaderror event - HongLeongBank immediately fail when this implemented, was implemented on 3.14.0 for Cordova only
    // var onBankUiLoaderror = function(event) {
    //     // Debug
    //     if (isInternalDebugging) {
    //         console.log('onBankUiLoaderror event.url = ' + event.url);
    //     }
    //     mainUiFrame.contentWindow.closemolpay();
    // };
    // bankUiWindow.addEventListener('loaderror', onBankUiLoaderror);
};

var inAppCallback = function(data) {
    var base64HtmlString;
    var regexp;

    // Capture MOLPay results
    if (data && data.indexOf(mpopenmolpaywindow) > -1) {
        regexp = new RegExp(mpopenmolpaywindow, 'g');
        base64HtmlString = data.replace(regexp, '');
        if (base64HtmlString && base64HtmlString.length > 0) {
            // Debug
            if (isInternalDebugging) {
                console.log('inAppCallback base64HtmlString = ', base64HtmlString);
            }
            createBankUiWindow(base64HtmlString);
        }
    }

    // Close bank windows
    else if (data && data.indexOf(mpcloseallwindows) > -1) {
        // Debug
        if (isInternalDebugging) {
            console.log('inAppCallback closing bankUiWindow');
        }
        isBankUiWindowClosedByCloseWindowEvent = true;
        bankUiWindow.close();
    }

    // C6 results
    else if (data && data.indexOf(mptransactionresults) > -1) {
        regexp = new RegExp(mptransactionresults, 'g');
        base64HtmlString = data.replace(regexp, '');
        if (base64HtmlString && base64HtmlString.length > 0) {
            var resultData = window.atob(base64HtmlString);
            var jsonResult = JSON.stringify(JSON.parse(resultData));
            transactionResultCallback(jsonResult);

            // CLosing Molpay
            if (isClosingMolpay) {
                molpayDiv.innerHTML = '';
                isClosingMolpay = false;
            }

            if (molpayTransactionRequestFrame) {
                molpayTransactionRequestFrame.remove();
            }

            if (window.MOLPayPrivacyScreen) {
                window.MOLPayPrivacyScreen.disable();
            }

        }
    }

    //capture image
    else if (data && data.indexOf(mppinstructioncapture) > -1) {
        regexp = new RegExp(mppinstructioncapture, 'g');
        base64HtmlString = data.replace(regexp, '');
        var json = JSON.parse(atob(base64HtmlString));

        //debug
        if (isInternalDebugging) {
            console.log('inAppCallback Imagebase64 ' + JSON.stringify(json))
        }

        //param of image
        var params = {
            data: json.base64ImageUrlData,
            prefix: json.filename,
            format: 'PNG',
            quality: 100,
            mediaScanner: true
        };
        window.imageSaver.saveBase64Image(params,
            //save image success callback
            function(filePath) {
                ImageSuccessToast();
            },
            //save image fail callback
            saveImageFailed
        );

        function ImageSuccessToast() {
            window.plugins.toast.showWithOptions({
                message: "Image saved success!",
                duration: 1000, // which is 2000 ms. "long" is 4000. Or specify the nr of ms yourself.
                position: "bottom"
            });
        }

        function ImageFailToast() {
            window.plugins.toast.showWithOptions({
                message: "Image saved fail!",
                duration: 1000,
                position: "bottom"
            });
        }

        function saveImageFailed() {
            var permissions = cordova.plugins.permissions;

            ImageFailToast();
            var errorCallback = function() {
                ImageFailToast();
            }

            permissions.requestPermission(
                permissions.WRITE_EXTERNAL_STORAGE,
                function(status) {
                    if (!status.hasPermission) {
                        errorCallback();
                    } else {
                        saveImage();
                    };
                },
                errorCallback);
        }

        var saveImage = function() {
            //plugin save image
            window.imageSaver.saveBase64Image(params,
                //save image success callback
                function(filePath) {
                    ImageSuccessToast();
                },
                //save image fail callback
                function(msg) {
                    ImageFailToast();
                }
            );
        }
    }

    // Run script on BankUI 
    if (data && data.indexOf(mprunscriptonpopup) > -1) {
        regexp = new RegExp(mprunscriptonpopup, 'g');
        base64HtmlString = data.replace(regexp, '');
        if (base64HtmlString && base64HtmlString.length > 0) {
            var script = window.atob(base64HtmlString);
            // Debug
            if (isInternalDebugging) {
                console.log('run script on popup, script =' + script);
            }
            bankUiWindow.executeScript({
                    code: script
                },
                function(values) {
                    // Debug
                    if (isInternalDebugging) {
                        console.log('run script on popup ok');
                    }
                });

        }
    }

};

var molpayCredentialsRequestFrame;
var testMerchantCredentialsCallback;
var onTestMerchantCredentialsDone = function(merchantTF, channel) {
    //return merchant data
    testMerchantCredentialsCallback(merchantTF, channel);

    // CLosing Molpay
    if (isClosingMolpay) {
        molpayDiv.innerHTML = '';
        isClosingMolpay = false;
    }

    if (molpayCredentialsRequestFrame) {
        molpayCredentialsRequestFrame.remove();
    }
};

var molpayChannelsRequestFrame;
var testMerchantChannelsCallback;
var onTestMerchantChannelsDone = function(merchantTF, channel) {
    //return merchant data
    if (testMerchantChannelsCallback) {
        testMerchantChannelsCallback(merchantTF, channel);
    }

    // CLosing Molpay
    if (isClosingMolpay) {
        molpayDiv.innerHTML = '';
        isClosingMolpay = false;
    }

    if (molpayChannelsRequestFrame) {
        molpayChannelsRequestFrame.remove();
    }
};

//-----------------------------------------
//--------------- Public API --------------
//-----------------------------------------

var exec = require('cordova/exec');

function MOLPay() {
    window.open = cordova.InAppBrowser.open;
}

MOLPay.prototype.startMolpay = function(paymentdetails, callback) {
    console.log('blah blah blah');

    // Debug
    if (isInternalDebugging) {
        console.log('MOLPay startmolpay paymentdetails = ' + JSON.stringify(paymentdetails, null, ''));
    }

    isClosingMolpay = false;
    isBankUiWindowClosedByCloseWindowEvent = false;

    try {
        molpayPaymentDetails = JSON.parse(paymentdetails);
    } catch (e) {
        molpayPaymentDetails = paymentdetails;
    }

    // Add module_id
    molpayPaymentDetails.module_id = moduleId;
    // Add wrapper_version
    molpayPaymentDetails.wrapper_version = wrapperVersion;

    transactionResultCallback = callback;

    if (window.MOLPayPrivacyScreen) {
        window.MOLPayPrivacyScreen.enable();
    }

    molpayDiv = document.getElementById('molpay');
    molpayDiv.style.width = '100%';
    molpayDiv.style.padding = '0px';
    molpayDiv.style.border = '0px';
    mainUiFrame = document.createElement('iframe');

    var mainUiFrameOnloadHandler = function(event) {
        mainUiFrame.contentWindow.updateSdkData(JSON.stringify(molpayPaymentDetails), inAppCallback);
        // mainUiFrame.contentWindow.enableInAppMode();
        mainUiFrame.removeEventListener('load', mainUiFrameOnloadHandler);
    };

    mainUiFrame.style.border = '0px';
    mainUiFrame.style.padding = '0px';
    mainUiFrame.style.width = '100%';
    mainUiFrame.style.height = '100%';
    mainUiFrame.id = 'mainUiFrame';
    mainUiFrame.allowScriptAccess = 'always';
    mainUiFrame.setAttribute('src', molpaySdkUrl);

    molpayDiv.appendChild(mainUiFrame);

    mainUiFrame.addEventListener('load', mainUiFrameOnloadHandler);
}

MOLPay.prototype.transactionRequest = function(paymentdetails, callback) {
    // Debug
    if (isInternalDebugging) {
        console.log('MOLPay transactionRequest paymentdetails = ' + JSON.stringify(paymentdetails, null, ''));
    }

    try {
        molpayPaymentDetails = JSON.parse(paymentdetails);
    } catch (e) {
        molpayPaymentDetails = paymentdetails;
    }

    // Add module_id
    molpayPaymentDetails.module_id = moduleId;
    // Add wrapper_version
    molpayPaymentDetails.wrapper_version = wrapperVersion;

    transactionResultCallback = callback;

    molpayTransactionRequestFrame = document.createElement('iframe');
    var molpayTransactionRequestFrameOnloadHandler = function(event) {
        molpayTransactionRequestFrame.contentWindow.updateSdkData(molpayPaymentDetails, inAppCallback);
        molpayTransactionRequestFrame.removeEventListener('load', molpayTransactionRequestFrameOnloadHandler);
    };
    molpayTransactionRequestFrame.id = 'molpayTransactionRequestFrame';
    molpayTransactionRequestFrame.allowScriptAccess = 'always';
    molpayTransactionRequestFrame.setAttribute('src', molpaySdkUrl);
    hideFrame(molpayTransactionRequestFrame);
    document.body.appendChild(molpayTransactionRequestFrame);
    molpayTransactionRequestFrame.addEventListener('load', molpayTransactionRequestFrameOnloadHandler);
}

MOLPay.prototype.closeMolpay = function() {
    mainUiFrame.contentWindow.closemolpay();
    // isClosingMolpay = true;
    // mainUiFrame.contentWindow.transactionRequest();
}

MOLPay.prototype.testMerchantCredentials = function(merchantData, callback) {
    if (callback) {
        testMerchantCredentialsCallback = callback;
    }
    molpayCredentialsRequestFrame = document.createElement('iframe');
    var molpayCredentialsRequestFrameOnloadHandler = function(event) {
        molpayCredentialsRequestFrame.contentWindow.testMerchantCredentials(merchantData, onTestMerchantCredentialsDone);
        molpayCredentialsRequestFrame.removeEventListener('load', molpayCredentialsRequestFrameOnloadHandler);
    };

    molpayCredentialsRequestFrame.allowScriptAccess = 'always';
    molpayCredentialsRequestFrame.setAttribute('src', molpaySdkUrl);
    hideFrame(molpayCredentialsRequestFrame);
    document.body.appendChild(molpayCredentialsRequestFrame);
    molpayCredentialsRequestFrame.addEventListener('load', molpayCredentialsRequestFrameOnloadHandler);
}

MOLPay.prototype.testMerchantChannels = function(merchantData, callback) {
    if (callback) {
        testMerchantChannelsCallback = callback;
    }
    molpayChannelsRequestFrame = document.createElement('iframe');
    var molpayChannelsRequestFrameOnloadHandler = function(event) {
        molpayChannelsRequestFrame.contentWindow.testMerchantChannels(merchantData, onTestMerchantChannelsDone);
        molpayChannelsRequestFrame.removeEventListener('load', molpayChannelsRequestFrameOnloadHandler);
    };

    molpayChannelsRequestFrame.allowScriptAccess = 'always';
    molpayChannelsRequestFrame.setAttribute('src', molpaySdkUrl);
    hideFrame(molpayChannelsRequestFrame);
    document.body.appendChild(molpayChannelsRequestFrame);
    molpayChannelsRequestFrame.addEventListener('load', molpayChannelsRequestFrameOnloadHandler);
}

var molpay = new MOLPay();
module.exports = molpay;

//---------------------------------------------------------------------------
//--------------- End of MOLPay Cordova Plugin Implementations --------------
//---------------------------------------------------------------------------
