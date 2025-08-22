package com.fiuu.cordova;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;

import java.util.HashMap;

import org.apache.cordova.CallbackContext;

import org.json.JSONException;
import org.json.JSONArray;
import org.json.JSONObject;

import android.content.Intent;
import com.molpay.molpayxdk.MOLPayActivity;
import com.molpay.molpayxdk.googlepay.ActivityGP;
import androidx.activity.result.ActivityResult;
import android.app.Activity;

/**
 * This class echoes a string back from the native layer
 */
public class XdkFiuuCordova extends CordovaPlugin {
    private static final int REQ_PAYMENT = 9001;
    private CallbackContext activeCb;
    private boolean inFlight = false;

    public boolean execute(String action, JSONArray args, CallbackContext callbackContext){
        if ("startPayment".equals(action)) {

            if (inFlight) {
                callbackContext.error("Payment already in progress");
                return true;
            }

            this.activeCb = callbackContext;
            this.inFlight = true;

       

            startPayment(args, callbackContext);
            return true;
        }
        return false; // action not recognized
    }

    private void sendSuccess(String data) {
        try {
            JSONObject jsonData = new JSONObject()
                .put("result", data);
        System.out.println("sendSuccess"+jsonData);
            sendUpdate(PluginResult.Status.OK,jsonData, false);
        } catch (Exception e) {
            // TODO: handle exception
            sendFailure("Failed to parse success data");
        }
    }

    private void sendFailure(String message) {
        try {
            JSONObject jsonData = new JSONObject()
                .put("status", "ERROR")
                .put("message", message);
        System.out.println("sendFailure"+jsonData);
            sendUpdate(PluginResult.Status.ERROR,jsonData, false);
        } catch (Exception e) {
            // TODO: handle exception
        }
    }

    private void sendUpdate(PluginResult.Status status,JSONObject data, boolean keep) {
        try {
            if (activeCb == null) return;
            if(status == PluginResult.Status.OK) {
                activeCb.success(data);
            }else{
                activeCb.error(data);
            }
            // PluginResult pr = new PluginResult(status, data);
            // pr.setKeepCallback(keep);
            // if (activeCb != null) activeCb.sendPluginResult(pr);
        } catch (Exception ignored) {}
    }

    private void startPayment(JSONArray args, CallbackContext callbackContext) {
        this.activeCb = callbackContext;
        Activity activity = cordova.getActivity();

        HashMap<String, Object> paymentDetails = new HashMap<>();

        try {
            JSONObject data = args == null ? new JSONObject() : args.getJSONObject(0);
            for (int i = 0; i < data.names().length(); i++) {
                String key = data.names().getString(i);
                Object value = data.get(key);
                paymentDetails.put(key, value);
            }
        } catch (Exception e) {
            sendFailure("Invalid payment data: " + e.getMessage());
        }

        // Start MOLPayActivity
        Intent intent;
        System.out.println("Starting payment with amount: " + paymentDetails.toString());

        if (!paymentDetails.containsKey(MOLPayActivity.mp_channel)) {
            intent = new Intent(activity, com.molpay.molpayxdk.googlepay.ActivityGP.class);
        } else {
            intent = new Intent(activity, MOLPayActivity.class);
        }

        intent.putExtra(MOLPayActivity.MOLPayPaymentDetails, paymentDetails);
        cordova.setActivityResultCallback(this);
        cordova.getActivity().startActivityForResult(intent, REQ_PAYMENT);
    }

    @Override
    public void onActivityResult(int reqCode, int resultCode, Intent data) {
        if (reqCode != REQ_PAYMENT || activeCb == null) return;

        JSONObject response = new JSONObject();
        
       if (data != null && data.hasExtra(MOLPayActivity.MOLPayTransactionResult)) {
            String transactionResult = data.getStringExtra(MOLPayActivity.MOLPayTransactionResult);
            sendSuccess(transactionResult);
        } else {
            sendFailure("Payment failed or was canceled");
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
