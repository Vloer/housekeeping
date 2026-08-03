package com.app.housekeeping.household;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;

import com.app.housekeeping.R;
import com.app.housekeeping.network.ApiClient;
import com.google.android.material.textfield.TextInputLayout;

import org.json.JSONObject;

public class HouseholdOnboardingDialog {

    public interface OnHouseholdSetupListener {
        void onHouseholdSetupSuccess();
        default void onHouseholdSetupDismissed() {}
    }

    public static void show(Context context, OnHouseholdSetupListener listener) {
        View view = LayoutInflater.from(context).inflate(R.layout.dialog_household_onboarding, null);
        RadioGroup radioGroup = view.findViewById(R.id.radio_group_option);
        RadioButton radioCreate = view.findViewById(R.id.radio_create);
        TextInputLayout inputLayoutName = view.findViewById(R.id.input_layout_name);
        TextInputLayout inputLayoutCode = view.findViewById(R.id.input_layout_code);
        EditText editName = view.findViewById(R.id.edit_household_name);
        EditText editCode = view.findViewById(R.id.edit_join_code);

        EditText editUserName = view.findViewById(R.id.edit_user_name);

        radioGroup.setOnCheckedChangeListener((group, checkedId) -> {
            if (checkedId == R.id.radio_create) {
                inputLayoutName.setVisibility(View.VISIBLE);
                inputLayoutCode.setVisibility(View.GONE);
            } else {
                inputLayoutName.setVisibility(View.GONE);
                inputLayoutCode.setVisibility(View.VISIBLE);
            }
        });

        AlertDialog dialog = new AlertDialog.Builder(context)
                .setView(view)
                .setCancelable(true)
                .setPositiveButton(R.string.continue_button, null)
                .setNegativeButton(R.string.cancel, (d, which) -> d.dismiss())
                .create();

        dialog.setOnDismissListener(d -> {
            if (listener != null) {
                listener.onHouseholdSetupDismissed();
            }
        });

        dialog.show();

        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String userName = editUserName.getText().toString().trim();
            if (userName.isEmpty()) {
                Toast.makeText(context, R.string.please_enter_user_name, Toast.LENGTH_SHORT).show();
                return;
            }
            String userUuid = HouseholdManager.getInstance(context).getUserUuid();

            if (radioCreate.isChecked()) {
                String name = editName.getText().toString().trim();
                if (name.isEmpty()) {
                    Toast.makeText(context, R.string.please_enter_household_name, Toast.LENGTH_SHORT).show();
                    return;
                }
                try {
                    JSONObject body = new JSONObject();
                    body.put("name", name);
                    body.put("user_name", userName);
                    body.put("user_uuid", userUuid);
                    ApiClient.post("/households/create", body, new ApiClient.ApiCallback<JSONObject>() {
                        @Override
                        public void onSuccess(JSONObject result) {
                            try {
                                int id = result.getInt("household_id");
                                String hName = result.getString("name");
                                String code = result.getString("join_code");
                                String uName = result.optString("username", userName);
                                HouseholdManager.getInstance(context).addHousehold(id, hName, code, uName);
                                Toast.makeText(context, context.getString(R.string.household_created_toast, code), Toast.LENGTH_LONG).show();
                                dialog.dismiss();
                                if (listener != null) listener.onHouseholdSetupSuccess();
                            } catch (Exception e) {
                                Toast.makeText(context, R.string.error_server_response, Toast.LENGTH_SHORT).show();
                            }
                        }

                        @Override
                        public void onError(String errorMessage) {
                            Toast.makeText(context, context.getString(R.string.failed_with_error, errorMessage), Toast.LENGTH_LONG).show();
                        }
                    });
                } catch (Exception e) {
                    Toast.makeText(context, R.string.request_error, Toast.LENGTH_SHORT).show();
                }
            } else {
                String code = editCode.getText().toString().trim().toUpperCase();
                if (code.isEmpty()) {
                    Toast.makeText(context, R.string.please_enter_join_code, Toast.LENGTH_SHORT).show();
                    return;
                }
                try {
                    JSONObject body = new JSONObject();
                    body.put("join_code", code);
                    body.put("user_name", userName);
                    body.put("user_uuid", userUuid);
                    ApiClient.post("/households/join", body, new ApiClient.ApiCallback<JSONObject>() {
                        @Override
                        public void onSuccess(JSONObject result) {
                            try {
                                int id = result.getInt("household_id");
                                String hName = result.getString("name");
                                String jCode = result.getString("join_code");
                                String uName = result.optString("username", userName);
                                HouseholdManager.getInstance(context).addHousehold(id, hName, jCode, uName);
                                Toast.makeText(context, context.getString(R.string.joined_household_toast, hName), Toast.LENGTH_LONG).show();
                                dialog.dismiss();
                                if (listener != null) listener.onHouseholdSetupSuccess();
                            } catch (Exception e) {
                                Toast.makeText(context, R.string.error_server_response, Toast.LENGTH_SHORT).show();
                            }
                        }

                        @Override
                        public void onError(String errorMessage) {
                            Toast.makeText(context, context.getString(R.string.failed_with_error, errorMessage), Toast.LENGTH_LONG).show();
                        }
                    });
                } catch (Exception e) {
                    Toast.makeText(context, R.string.request_error, Toast.LENGTH_SHORT).show();
                }
            }
        });
    }
}
