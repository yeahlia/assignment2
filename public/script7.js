let rootBranches = []; // stores the 10 original branches

// SETUP ----------------------------------------------------------------------------------------------------

// initializes canvas
function setup() {
  createCanvas(windowWidth, windowHeight); // makes the canvas fit the browser window
  stroke("white"); // sets stroke color to white
  strokeWeight(2); // base stroke weight

  let centreX = width / 2; // centre horizontal
  let centreY = height / 2; // centre vertical

  // loop to make 10 starting branches
  for (let i = 0; i < 10; i++) {
    let startAngle = random(TWO_PI); // TWEAK picks a random angle
    startAngle += sin(i) * 0.2; // TWEAK3 adds slight nudge to spread outward
    let startLength = random(100, 200); // TWEAK3 makes the root branches longer

    let swayAmount = random(0.01, 0.05); // TWEAK2 how far the branches sways
    let swayRate = random(0.01, 0.03); // TWEAK2 how fast the branches sways

    // creates a new branch and adds it to rootBranches array
    rootBranches.push(
      // creates new branch:
      new Branch(
        { x: centreX, y: centreY }, // starts from centre
        startAngle, // angle
        startLength, // length
        8, // generation
        null, // parent (but null because it is the base branch)
        swayAmount, // how far it sways
        swayRate // how fast it sways
      )
    );
  }
}

// DRAW -----------------------------------------------------------------------------------------------------

// runs every frame
function draw() {
  background(0); // draws background and refreshes frames

  let activeBranch = 0; // tracks how many branches are moving

  // loops through all root branches
  for (let b of rootBranches) {
    b.update(); // update growth or glitch
    b.show(); // draw the branch
    activeBranch += b.countMoving(); // counts active branches
  }

  let idleLastBranch = []; // array for last generation branches that aren't moving
  // loops through each root branch
  for (let b of rootBranches) {
    b.collectIdleLastBranch(idleLastBranch); // search the deepest branches and checks if they are not moving, and adds to array
  }

  // TWEAK - if fewer than 30 branches:
  if (activeBranch < 30) {
    shuffle(idleLastBranch, true); // randomly shuffles through the array
    // TWEAK activates up to 200 idle branches
    for (let i = 0; i < min(200, idleLastBranch.length); i++) {
      idleLastBranch[i].regrow(); // reactivates by growing or glitching
    }
  }
}

// BRANCH CLASS ---------------------------------------------------------------------------------------------

class Branch {
  // constructor for making a new branch
  constructor(
    start,
    angle,
    targetLength,
    generation,
    parent,
    swayAmount,
    swayRate
  ) {
    this.start = { x: start.x, y: start.y }; // sets the start position of the branch
    this.end = { x: start.x, y: start.y }; // end starts at same point, will grow over time
    this.angle = angle; // direction
    this.targetLength = targetLength; // max length this branch will grow to
    this.generation = generation; // generation number

    this.len = 0; // how much it has currently grown
    this.speed = random(0.3, 0.7); // TWEAK how fast it grows
    this.shrinkSpeed = random(0.5, 1.2); // TWEAK how fast it shrinks if glitching

    this.finished = false; // true when branch stops growing or glitching
    this.childrenBranch = false; // tracks if children have been created already
    this.branches = []; // array to store child branches

    this.glitching = false; // true when branch is shrinking

    this.swayAmount = swayAmount * random(0.9, 1.1); // TWEAK2 sway amount with randomness
    this.swayRate = swayRate * random(0.9, 1.1); // TWEAK2 sway rate with randomness

    // NEW PHYSICS VARIABLES ----------------------------------------------------------------------------------
    this.velX = 0; // TWEAK4 velocity x
    this.velY = 0; // TWEAK4 velocity y
    this.accX = 0; // TWEAK4 acceleration x
    this.accY = 0; // TWEAK4 acceleration y
  }

