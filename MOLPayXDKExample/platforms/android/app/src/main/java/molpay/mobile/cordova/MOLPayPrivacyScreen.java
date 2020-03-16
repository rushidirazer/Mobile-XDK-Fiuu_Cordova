package molpay.mobile.cordova.privacyscreen;

import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.view.WindowManager;
import android.app.Activity;

public class MOLPayPrivacyScreen extends CordovaPlugin {
    private static final String ACTION_ENABLE = "enable";
    private static final String ACTION_DISABLE = "disable";

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        Activity activity = this.cordova.getActivity();
        if(android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.LOLLIPOP_MR1) {
            activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        }
    }

    @Override
    public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
        final CallbackContext callbacks = callbackContext;

        if (ACTION_DISABLE.equals(action)) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try{
                        cordova.getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                    }catch(Exception e){}
                }
            });
        }else if(ACTION_ENABLE.equals(action)){
            cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try{
                        cordova.getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
                    }catch(Exception e){}
                }
            });
        }

        return true;
    }
}
