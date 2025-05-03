let colonies = []; // array for each colony
let maxColonies = 5; // how many colonies stay on screen
const colorPalette = ["#e7bc91", "#bc8a5f", "#8b5e34", "#6f4518", "#583101"]; // color palette
let audioContext; // stores the audio context for sosund stuff
let color1 = "#ffedd8"; // color 1 for background
let color2 = "#fcf5ca"; // color 2 for background

// SETUP ----------------------------------------------------------------------------------------------------

// initializes canvas
function setup() {
  createCanvas(windowWidth, windowHeight); // canvas to fit the window size
  strokeWeight(2); // stroke weight for lines

  // create AudioContext
  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  spawnColony(width / 2, height / 2); // spawns colony right in the middle
}

// DRAW -----------------------------------------------------------------------------------------------------

// runs every frame
function draw() {
  // checks every 220 frames
  if (frameCount % 220 === 0) {
    let temp = color1; // temporarily stores the first color
    color1 = color2; // sets first color to second color
    color2 = temp; // sets the second color back to temporary first color
  }

  // maps frame count, then blends the 2 colors for a smooth transition
  let lerpPos = map(frameCount % 220, 0, 100, 0, 1);
  let backgroundColor = lerpColor(color(color1), color(color2), lerpPos);

  background(backgroundColor); // sets the background

  // draw branches
  // loops through each colony
  for (let colony of colonies) {
    // loops through each branch of that colony
    for (let branch of colony.branches) {
      branch.update(); // update logic
      branch.show(colony.color, colony.alpha); // draws branch using that color
    }
  }

  // colony limit
  // if too many colonies on screen
  if (colonies.length > maxColonies) {
    colonies[0].alpha -= 1; // fades out the oldest colony slowly
    // when fully faded and cant see anymore
    if (colonies[0].alpha <= 0) {
      let c = colonies.shift(); // remove from array

      // fades out the sound smoothly
      c.volume.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 1
      );
      c.oscillator.stop(audioContext.currentTime + 1); // stops the oscillator after 1 second
      c.lfo.stop(audioContext.currentTime + 1); // stops LFO after 1 second
    }
  }

  // loops through all colonies
  for (let colony of colonies) {
    let bendAmount = map(mouseX, 0, width, -100, 100); //maps mouse to pitch bend range + or - 100Hz
    colony.oscillator.frequency.setValueAtTime(
      colony.baseFreq + bendAmount, // base frequency and bend
      audioContext.currentTime
    );
  }
}

// MOUSE CLICK ----------------------------------------------------------------------------------------------

// runs when mouse is clicked
function mousePressed() {
  // if audio is not playing
  if (audioContext.state !== "running") {
    audioContext.resume(); // resume audio
  }
  spawnColony(mouseX, mouseY); // spawns new colony at mouse location
}

// SPAWN COLONY ------------------------------------------------------------------------------------

