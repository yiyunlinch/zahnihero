/**************************************************************
* ZahniHero_I2S_BrushTracker_annotated.ino
*  Reads sound data from I2S microphone using ESP32
*  Computes signal activity and uploads brushing session data
*  to Supabase when brushing starts and ends.
*
*  Mic Wiring:
*  Mic Vin    <--> ESP32-C6: 3.3V
*  Mic GND    <--> ESP32-C6: GND
*  Mic Data   <--> ESP32-C6: GPIO13
*  Mic BCLK   <--> ESP32-C6: GPIO2
*  Mic L/R    <--> ESP32-C6: GPIO15
**************************************************************/

#include <WiFi.h>          // For WiFi connection
#include <HTTPClient.h>    // For HTTP POST requests
#include <ArduinoOTA.h>    // For OTA update functionality
#include <driver/i2s.h>    // For I2S microphone input
#include <time.h>          // For timestamp formatting

#define I2S_WS 15          // Word select pin (L/R clock)
#define I2S_SD 13          // Serial data in from microphone
#define I2S_SCK 2          // Bit clock pin
#define I2S_PORT I2S_NUM_0 // I2S port selection
#define BUFFER_LEN 64      // I2S buffer size
int16_t sBuffer[BUFFER_LEN]; // Buffer for incoming audio samples

#define LED_PIN 4          // LED indicator pin

const char* ssid = "WalkerRouter";               // WiFi SSID
const char* password = "Wifi1Wifi2Wifi3";        // WiFi Password

const char* supabaseUrl = "https://timhflcxsmjlyqjnymrm.supabase.co/rest/v1/brush_records";  // Supabase API URL
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";  // Supabase anon key
const char* deviceId = "Maxi";                   // Device identifier

bool isBrushing = false;                         // Current brushing status
unsigned long brushingStartTime = 0;             // When brushing started
bool brushingHistory[5] = {false};               // Last 5 seconds activity
int brushingIndex = 0;                           // Circular index

void i2s_install() {
  // Define and install I2S driver configuration
  i2s_config_t config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),   // Master + RX
    .sample_rate = 44100,                                  // Audio sample rate
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,          // 16-bit resolution
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,           // Left channel only
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,     // Standard I2S format
    .intr_alloc_flags = 0, .dma_buf_count = 8,
    .dma_buf_len = BUFFER_LEN, .use_apll = false,
    .tx_desc_auto_clear = false, .fixed_mclk = 0
  };
  i2s_driver_install(I2S_PORT, &config, 0, NULL);          // Apply config
}

void i2s_setpin() {
  // Assign GPIO pins for I2S
  const i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,       // Bit Clock
    .ws_io_num = I2S_WS,         // Word Select (L/R)
    .data_out_num = -1,          // Not transmitting
    .data_in_num = I2S_SD        // Mic data in
  };
  i2s_set_pin(I2S_PORT, &pin_config);                      // Apply pin map
}

String getCurrentTimestamp() {
  // Return ISO 8601 formatted UTC timestamp
  time_t now = time(nullptr);
  struct tm* t = gmtime(&now);
  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", t);
  return String(buf);
}

void uploadRecord(int duration, String timestamp) {
  // Send brush session data to Supabase
  HTTPClient http;
  http.begin(supabaseUrl);
  http.addHeader("apikey", supabaseKey);                  // API key
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  http.addHeader("Content-Type", "application/json");     // JSON format

  String body = "{"device":"" + String(deviceId) +
                "","duration":" + String(duration) +
                ","timestamp":"" + timestamp + ""}";

  int code = http.POST(body);                             // POST request
  http.end();
}

void setup() {
  Serial.begin(115200);                                   // Init serial
  delay(1000);

  WiFi.begin(ssid, password);                             // Connect WiFi
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected");
  Serial.println(WiFi.localIP());

  configTime(0, 0, "pool.ntp.org");                        // Time sync

  ArduinoOTA.setHostname("zahnihero");                    // OTA setup
  ArduinoOTA.setPassword("11111");
  ArduinoOTA.begin();

  i2s_install();                                           // Init I2S
  i2s_setpin();
  i2s_start(I2S_PORT);

  pinMode(LED_PIN, OUTPUT);                                // LED output
}

void loop() {
  ArduinoOTA.handle();                                     // Check OTA

  static unsigned long lastSampleTime = 0;
  static unsigned long secondTimer = 0;
  static int activeCount = 0;

  if (millis() - lastSampleTime >= 100) {
    size_t bytesRead;
    esp_err_t result = i2s_read(I2S_PORT, &sBuffer, sizeof(sBuffer), &bytesRead, portMAX_DELAY);
    if (result == ESP_OK && bytesRead >= 2) {
      int16_t value = sBuffer[0];                          // First sample
      bool active = (value > 100 || value < -100);         // Noise threshold
      if (active) activeCount++;                           // Count loud sample

      secondTimer += 100;
      if (secondTimer >= 1000) {
        brushingHistory[brushingIndex] = (activeCount >= 3);  // At least 3/10 samples active
        brushingIndex = (brushingIndex + 1) % 5;           // Circular index
        secondTimer = 0;
        activeCount = 0;

        int brushingSeconds = 0;
        for (int i = 0; i < 5; i++) if (brushingHistory[i]) brushingSeconds++;

        bool brushingNow = brushingSeconds >= 3;           // 3 of 5 sec active
        if (brushingNow && !isBrushing) {
          isBrushing = true;
          brushingStartTime = millis();
          String ts = getCurrentTimestamp();
          Serial.println("Brushing begin at: " + ts);
          digitalWrite(LED_PIN, HIGH);                     // LED ON
        } else if (!brushingNow && isBrushing) {
          isBrushing = false;
          int duration = (millis() - brushingStartTime) / 1000;
          String ts = getCurrentTimestamp();
          Serial.println("Brushing stopped at: " + ts);
          Serial.println("Total duration: " + String(duration) + "s");
          digitalWrite(LED_PIN, LOW);                      // LED OFF
          if (duration > 5) {
            uploadRecord(duration, ts);                    // Upload session
          } else {
            Serial.println("⏱️ Duration too short, not uploaded.");
          }
        }

        if (isBrushing) {
          int duration = (millis() - brushingStartTime) / 1000;
          if (duration < 5) {
            analogWrite(LED_PIN, 255);                     // Dim white
          } else if (duration < 10) {
            analogWrite(LED_PIN, (duration % 3) * 85);     // Change color
          } else {
            analogWrite(LED_PIN, random(0, 256));          // Rainbow flicker
          }
        }
      }
      Serial.println((active ? "Brushing " : "Stop Brushing ") + String(value));
    }
    lastSampleTime = millis();
  }
}
