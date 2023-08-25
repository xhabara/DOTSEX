class Dot {
  constructor(x, y, index) {
    this.x = x;
    this.y = y;
    this.r = 20;
    this.active = true;
    this.index = index;
  }

  display(x, y) {
    if (x === undefined) x = this.x;
    if (y === undefined) y = this.y;

    stroke(0);
    strokeWeight(2);

    let row = Math.floor(this.index / 4);
    let colors = [
      "#FFA500",
      "#E569E5",
      "#FFFF00",
      "#00FFFF",
      "#09DA09",
      "#FA558D",
      "#4CAF50",
    ];
    fill(this.active ? colors[row] : "#d3d3d3");
    ellipse(x, y, this.r);
    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(14);
    let note = ["1", "2", "3", "4", "5"][this.index % 5];
    text(note, x, y);
  }

  hovered(px, py) {
    return dist(px, py, this.x, this.y) < this.r;
  }

  clicked(px, py) {
    return dist(px, py, this.x, this.y) < this.r;
  }
}

let dots = [];
let sequenceDots = [];
let sound;
let playing = false;
let currentDot = 0;
let lastPlayedTime = 0;
let loopSpeed = 500;
let panningSliders = [];
let actionHistory = [];
let canvasSize = 800;
let repeatCount = 1;
let repeatSlider;
let lastPreviewedDot = null;
let hasClicked = false;
let reverb;
let filter;
let reverbActive = false;
let filterActive = false;
let reverbButton;
let pitchSliders = [];
let volumeSliders = [];
let delay;
let sound2, sound3, sound4;

function preload() {
  sound = loadSound("RullyShabaraSampleV02.mp3");
  sound2 = loadSound("RullyShabaraSampleR01.wav"); 
  sound3 = loadSound("RullyShabaraSampleR01.wav");
  sound4 = loadSound("RullyShabaraSampleC02.mp3");
  sounds = [sound, sound2, sound3, sound4];
}

function setup() {
  createCanvas(930, 600);
  // Create dots
  let x = 100,
    y = 50;
  for (let i = 0; i < 24; i++) {
    dots.push(new Dot(x, y, i));
    if (i % 4 === 3) {
      x = 100;
      y += 50;
    } else {
      x += 50;
    }
  }

  // panning sliders
  for (let i = 0; i < 6; i++) {
    let slider = createSlider(-1, 1, 0, 0.01);
    slider.position(320, 75 + i * 50);
    slider.size(100);
    panningSliders.push(slider);
  }

  // Play button
  let playButton = createButton("PLAY");
  playButton.mousePressed(togglePlay);
  playButton.position(700, 60);
  playButton.size(150, 30);

  // Break button
  let breakButton = createButton("ADD BREAK");
  breakButton.mousePressed(() => sequenceDots.push("break"));
  breakButton.position(700, 95);
  breakButton.size(150, 30);
  breakButton.style("background-color", "#2E6920");

  // Reset button
  let resetButton = createButton("RESET");
  resetButton.mousePressed(resetSequence);
  resetButton.position(700, 165);
  resetButton.size(150, 30);

  let undoButton = createButton("UNDO");
  undoButton.mousePressed(undoAction);
  undoButton.position(700, 200);
  undoButton.size(150, 30);
  undoButton.style("background-color", "#2E6920");

  // Speed slider
  let speedSlider = createSlider(100, 2000, 500);
  speedSlider.position(100, 400);
  speedSlider.size(150);
  speedSlider.input(() => (loopSpeed = speedSlider.value()));

  let randomPelogButton = createButton("RANDOM");
  randomPelogButton.mousePressed(randomPelog);
  randomPelogButton.position(700, 300);
  randomPelogButton.size(150, 30);
  randomPelogButton.style("background-color", "#2E6920");

  delaySlider = createSlider(0, 1, 0.5, 0.01);
  delaySlider.position(495, 400);
  delaySlider.size(150);
  delaySlider.input(() => delayTime(delaySlider.value()));

  // Repeat slider
  repeatSlider = createSlider(1, 10, 1);
  repeatSlider.position(300, 400);
  repeatSlider.size(150);
  repeatSlider.input(() => (repeatCount = repeatSlider.value()));

  // Filter Frequency Slider
  let filterSlider = createSlider(10, 10000, 1, 1); 
  filterSlider.position(700, 400);
  filterSlider.size(150);
  filterSlider.input(() => adjustFilterFrequency(filterSlider.value()));

  reverb = new p5.Reverb();
  filter = new p5.LowPass();
filter.freq(500);
  sound.disconnect();
  sound.connect(filter);

  // Reverb button
  reverbButton = createButton("Activate Reverb");
  reverbButton.mousePressed(toggleReverb);
  reverbButton.position(700, 265);
  reverbButton.size(150, 30);

  for (let i = 0; i < 6; i++) {
    let slider = createSlider(0.5, 2, 1, 0.01);
    slider.position(430, 75 + i * 50);
    slider.size(100);
    pitchSliders.push(slider);
  }

  for (let i = 0; i < 6; i++) {
    let slider = createSlider(0, 1, 0.5, 0.01);
    slider.position(540, 75 + i * 50);
    slider.size(100);
    volumeSliders.push(slider);
  }
  delay = new p5.Delay();
  sounds.forEach((s) => {
  delay.process(s, 0.12, 0.7, 2300);
});

  delay.setType("simple");
  delay.drywet(0.6);
}