// function to spawn a new colony
function spawnColony(x, y) {
  let waveform = ["sine", "square", "sawtooth"]; // defines the different waveform
  let waveformType = random(waveform); // chooses random

  let oscillator = audioContext.createOscillator(); // makes sound generator
  let volume = audioContext.createGain(); // volume controller
  let lfo = audioContext.createOscillator(); // LFO for vibrato
  let lfoGain = audioContext.createGain(); // LFO affecting pitch

  oscillator.type = waveformType; // sets up waveform shape
  oscillator.frequency.setValueAtTime(
    random(200, 800), // picks random base freq
    audioContext.currentTime // sets now
  );

  volume.gain.setValueAtTime(0.05, audioContext.currentTime); // low volume

  lfo.frequency.setValueAtTime(random(5, 12), audioContext.currentTime); // cibrato between 5 and 12 Hz
  lfoGain.gain.setValueAtTime(20, audioContext.currentTime); // how fast it wiggles

  lfo.connect(lfoGain); // connects LFO output to gain
  lfoGain.connect(oscillator.frequency); //connects LFO to change pitch

  oscillator.connect(volume); // oscillator to volume
  volume.connect(audioContext.destination); // volume to speakers

  oscillator.start(); // starts oscillator
  lfo.start(); // start LFO

  // create colony
  let colony = {
    branches: [], // holds its branches
    color: random(colorPalette), // chooses random color from palette
    alpha: 255, // opacity
    oscillator: oscillator, // stores oscillator
    volume: volume, // stores volume
    lfo: lfo, // stores lfo
    lfoGain: lfoGain, // stores lfo volume
    baseFreq: oscillator.frequency.value, // base frequency for pitch shifting
  };

  // loops through 10 starting branches
  for (let i = 0; i < 10; i++) {
    let startAngle = random(TWO_PI); // random starting angle
    startAngle += sin(i) * 0.2; // wave variation
    let startLength = random(100, 200); // random starting length
    let swayAmount = random(0.01, 0.05); // random sway amount
    let swayRate = random(0.01, 0.03); // random sway seed

    // new branch
    let b = new Branch(
      { x: x, y: y }, // where branch starts
      startAngle, // angle
      startLength, // length
      8, // generation
      null, // parent
      swayAmount, // sway amount
      swayRate, // sway speed
      colony // pass colony
    );
    colony.branches.push(b); // add branch to colony
  }

  colonies.push(colony); // add colony ro colonies array
}

// BRANCH CLASS ---------------------------------------------------------------------------------------------

class Branch {
  constructor(
    start, // start position
    angle, // angle
    targetLength, // tartget length
    generation, // geneartion amount
    parent, // parent branch
    swayAmount, // sway amount
    swayRate, // swayrate
    colony // reference colony
  ) {
    this.start = { x: start.x, y: start.y }; // sets the start position of the branch
    this.end = { x: start.x, y: start.y }; // end starts at same point, will grow over time
    this.angle = angle; // direction
    this.targetLength = targetLength; // max length this branch will grow to
    this.generation = generation; // generation number

    this.parent = parent; // stsore parents
    this.colony = colony; // store colony

    this.len = 0; // how much it has currently grown
    this.speed = random(0.1, 1.5); // TWEAK1 how fast it grows
    this.shrinkSpeed = random(0.5, 1.2); // TWEAK1 how fast it shrinks if glitching

    this.finished = false; // true when branch stops growing or glitching
    this.childrenBranch = false; // tracks if children have been created already
    this.branches = []; // array to store child branches

    this.glitching = false; // true when branch is shrinking

    this.swayAmount = swayAmount * random(0.9, 1.1); // TWEAK2 sway amount with randomness
    this.swayRate = swayRate * random(0.9, 1.1); // TWEAK2 sway rate with randomness

    // physics variables
    this.velX = 0; // TWEAK4 x velocity for soft movement
    this.velY = 0; // TWEAK4 y velocity for soft movement
    this.accX = 0; // TWEAK4 x acceleration based on mouse bias
    this.accY = 0; // TWEAK4 y acceleration based on mouse bias
  }

  // update logic
  update() {
    // if larget length istoo short
    if (this.targetLength < 15) {
      this.finished = true; // mark as done
      return;
    }

    // if it is glitching
    if (this.glitching) {
      this.len -= this.shrinkSpeed; // shrink backwards towards start point
      // if done shrinking
      if (this.len <= 0) {
        this.len = 0; // prevents going to negatives
        this.finished = false; // starts growing again
        this.glitching = false; // stop glitching
        this.childrenBranch = false; // allow new children later

        this.angle += random(-PI / 4, PI / 4); // TWEAK1 random new angle
        this.speed = random(0.3, 0.7); // TWEAK1 new speed
        this.targetLength = random(40, 70); // TWEAK1 new target length
        this.end = { x: this.start.x, y: this.start.y }; // reset end position
      } else {
        this.physicsUpdate(); // update physics when glitching
      }
    } else {
      if (!this.finished && this.len < this.targetLength) {
        this.len += this.speed; // continue growing
      }

      this.physicsUpdate(); // update physics while growing

      // if reached target length
      if (!this.finished && this.len >= this.targetLength) {
        this.finished = true; // mark as finished growing
      }

      // if finished and no children
      if (this.finished && !this.childrenBranch) {
        if (this.generation > 0) {
          this.makeBranch(); // make children if not last generation
        } else {
          if (random() < 0.5) {
            this.startGlitch(); // 50 % chance to start glitching
          }
        }
        this.childrenBranch = true; // prevent double creating
      }
    }

    // updates children
    for (let child of this.branches) {
      child.start = { x: this.end.x, y: this.end.y }; // connects child to parent's end
      child.update(); // recursive update!!! yay
    }
  }

