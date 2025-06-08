

## Intro

ZahniHero is an interactive toothbrushing assistant designed specifically for children, to motivate them to brush their teeth for up to 3 minutes. As soon as brushing begins, ZahniHero uses sound or vibration sensors to detect activity and activates colorful LED animations: blue after 1 minute, flashing white after 2 minutes, and a rainbow light after 3 minutes. The goal is to make brushing fun and to encourage healthy, consistent habits.

In addition to the physical device, the companion website https://zahnihero.yiyun.me/ offers a digital extension. Here, parents and dentists can view brushing history and duration through visual dashboards, providing additional guidance. The site is connected to our Supabase database, which collects real-time brushing data from each device.

ZahniHero – for better brushing routines, powered by play and supported by data — without screens. Unlike other products on the market that rely on an additional tablet to entertain children during brushing, ZahniHero keeps the experience simple, focused, and engaging.

![ZahniHero Prototype](images/final.jpg)




## Table of Contents

- [Idea](#idea)
- [Short Project Video](#short-project-video)  
- [Approach](#approach)  
- [Challenges and Lessons Learned](#challenges-and-lessons-learned)  
- [Technology](#technology)  
- [UX](#ux)  
- [Known Bugs](#known-bugs)  
- [Task Distribution](#task-distribution)  


---

## Idea

Almost all kids lack the patience to brush their teeth for the full 3 minutes.
I wanted to make toothbrushing more fun and effective for my daughter — and for other children — without relying on screens.
ZahniHero replaces tablets and cartoons with playful light signals, encouraging longer and healthier brushing.
The more advanced idea is to make the toothbrush interact with kids through stories, music, and riddles.


---
## Short Project Video

The video is presented in 3 parts:

Part 1: Viberation sensor with LED light

[![Watch ZahniHero Video](https://img.youtube.com/vi/NR-hUWGv0vA/0.jpg)](https://www.youtube.com/watch?v=NR-hUWGv0vA)

Part 2: INMP441 microphone with data transmission

[![Watch ZahniHero Part 2](https://img.youtube.com/vi/-_n2oewAVD4/0.jpg)](https://youtu.be/-_n2oewAVD4)

Part 3: Data is wireless uploaded to Supabase in real time

[![Watch ZahniHero Part 3](https://img.youtube.com/vi/d6UzlYEBhSQ/0.jpg)](https://www.youtube.com/watch?v=d6UzlYEBhSQ)


Unfortunately, I originally planned a fourth Video— a demonstration of the sound sensor and LED integrated directly into the toothbrush. 
However, due to the lack of 3D printing tools and a broken LED pin during assembly, I wasn’t able to complete the 4th video.


---

## Approach


I combined hardware (ESP32-C6, INMP441 microphone, and LEDs) with a Supabase-powered database and a simple web interface.
The development focused on delivering clear feedback, minimizing distractions, and providing parental insight.




### Vibration sensor

![ZahniHero Prototype](images/all.jpg)


Originally, I planned to use the SW-420 vibration sensor (first row, left). However, during testing, the sensor couldn’t reliably distinguish between tooth brushing and non-brushing activity — the output values ranged unpredictably from 100 to 1000.


So I tried two other vibration sensors: the ADXL335 (first row, middle) and a piezoelectric sensor (first row, right), as well as the INMP441 microphone (second row). Among the two vibration sensors, the ADXL335 gave relatively satisfactory results. Although the values were still a bit unstable, the difference between brushing and not brushing was noticeably larger. Tested picture below.


![ZahniHero Prototype](images/ADXL335.jpg)

### Microphone sensor

In discussion with Jan, he suggested that I test the INMP441 Microphone sensor — which I eventually chose to use in the final version.

![ZahniHero Prototype](images/final.jpg)



---

## Challenges and Lessons Learned

### Implementation of I2S with ESP32-C6
I had difficulties setting up the I2S with the ESP32-C6. ChatGPT initially provided incorrect code and even concluded that the INMP441 sensor and the chip were incompatible. With the help of the datasheet and a YouTube video, I was finally able to configure everything correctly.
  
During the development process, I documented the setup and implementation of I2S (with the INMP441 microphone) on the ESP32-C6.  
This includes configuration, wiring, and key challenges I encountered.

📎 [GitHub Repository – ESP32-C6 with INMP441](https://github.com/yiyunlinch/ESP32-INMP441)


### Brushing logic
Designing a brushing detection algorithm based on vibration or sound patterns was challenging for two reasons. First, the vibration from brushing tends to fade and rise again every 10 seconds or so. Second, all the sensors produce fluctuating values, but I needed to detect continuous brushing, not short interruptions. A brief drop in sensor values shouldn't be interpreted as the user having stopped brushing.
So, I defined the brushing logic as follows:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Brushing is detected based on the I2S Microphone sensor value exceeding 100 or dropping below -100.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Sound is sampled every 100 milliseconds.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Every second, the system checks if there were at least 3 active readings (i.e., brushing activity).

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;This one-second brushing status is saved into a 5-second rolling window.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;If at least 3 out of the last 5 seconds were brushing-active, the system considers the user to be currently brushing.


### Debugging

During the process of uploading toothbrush data to Supabase and displaying it on the website, I encountered issues where the data wouldn’t appear. ChatGPT’s debugging suggestions were not always correct — I realized it's important to critically assess AI suggestions and rely on my own judgment and testing as well.

![ZahniHero Prototype](images/supabase.png)

---

## Technology

### Physisch
- ESP32 Dev Modul  
- INMP441 microphone
- LED 
- SW-420 vibrationsensor (für Tests) 
- Piezoelektrisches Vibrationsschalter-Modul 5.0V DC (für Tests)
- Arduino - Piezo Vibrationssensor (für Tests)  

### Digital
- Arduino (C/C++)  
- Supabase (Datenbank & REST API)  
- HTML, CSS, JavaScript  
- Webserver 
- OTA (Over-the-Air Updates für Firmware)  

## Data structure

### Screen Flow

A flow diagram was created to visualize the information flow throughout the ZahniHero system.

![ZahniHero Prototype](images/figma.png)

[View the interactive Figma prototype](https://www.figma.com/design/RrmlAfJ9aAwzEVlInX0cJs/Figma-basics?node-id=1669-162202&p=f&t=eWxupG4LIomI9mJN-0)


### Final breadboard

![ZahniHero Prototype](images/I2S_Steckplatine.png)



---

## UX

### UX from the Toothbrush

Final Product visual reference

![ZahniHero Prototype](images/reference.png)

The UX design was informed by insights from user interviews.  
🔗 [Figma link to interview results](https://www.figma.com/design/wadJ1YZ3SQiw23xoVoVQCV/AppKonzeption?node-id=0-1&t=GbyrRmA4R8Lrk3HM-1)


![ZahniHero Prototype](images/interview.jpg)

As a parent myself and based on user interviews, I understand that children respond better to lights and color changes.  
LED feedback is more engaging and motivating for them than a voice simply  announcing "one minute," "two minutes," or "finished."
In the future, another model could focus on music, stories, and riddles. Additionally, more detailed data—such as brushing areas—could be collected for improved feedback.


---

### UX from the Web Interface

This website is designed for parents and dentists to view clear, simple visual summaries and analyses. It is not intended for interaction with children.

![ZahniHero Prototype](images/login.png)

![ZahniHero Prototype](images/web.png)



---

## Known Bugs

- The sensitivity of the sensors is relatively low, and the brushing detection algorithm still needs improvement.
- A final test could not be conducted with both the sound sensor and LED securely mounted on the toothbrush and protected with a waterproof casing.
  

---

## Task Distribution
The entire project was independently developed and implemented by Yiyun Lin.
This project was built using AI tools such as ChatGPT and GitHub Copilot to facilitate documentation, programming, and debugging.



