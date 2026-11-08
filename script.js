// Standard audiometric frequencies to simulate
const frequencies = [250, 500, 1000, 2000, 4000, 8000];

// Audio context & node state
let audioCtx = null;
let audioElement = document.getElementById('audioElement');
let sourceNode = null;
let splitter = null;
let merger = null;

let leftFilters = [];
let rightFilters = [];

// Store current threshold settings state
let state = {
    left: { 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0, 8000: 0 },
    right: { 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0, 8000: 0 }
};

// Initialize UI Sliders on Load
window.addEventListener('DOMContentLoaded', () => {
    buildSliders('left', 'leftSliders');
    buildSliders('right', 'rightSliders');
    setupPresetListeners();
    setupAudioUpload();
});

function buildSliders(earSide, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    frequencies.forEach(freq => {
        const div = document.createElement('div');
        div.className = 'slider-group';

        const label = document.createElement('label');
        label.innerHTML = `${freq >= 1000 ? (freq/1000) + ' kHz' : freq + ' Hz'}: <span id="${earSide}-${freq}-val">0</span> dB HL`;

        const input = document.createElement('input');
        input.type = 'range';
        input.min = '0';
        input.max = '90';
        input.step = '5';
        input.value = '0';
        input.id = `${earSide}-${freq}`;

        input.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            state[earSide][freq] = val;
            document.getElementById(`${earSide}-${freq}-val`).innerText = val;
            updateFilterGains();
        });

        div.appendChild(label);
        div.appendChild(input);
        container.appendChild(div);
    });
}

// Set up Web Audio API pipeline when audio starts playing
audioElement.addEventListener('play', () => {
    if (!audioCtx) {
        initAudioPipeline();
    } else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
});

function initAudioPipeline() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    sourceNode = audioCtx.createMediaElementSource(audioElement);
    splitter = audioCtx.createChannelSplitter(2);
    merger = audioCtx.createChannelMerger(2);

    // Create filter chains
    leftFilters = createFilterBank();
    rightFilters = createFilterBank();

    // Connect Source -> Splitter
    sourceNode.connect(splitter);

    // Route Left Channel (splitter output 0 -> left filters -> merger input 0)
    let leftChainEnd = connectFilterBank(splitter, leftFilters, 0);
    leftChainEnd.connect(merger, 0, 0);

    // Route Right Channel (splitter output 1 -> right filters -> merger input 1)
    let rightChainEnd = connectFilterBank(splitter, rightFilters, 1);
    rightChainEnd.connect(merger, 0, 1);

    // Connect to headphones/speakers output
    merger.connect(audioCtx.destination);

    updateFilterGains();
}

function createFilterBank() {
    return frequencies.map(freq => {
        let filter = audioCtx.createBiquadFilter();
        // Use peaking filters across bands to sculpt frequency attenuation
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.2; 
        filter.gain.value = 0;
        return filter;
    });
}

function connectFilterBank(splitter, filters, channelIndex) {
    splitter.connect(filters[0], channelIndex, 0);
    for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
    }
    return filters[filters.length - 1];
}

// Map dB HL threshold losses to negative Web Audio gain values
function updateFilterGains() {
    if (!audioCtx) return;

    frequencies.forEach((freq, index) => {
        // Left Ear Filter Update
        let leftLoss = state.left[freq];
        leftFilters[index].gain.value = -leftLoss;

        // Right Ear Filter Update
        let rightLoss = state.right[freq];
        rightFilters[index].gain.value = -rightLoss;
    });
}

// Handle Custom Audio File Uploading
function setupAudioUpload() {
    const uploadInput = document.getElementById('audioUpload');
    uploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const objectURL = URL.createObjectURL(file);
            audioElement.src = objectURL;
            audioElement.load();
        }
    });
}

// Preset Configurations
function applyPreset(leftProfile, rightProfile) {
    frequencies.forEach(freq => {
        state.left[freq] = leftProfile[freq] || 0;
        state.right[freq] = rightProfile[freq] || 0;

        document.getElementById(`left-${freq}`).value = state.left[freq];
        document.getElementById(`left-${freq}-val`).innerText = state.left[freq];

        document.getElementById(`right-${freq}`).value = state.right[freq];
        document.getElementById(`right-${freq}-val`).innerText = state.right[freq];
    });
    updateFilterGains();
}

function setupPresetListeners() {
    document.getElementById('btnNormal').addEventListener('click', () => {
        applyPreset(
            {250:0, 500:0, 1000:0, 2000:0, 4000:0, 8000:0},
            {250:0, 500:0, 1000:0, 2000:0, 4000:0, 8000:0}
        );
    });

    document.getElementById('btnPresbycusis').addEventListener('click', () => {
        // High-frequency sloping loss typical with age
        applyPreset(
            {250:5, 500:10, 1000:20, 2000:40, 4000:65, 8000:80},
            {250:5, 500:10, 1000:20, 2000:40, 4000:65, 8000:80}
        );
    });

    document.getElementById('btnNoiseNotch').addEventListener('click', () => {
        // Classic 4kHz noise-induced dip
        applyPreset(
            {250:10, 500:10, 1000:15, 2000:30, 4000:75, 8000:45},
            {250:10, 500:10, 1000:15, 2000:30, 4000:75, 8000:45}
        );
    });

    document.getElementById('btnSSDRight').addEventListener('click', () => {
        // Normal left ear, profound right single-sided deafness
        applyPreset(
            {250:0, 500:0, 1000:0, 2000:0, 4000:0, 8000:0},
            {250:90, 500:90, 1000:90, 2000:90, 4000:90, 8000:90}
        );
    });
}
