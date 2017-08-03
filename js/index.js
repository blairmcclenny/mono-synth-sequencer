const keys = ['A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab'];
const A3 = 220;

const modes = {
  names: ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'],
  modes: [],
  ionian: [2, 2, 1, 2, 2, 2, 1]
};

const settings = {
  bpm: { bpm: 120, min: 40, max: 260, division: 30000 },
  key: keys.indexOf('C'),
  mode: modes.names.indexOf('Ionian'),
  wave: 'square',
  sustain: false,
  glide: false,
  filter: { cutoff: 10000, q: 2, min: 20, max: 16000 },
  delay: { amount: 0, min: 0, max: 75}
};

const sequencer = {
  isRunning: false,
  timer: 0,
  step: 0,
  patterns: [
    { active: true, pattern: [] },
    { active: true, pattern: [] },
    { active: true, pattern: [] },
    { active: true, pattern: [] }
  ],
  currentPatternIndex: 0,
  currentStepIndex: 0,
  sequence: []
};

const synth = {
  on: {},
  off: {},
  pitch: {},
  detune: {},
  wave: {},
  filter: {},
  delay: {}
};

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const oscillator = audioContext.createOscillator();
const gain = audioContext.createGain();

const amp = audioContext.createGain();
const ampFilter = audioContext.createBiquadFilter();
const shaper = audioContext.createWaveShaper();

const filter = audioContext.createBiquadFilter();

const delayInput = audioContext.createGain();
const delayFeedback = audioContext.createGain();
const delay = audioContext.createDelay();
const output = audioContext.createGain();


////////////////////////////////////////////////////////////////////////////////////
// SYNTH
////////////////////////////////////////////////////////////////////////////////////


synth.on = () => {
  gain.gain.setTargetAtTime(1, audioContext.currentTime, .0025);
}

synth.off = () => {
  gain.gain.setTargetAtTime(0, audioContext.currentTime + (getTempo() * .65 / 1000), .006);
}

synth.pitch = (frequency) => {
  oscillator.frequency.setTargetAtTime(frequency, audioContext.currentTime, !settings.glide ? 0 : .02);
}

synth.detune = () => {
  oscillator.detune.setValueAtTime(settings.key * 100, audioContext.currentTime);
}

synth.wave = () => {
  oscillator.type = settings.wave;
}

synth.filter = () => {
  filter.frequency.setValueAtTime(settings.filter.cutoff, audioContext.currentTime);
}

synth.delay = () => {
  delayFeedback.gain.value = settings.delay.amount;
  delay.delayTime.value = getTempo() / 1000;
}


////////////////////////////////////////////////////////////////////////////////////
// SEQUENCER
////////////////////////////////////////////////////////////////////////////////////


const makeSequence = () => {
  return (
    sequencer.patterns.filter(pattern => pattern.active)
      .reduce((arr, pattern) => arr.concat(pattern.pattern), [])
      .reduce((arr, pattern) => arr.concat(pattern), [])
  );
}

const getTempo = () => Math.round(settings.bpm.division / settings.bpm.bpm);

function step() {
  if (sequencer.isRunning) {
    const stepNext = sequencer.sequence[sequencer.step];

    if (stepNext >= 0) {
      synth.pitch(modes.modes[settings.mode][stepNext]);
      synth.on();
    }

    if (!settings.sustain || stepNext < 0) synth.off();

    sequencer.timer = setTimeout(step, getTempo());

    sequencer.step < sequencer.sequence.length - 1 ? sequencer.step++ : sequencer.step = 0;
  }
}

function stop() {
  synth.off();

  sequencer.isRunning = false;
  sequencer.step = 0;

  ui.sequencerInputDisabled(false);
}

function run() {
  ui.sequencerInputDisabled(true);

  sequencer.isRunning = true;
  sequencer.sequence = makeSequence();

  step();
}


////////////////////////////////////////////////////////////////////////////////////
// UI
////////////////////////////////////////////////////////////////////////////////////


const element = (id) => document.getElementById(id);
const elements = (c) => document.querySelectorAll(c);

