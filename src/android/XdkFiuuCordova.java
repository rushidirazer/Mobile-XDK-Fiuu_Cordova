package com.fiuu.cordova;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;

import java.util.HashMap;
import java.util.UUID;

import org.apache.cordova.CallbackContext;

import org.json.JSONException;
import org.json.JSONArray;
import org.json.JSONObject;

import android.content.Intent;
import com.molpay.molpayxdk.MOLPayActivity;
import com.molpay.molpayxdk.googlepay.ActivityGP;
import androidx.activity.result.ActivityResult;
import android.content.ActivityNotFoundException;
import android.app.Activity;
import java.util.UUID;

/**
 * This class echoes a string back from the native layer
 */
public class XdkFiuuCordova extends CordovaPlugin {
    private static final int REQ_PAYMENT = 9001;
    private CallbackContext activeCb;
    private boolean inFlight = false;

    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        if ("startPayment".equals(action)) {
            if (inFlight) {
                callbackContext.error("xdebug: plugins - Payment already in progress");
                return true;
            }

            this.activeCb = callbackContext;
            this.inFlight = true;
            cordova.getThreadPool().execute(() -> {
                try {
                    startPayment(args);
                } catch (Exception e) {
                    this.activeCb.error(e.getMessage());
                    inFlight = false;
                    activeCb = null;
                }
            });
            return true;
        }
        return false; // action not recognized
    }

    private String checkMissing(JSONObject obj, String... requiredKeys) {
        for (String key : requiredKeys) {
            if (!obj.has(key) || obj.isNull(key)) {
                return key;
            }
        }
        return null;
    }

    private void verifyRequiredParameter(JSONObject data) throws Exception {
        String missing = checkMissing(data, "mp_username",
                "mp_password", "mp_merchant_ID", "mp_app_name", "mp_verification_key", "mp_amount", "mp_order_ID",
                "mp_currency", "mp_country");
        if (missing != null) {
            throw new Exception("Missing required parameter");
        }
    }

    private void startPayment(JSONArray args) throws Exception {

        Activity activity = cordova.getActivity();

        HashMap<String, Object> paymentDetails = new HashMap<>();
        JSONObject data = args.optJSONObject(0);
        // JSONObject data = args == null ? new JSONObject() : args.getJSONObject(0);
        verifyRequiredParameter(data);

        for (int i = 0; i < data.names().length(); i++) {
            String key = data.names().getString(i);
            Object value = data.get(key);
            paymentDetails.put(key, value);
        }

        paymentDetails.put("client_attempt_uuid", UUID.randomUUID().toString());
        paymentDetails.put("client_timestamp_ms", System.currentTimeMillis());

        // Start MOLPayActivity
        Intent intent;
        cordova.setActivityResultCallback(this);

        if (!paymentDetails.containsKey(MOLPayActivity.mp_channel)) {
            intent = new Intent(activity, com.molpay.molpayxdk.googlepay.ActivityGP.class);
        } else {
            intent = new Intent(activity, MOLPayActivity.class);
        }

        // Note: These flags help task/UX, not network cache.
        intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
        intent.putExtra(MOLPayActivity.MOLPayPaymentDetails, paymentDetails);
        cordova.getActivity().startActivityForResult(intent, REQ_PAYMENT);
    }

    @Override
    public void onActivityResult(int reqCode, int resultCode, Intent data) {
        if (reqCode != REQ_PAYMENT) {
            this.activeCb.error("payment failed");
            return;
        }

        if (data != null && data.hasExtra(MOLPayActivity.MOLPayTransactionResult)) {
            String transactionResult = data.getStringExtra(MOLPayActivity.MOLPayTransactionResult);
            this.activeCb.success(transactionResult);
        } else {
            this.activeCb.error("Payment failed or was canceled");
        }

        inFlight = false;
        activeCb = null;
    }

    @Override
    public void onReset() {
        // Dipanggil bila WebView reload — pastikan clear state
        inFlight = false;
        activeCb = null;
        super.onReset();
    }
}