  // update logic
  update() {
    if (this.targetLength < 15) {
      this.finished = true; // mark as done
      return;
    }

    if (this.glitching) {
      this.len -= this.shrinkSpeed; // shrink backwards towards start point

      if (this.len <= 0) {
        this.len = 0; // prevents going to negatives
        this.finished = false; // starts growing again
        this.glitching = false; // stop glitching
        this.childrenBranch = false; // allow new children later

        this.angle += random(-PI / 4, PI / 4); // TWEAK angle
        this.speed = random(0.3, 0.7); // TWEAK growth speed
        this.targetLength = random(40, 80); // TWEAK random length

        this.end = { x: this.start.x, y: this.start.y }; // resets end position
      } else {
        this.physicsUpdate();
      }
    } else {
      if (!this.finished && this.len < this.targetLength) {
        this.len += this.speed; // increase length each frame
      }
      this.physicsUpdate();

      if (!this.finished && this.len >= this.targetLength) {
        this.finished = true; // mark done
      }

      if (this.finished && !this.childrenBranch) {
        if (this.generation > 0) {
          this.makeBranch(); // makes children
        } else {
          if (random() < 0.5) {
            this.startGlitch(); // TWEAK 50% chance to glitch
          }
        }
        this.childrenBranch = true; // prevent repeating
      }
    }

    for (let i = this.branches.length - 1; i >= 0; i--) {
      let child = this.branches[i];
      child.start = { x: this.end.x, y: this.end.y }; // TWEAK3 connect child to parent
      child.update(); // recursive update
    }
  }

  // physics system update
  physicsUpdate() {
    let sway = sin(frameCount * this.swayRate) * this.swayAmount; // TWEAK2 sway angle
    let swayedAngle = this.angle + sway;

    let targetX = this.start.x + cos(swayedAngle) * this.len;
    let targetY = this.start.y + sin(swayedAngle) * this.len;

    // apply physics bias towards mouse
    let biasStrength = 0.0005; // TWEAK4 strength of pull to mouse
    this.accX += (mouseX - targetX) * biasStrength; // TWEAK4
    this.accY += (mouseY - targetY) * biasStrength; // TWEAK4

    // update velocity
    this.velX += this.accX;
    this.velY += this.accY;

    // apply friction
    let friction = 0.9; // TWEAK4 friction amount (1 = no friction)
    this.velX *= friction;
    this.velY *= friction;

    // reset acceleration
    this.accX = 0;
    this.accY = 0;

    // update final position
    this.end.x = targetX + this.velX;
    this.end.y = targetY + this.velY;
  }

  // add new child branches
  makeBranch() {
    const newChild = int(random(2, 3)); // TWEAK choose 2 or 3 children
    let created = false; // checks if successfully created

    for (let i = 0; i < newChild; i++) {
      const newAngle = this.angle + random(-PI / 4, PI / 4); // TWEAK angle spread
      const newGeneration = this.generation - 1;
      const spawnChance = map(this.generation, 1, 8, 0.2, 1.0); // TWEAK spawn chance

      if (random() < spawnChance) {
        const newLen = random(
          newGeneration * 10 + 20, // TWEAK3 longer children
          newGeneration * 30 + 40 // TWEAK3 longer maximum length
        );

        const child = new Branch(
          { x: this.end.x, y: this.end.y },
          newAngle,
          newLen,
          newGeneration,
          this,
          this.swayAmount,
          this.swayRate
        );
        this.branches.push(child);
        created = true;
      }
    }

    if (!created && random() < 0.5) {
      this.startGlitch(); // starts glitch
    }
  }

  // glitching function
  startGlitch() {
    this.glitching = true;
    this.finished = false;
  }

  // draw function
  show() {
    if (this.targetLength < 15) return; // doesn't draw too small branches

    stroke(255, map(this.generation, 0, 8, 100, 255)); // TWEAK more transparent by generation
    strokeWeight(map(this.generation, 0, 8, 1, 3)); // TWEAK smaller by generation

    line(this.start.x, this.start.y, this.end.x, this.end.y);

    for (let child of this.branches) {
      child.show();
    }
  }

  countMoving() {
    let count =
      this.glitching || (!this.finished && this.len < this.targetLength)
        ? 1
        : 0;
    for (let child of this.branches) {
      count += child.countMoving();
    }
    return count;
  }

  lastGen() {
    if (this.branches.length === 0) return this;
    return this.branches[this.branches.length - 1].lastGen();
  }

  collectIdleLastBranch(done) {
    if (this.branches.length === 0 && this.finished && !this.glitching) {
      done.push(this);
    }
    for (let b of this.branches) {
      b.collectIdleLastBranch(done);
    }
  }

  regrow() {
    if (this.finished && !this.glitching) {
      if (this.len === 0 && random() < 0.7) {
        this.finished = false;
        this.childrenBranch = false;
        this.targetLength = random(40, 80); // TWEAK new target length
        this.speed = random(0.3, 0.7); // TWEAK new speed
        this.angle += random(-PI / 4, PI / 4); // TWEAK new angle
        this.end = { x: this.start.x, y: this.start.y };
      } else if (this.len >= this.targetLength && random() < 0.5) {
        this.startGlitch();
      }
    }
  }
}