const ui = {
  bpm: { display: element('bpm'), down: element('btn-bpm-down'), up: element('btn-bpm-up') },
  key: { display: element('key'), down: element('btn-key-down'), up: element('btn-key-up') },
  mode: { display: element('mode'), down: element('btn-mode-down'), up: element('btn-mode-up') },
  waves: elements('.wave'),
  sustain: element('toggle-sustain'),
  glide: element('toggle-glide'),
  filter: element('filter'),
  delay: element('delay'),
  // patterns: { patterns: elements('.pattern'), toggles: elements('.toggle-pattern') },
  patterns: { patterns: elements('.pattern') },
  steps: elements('.step'),
  run: element('btn-run'),
  clear: element('btn-clear'),
  // randomize: element('btn-randomize'),
  keyboard: elements('.key'),
  sequencerInputDisabled: {},
  setSteps: {}
}

// SETTINGS

ui.bpm.down.addEventListener('mousedown', () => {
  if (settings.bpm.bpm > settings.bpm.min) settings.bpm.bpm--;
  ui.bpm.display.value = settings.bpm.bpm;

  synth.delay();
});

ui.bpm.up.addEventListener('mousedown', () => {
  if (settings.bpm.bpm < settings.bpm.max) settings.bpm.bpm++;
  ui.bpm.display.value = settings.bpm.bpm;

  synth.delay();
});

ui.key.down.addEventListener('mousedown', () => {
  settings.key > 0 ? settings.key-- : settings.key = keys.length - 1;
  ui.key.display.value = keys[settings.key];
  synth.detune();
});

ui.key.up.addEventListener('mousedown', () => {
  settings.key < keys.length - 1 ? settings.key++ : settings.key = 0;
  ui.key.display.value = keys[settings.key];
  synth.detune();
});

ui.mode.down.addEventListener('mousedown', () => {
  settings.mode > 0 ? settings.mode-- : settings.mode = modes.names.length - 1;
  ui.mode.display.value = modes.names[settings.mode];
});

ui.mode.up.addEventListener('mousedown', () => {
  settings.mode < modes.modes.length - 1 ? settings.mode++ : settings.mode = 0;
  ui.mode.display.value = modes.names[settings.mode];
});

ui.waves.forEach((wave) => {
  wave.addEventListener('click', () => {
    settings.wave = wave.value;
    synth.wave();
  });
});

ui.sustain.addEventListener('click', (e) => settings.sustain = e.target.checked);
ui.glide.addEventListener('click', (e) => settings.glide = e.target.checked);

ui.filter.min = settings.filter.min;
ui.filter.max = settings.filter.max;
ui.filter.value = settings.filter.cutoff;
ui.filter.addEventListener('input', () => {
  settings.filter.cutoff = ui.filter.value;
  synth.filter();
});

ui.delay.min = settings.delay.min;
ui.delay.max = settings.delay.max;
ui.delay.value = settings.delay.amount;
ui.delay.addEventListener('input', () => {
  settings.delay.amount = ui.delay.value * .01;
  synth.delay();
});

// SEQUENCER

ui.run.addEventListener('click', () => {
  if (!sequencer.isRunning) {
    run();
    ui.run.querySelector('i').textContent = 'stop';
  } else {
    stop();
    ui.run.querySelector('i').textContent = 'play_arrow';
  }
});

ui.patterns.patterns.forEach((pattern, i) => {
  pattern.addEventListener('click', () => {
    sequencer.currentPatternIndex = i;
    // sequencer.currentStepIndex = 0;
    sequencer.currentStepIndex = sequencer.patterns[i].pattern.length;

    ui.patterns.patterns.forEach((pattern, i) => sequencer.currentPatternIndex === i ? pattern.classList.add('active') : pattern.classList.remove('active'));

    ui.setSteps();
  });
});

// ui.patterns.toggles.forEach((toggle, i) => {
//   toggle.addEventListener('click', () => {
//     sequencer.patterns[i].active = toggle.checked;
//   });
// });

ui.clear.addEventListener('click', () => {
  sequencer.patterns[sequencer.currentPatternIndex].pattern = [];
  sequencer.currentStepIndex = 0;

  ui.setSteps();
});

// ui.randomize.addEventListener('click', () => {
//   // make random pattern
//   // sequencer.currentStepIndex = 0;
//
//   ui.setSteps();
// });

