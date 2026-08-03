package com.app.housekeeping.network;

import android.os.Handler;
import android.os.Looper;

import com.app.housekeeping.BuildConfig;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ApiClient {

    public static final String BASE_URL = BuildConfig.BASE_URL;
    private static volatile String authToken = null;

    private static final ExecutorService executor = Executors.newFixedThreadPool(4);
    private static final Handler mainHandler = new Handler(Looper.getMainLooper());

    public interface ApiCallback<T> {
        void onSuccess(T result);
        void onError(String errorMessage);
    }

    public static void setAuthToken(String token) {
        authToken = token;
    }

    public static String getAuthToken() {
        if (authToken != null && !authToken.isEmpty()) {
            return authToken;
        }
        return BuildConfig.AUTH_TOKEN;
    }

    private static void applyDefaultHeaders(HttpURLConnection conn) {
        conn.setRequestProperty("Accept", "application/json");
        String token = getAuthToken();
        if (token != null && !token.isEmpty()) {
            conn.setRequestProperty("Authorization", "Bearer " + token);
        }
    }

    public static void post(String endpoint, JSONObject jsonBody, ApiCallback<JSONObject> callback) {
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(BASE_URL + endpoint);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; utf-8");
                applyDefaultHeaders(conn);
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                conn.setDoOutput(true);

                if (jsonBody != null) {
                    byte[] input = jsonBody.toString().getBytes(StandardCharsets.UTF_8);
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(input, 0, input.length);
                    }
                }

                int statusCode = conn.getResponseCode();
                InputStream is = (statusCode >= 200 && statusCode < 300) ? conn.getInputStream() : conn.getErrorStream();
                String responseStr = readStream(is);

                if (statusCode >= 200 && statusCode < 300) {
                    JSONObject resJson = new JSONObject(responseStr);
                    mainHandler.post(() -> callback.onSuccess(resJson));
                } else {
                    String detail = "HTTP " + statusCode;
                    try {
                        JSONObject errJson = new JSONObject(responseStr);
                        if (errJson.has("detail")) {
                            detail = errJson.getString("detail");
                        }
                    } catch (Exception ignored) {}
                    String finalDetail = detail;
                    mainHandler.post(() -> callback.onError(finalDetail));
                }
            } catch (Exception e) {
                e.printStackTrace();
                mainHandler.post(() -> callback.onError(e.getMessage() != null ? e.getMessage() : "Network error"));
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        });
    }

    public static void getArray(String endpoint, ApiCallback<JSONArray> callback) {
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(BASE_URL + endpoint);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                applyDefaultHeaders(conn);
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);

                int statusCode = conn.getResponseCode();
                InputStream is = (statusCode >= 200 && statusCode < 300) ? conn.getInputStream() : conn.getErrorStream();
                String responseStr = readStream(is);

                if (statusCode >= 200 && statusCode < 300) {
                    JSONArray resJson = new JSONArray(responseStr);
                    mainHandler.post(() -> callback.onSuccess(resJson));
                } else {
                    String detail = "HTTP " + statusCode;
                    try {
                        JSONObject errJson = new JSONObject(responseStr);
                        if (errJson.has("detail")) {
                            detail = errJson.getString("detail");
                        }
                    } catch (Exception ignored) {}
                    String finalDetail = detail;
                    mainHandler.post(() -> callback.onError(finalDetail));
                }
            } catch (Exception e) {
                e.printStackTrace();
                mainHandler.post(() -> callback.onError(e.getMessage() != null ? e.getMessage() : "Network error"));
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        });
    }

    public static void getObject(String endpoint, ApiCallback<JSONObject> callback) {
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(BASE_URL + endpoint);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                applyDefaultHeaders(conn);
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);

                int statusCode = conn.getResponseCode();
                InputStream is = (statusCode >= 200 && statusCode < 300) ? conn.getInputStream() : conn.getErrorStream();
                String responseStr = readStream(is);

                if (statusCode >= 200 && statusCode < 300) {
                    JSONObject resJson = new JSONObject(responseStr);
                    mainHandler.post(() -> callback.onSuccess(resJson));
                } else {
                    String detail = "HTTP " + statusCode;
                    try {
                        JSONObject errJson = new JSONObject(responseStr);
                        if (errJson.has("detail")) {
                            detail = errJson.getString("detail");
                        }
                    } catch (Exception ignored) {}
                    String finalDetail = detail;
                    mainHandler.post(() -> callback.onError(finalDetail));
                }
            } catch (Exception e) {
                e.printStackTrace();
                mainHandler.post(() -> callback.onError(e.getMessage() != null ? e.getMessage() : "Network error"));
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        });
    }

    private static String readStream(InputStream is) {
        if (is == null) return "";
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