  // physics (i hate math)
  physicsUpdate() {
    let sway = sin(frameCount * this.swayRate) * this.swayAmount; // TWEAK2 sway angle
    let swayedAngle = this.angle + sway; // calculates swayed angle

    let targetX = this.start.x + cos(swayedAngle) * this.len; // base target x without bias
    let targetY = this.start.y + sin(swayedAngle) * this.len; // base target y without bias

    // bias forces toward mouse
    let biasStrength = 0.001; // TWEAK4 bias pull
    let noiseStrength = 0.5; // TWEAK5 random noise

    // add mouse bias and noise
    let offsetX = mouseX - targetX + random(-noiseStrength, noiseStrength);
    let offsetY = mouseY - targetY + random(-noiseStrength, noiseStrength);

    // updates acceleration
    this.accX += offsetX * biasStrength;
    this.accY += offsetY * biasStrength;

    // updates velocity
    this.velX += this.accX;
    this.velY += this.accY;

    // apply friction
    let friction = 0.9; // TWEAK4 friction
    this.velX *= friction;
    this.velY *= friction;

    // reset acceleration
    this.accX = 0;
    this.accY = 0;

    // updates final position
    this.end.x = targetX + this.velX;
    this.end.y = targetY + this.velY;
  }

  // make child branches
  makeBranch() {
    const newChild = int(random(2, 3)); // TWEAK choose 2 or 3 children
    let created = false; // whether child was made

    for (let i = 0; i < newChild; i++) {
      const newAngle = this.angle + random(-PI / 4, PI / 4); // TWEAK angle spread
      const newGeneration = this.generation - 1; // next generation
      const spawnChance = map(this.generation, 1, 8, 0.2, 1.0); // TWEAK spawn chance

      // if allowed to spawn
      if (random() < spawnChance) {
        const newLen = random(newGeneration * 10 + 20, newGeneration * 30 + 40); // TWEAK child length
        // makes a new child with branch class!!!!
        const child = new Branch(
          { x: this.end.x, y: this.end.y },
          newAngle,
          newLen,
          newGeneration,
          this,
          this.swayAmount,
          this.swayRate,
          this.colony
        );
        this.branches.push(child); // adds child
        created = true; // marks created
      }
    }

    if (!created && random() < 0.5) {
      this.startGlitch(); // chance to glitch instead
    }
  }

  startGlitch() {
    this.glitching = true; // marks glitching
    this.finished = false; // marks not finished

    // if linked to a colony
    if (this.colony) {
      this.colony.lfo.frequency.setValueAtTime(
        random(20, 50), // fast vibrato for glitch
        audioContext.currentTime
      );
      setTimeout(() => {
        // reset
        this.colony.lfo.frequency.setValueAtTime(
          random(5, 12), // back to softer vibrato
          audioContext.currentTime
        );
      }, 300);
    }
  }

  // draw branch
  show(colonyColor, colonyAlpha) {
    if (this.targetLength < 15) return; // skip tiny branches

    let c = color(colonyColor); // colony color
    c.setAlpha(map(this.generation, 0, 8, 100, colonyAlpha)); // fade by generation
    stroke(c); // set stroke color and alpha
    strokeWeight(map(this.generation, 0, 8, 1, 4)); // TWEAK stroke weight
    line(this.start.x, this.start.y, this.end.x, this.end.y); // draw line

    for (let child of this.branches) {
      child.show(colonyColor, colonyAlpha); // recursively show children
    }
  }
}
