# Interactive Hearing Loss Simulator

A web-based audio simulation tool built using vanilla HTML, CSS, JavaScript, and the **Web Audio API**. It allows users to manipulate audiogram hearing thresholds across standard frequencies for both the left and right ears independently to experience how sensorineural hearing loss alters perception.

## Features
- **Real-Time Frequency Filtering:** Uses multi-band Web Audio `BiquadFilterNode` chains to dynamically attenuate frequency regions based on user thresholds.
- **Asymmetric Loss & Single-Sided Deafness (SSD):** Full independent control over left and right headphone audio channels.
- **Preset Scenarios:** Instantly test configurations like Normal Hearing, Age-Related High-Frequency Sloping Loss (Presbycusis), 4 kHz Noise Notches, and Single-Sided Deafness.
- **Custom Audio Support:** Upload and test any `.mp3` or `.wav` track directly in your browser.

## Running Locally
1. Clone the repository.
2. Open `index.html` in any modern web browser or serve via a local static server.
# Hearing-Loss-Simulator