ui.keyboard.forEach((key, i) => {
  key.addEventListener('mousedown', (e) => {
    const id = i - 1;

    if (sequencer.currentStepIndex < ui.steps.length) {
      sequencer.patterns[sequencer.currentPatternIndex].pattern.push(id);
      sequencer.currentStepIndex++;

      ui.setSteps();
    }

    if (id !== -1) {
      synth.pitch(modes.modes[settings.mode][id]);
      synth.on();
    }
  });

  key.addEventListener('mouseup', (e) => {
    synth.off();
  });
});

ui.setSteps = () => {
  ui.steps.forEach((step, i) => {
    sequencer.patterns[sequencer.currentPatternIndex].pattern.length > i ? step.classList.add('set') : step.classList.remove('set');
    sequencer.currentStepIndex === i ? step.classList.add('current') : step.classList.remove('current');
  });
}

ui.sequencerInputDisabled = (state) => {
  ui.steps.forEach((step) => {
    // step.disabled = state;
    step.classList.toggle('faded');
  });

  // ui.patterns.toggles.forEach((toggle) => {
  //   toggle.disabled = state;
  //   toggle.classList.toggle('faded');
  // });

  ui.patterns.patterns.forEach((pattern) => {
    pattern.disabled = state;
    pattern.classList.toggle('faded');
  });

  ui.clear.disabled = state;
  ui.clear.classList.toggle('faded');

  // ui.randomize.disabled = state;

  ui.keyboard.forEach((key) => {
    key.disabled = state;
    key.classList.toggle('faded');
  });
};


////////////////////////////////////////////////////////////////////////////////////
// INIT
////////////////////////////////////////////////////////////////////////////////////


const generateModes = () => {
  modes.names.forEach((name, i) => {
    const base = modes.ionian;
    const intervals = i !== 0 ? base.slice(i, base.length).concat(base.slice(0, i)) : base;

    const frequency = (i) => A3 * Math.pow(2, i / 12);
    const interval = (arr, i) => arr.slice(0, i + 1).reduce((acc, cur) => acc + cur);

    const mode = intervals.map((cur, i, arr) => frequency(interval(arr, i)))

    modes.modes.push([A3].concat(mode));
  })
};

function init() {
  generateModes();

  // UI

  ui.bpm.display.value = settings.bpm.bpm;
  ui.key.display.value = keys[settings.key];
  ui.mode.display.value = modes.names[settings.mode];

  ui.sustain.checked = settings.sustain;
  ui.glide.checked = settings.glide;

  // sequencer.patterns.forEach((pattern, i) => {
  //   ui.patterns.toggles[i].checked = pattern.active;
  // });

  ui.patterns.patterns[0].classList.add('active');

  ui.setSteps();

  // AUDIO

  oscillator.connect(gain);
  oscillator.detune.value = settings.key * 100;
  oscillator.type = settings.wave;
  gain.gain.value = 0;
  oscillator.start();

  filter.type = 'lowpass';
  filter.Q.value = settings.filter.q;
  filter.frequency.value = settings.filter.cutoff;

  amp.gain.value = 2;

  shaper.curve = generateCurve(22050);
  shaper.oversample = '4x';

  function generateCurve(steps){
    const curve = new Float32Array(steps);
    const deg = Math.PI / 180;

    for (let i = 0; i < steps; i++) {
      const x = i * 2 / steps - 1;
      curve[i] = (3 + 10) * x * 20 * deg / (Math.PI + 10 * Math.abs(x));
    }

    return curve;
  }

  delay.delayTime.value = getTempo() / 1000;
  delayFeedback.gain.value = settings.delay.amount;

  ampFilter.type = 'lowpass';
  ampFilter.frequency.value = 6000;

  gain.connect(amp);
  amp.connect(ampFilter);
  ampFilter.connect(shaper);
  shaper.connect(filter);
  filter.connect(delayInput);
  delayInput.connect(output);
  delayInput.connect(delay);
  delay.connect(delayFeedback);
  delayFeedback.connect(delay);
  delayFeedback.connect(output);
  output.connect(audioContext.destination);
}

init();
