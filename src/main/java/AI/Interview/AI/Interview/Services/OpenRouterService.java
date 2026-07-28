package AI.Interview.AI.Interview.Services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

    @Service
    public class OpenRouterService {

        @Value("${openrouter.api.key}")
        private String apiKey;

        @Value("${openrouter.model}")
        private String model;

        public String chat(String prompt) {

            try {

                URL url = new URL("https://openrouter.ai/api/v1/chat/completions");

                HttpURLConnection con =
                        (HttpURLConnection) url.openConnection();

                con.setRequestMethod("POST");
                con.setRequestProperty("Authorization", "Bearer " + apiKey);
                con.setRequestProperty("Content-Type", "application/json");

                // Optional but recommended by OpenRouter
                con.setRequestProperty("HTTP-Referer", "http://localhost");
                con.setRequestProperty("X-Title", "AI Interview System");

                con.setDoOutput(true);

                String json =
                        "{"
                                + "\"model\":\"" + model + "\","
                                + "\"messages\":["
                                + "{"
                                + "\"role\":\"user\","
                                + "\"content\":\"" + prompt.replace("\"", "\\\"") + "\""
                                + "}"
                                + "]"
                                + "}";

                OutputStream os = con.getOutputStream();
                os.write(json.getBytes("UTF-8"));
                os.flush();
                os.close();

                InputStream is;

                if (con.getResponseCode() >= 400) {
                    is = con.getErrorStream();
                } else {
                    is = con.getInputStream();
                }

                ObjectMapper mapper = new ObjectMapper();

                JsonNode root = mapper.readTree(is);

                if (root.has("error")) {
                    return "ERROR: " + root.get("error").get("message").asText();
                }

                return root
                        .get("choices")
                        .get(0)
                        .get("message")
                        .get("content")
                        .asText();

            } catch (Exception e) {

                return "ERROR: " + e.getMessage();
            }
        }
    }