function adjustFilterFrequency(value) {
  filter.freq(value);
}

function delayTime(value) {
  let delayTime = map(value, 0, 1, 0, 1);
  delay.delayTime(delayTime);
  delay.feedback(0.5 + value * 0.5);
}

function randomPelog() {
  sequenceDots = [];
  let breakChance = 0.1;
  for (let i = 0; i < 19 * 4; i++) {
    if (random() < breakChance) {
      sequenceDots.push("break");
      continue;
    }
    let randomIndex = floor(random(0, 24));
    sequenceDots.push(
      new Dot(100 + (i % 19) * 30, 450 + Math.floor(i / 19) * 30, randomIndex)
    );
  }
  actionHistory.push("random");
}

function draw() {
  background(255);

  for (let dot of dots) {
    dot.display();
  }

  for (let i = 0; i < sequenceDots.length; i++) {
    let x = 100 + (i % 19) * 30;
    let y = 450 + Math.floor(i / 19) * 30; // Calculate y position based on row
    if (sequenceDots[i] === "break") {
      fill(0, 0, 0);
      ellipse(x, y, 20);
    } else {
      sequenceDots[i].display(x, y);
    }
  }
  if (playing) {
    playDots();
  }

  //for (let dot of dots) {
  //if (dot.hovered(mouseX, mouseY) && dot !== lastPreviewedDot) {
  //sound.rate(0.85 + (dot.index % 5) * 0.093);
  //sound.play();
  //lastPreviewedDot = dot;
}

function mousePressed() {
  hasClicked = true;
  for (let dot of dots) {
    if (dot.clicked(mouseX, mouseY)) {
      sequenceDots.push(new Dot(dot.x, dot.y, dot.index));
      actionHistory.push("dot");
    }
  }
}

function addBreak() {
  sequenceDots.push("break");
  actionHistory.push("break");
}

function resetSequence() {
  sequenceDots = [];
  currentDot = 0;
  actionHistory.push("reset");
}

function undoAction() {
  let lastAction = actionHistory.pop();
  if (lastAction === "dot") {
    sequenceDots.pop();
  } else if (lastAction === "break") {
    sequenceDots.pop();
  } else if (lastAction === "random") {
    sequenceDots = [];
  }
}

function addSequence() {
  sequenceDots = [];
  for (let dot of dots) {
    if (dot.active) {
      sequenceDots.push(dot);
    }
  }
}

function resetSequence() {
  sequenceDots = [];
  currentDot = 0;
}

function togglePlay() {
  playing = !playing;
  currentDot = 0;
}

function playDots() {
  let currentTime = millis();
  if (currentTime - lastPlayedTime > loopSpeed) {
    if (currentDot < sequenceDots.length * repeatCount) {
      let dot = sequenceDots[currentDot % sequenceDots.length];
      if (dot !== "break" && dot.active) {
        let row = Math.floor(dot.index / 4);
        let selectedSound = sounds[row % sounds.length]; 
        selectedSound.pan(panningSliders[row].value());
        let pitchValue = 0.85 + (dot.index % 5) * 0.093;
        selectedSound.rate(pitchValue * pitchSliders[row].value());
        selectedSound.setVolume(volumeSliders[row].value());
        selectedSound.play();
      }
    }
    currentDot++;
    if (currentDot >= sequenceDots.length * repeatCount) {
      currentDot = 0;
    }
    lastPlayedTime = currentTime;
  }
}


function toggleReverb() {
  reverbActive = !reverbActive;
if (reverbActive) {
  sounds.forEach((s) => {
    reverb.process(s, 3, 2);
  });
  reverbButton.html("Reverb Off");
} else {
  reverb.disconnect();
  reverbButton.html("Activate Reverb");
}

}
