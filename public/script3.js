// uses classes, and added glitching

let rootBranches = []; // stores the 10 original branches

// SETUP ----------------------------------------------------------------------------------------------------

function setup() {
  createCanvas(windowWidth, windowHeight); // makes the canvas fit the browser window
  stroke("white"); // sets stroke color to white
  strokeWeight(2); // base stroke weight

  let centreX = width / 2; // centre horizontal
  let centreY = height / 2; // centre vertical

  // loop to make 10 starting branches
  for (let i = 0; i < 10; i++) {
    let startAngle = random(TWO_PI); // picks a random angle
    let startLength = random(40, 80); // picks a random length
    // creates a new branch and adds it to rootBranches array
    rootBranches.push(
      // creates new branch starting from centre, random angle and length and the generation
      new Branch({ x: centreX, y: centreY }, startAngle, startLength, 8, null)
    );
  }
}

// DRAW -----------------------------------------------------------------------------------------------------

function draw() {
  background(0); // draws background and refreshes frames

  // loop through all root branches and update and draw them
  for (let b of rootBranches) {
    b.update(); // update growth or glitch
    b.show(); // draw the branch
  }
}

// BRANCH CLASS ---------------------------------------------------------------------------------------------

class Branch {
  // constructor for making a new branch
  constructor(start, angle, targetLen, generation, parent) {
    this.start = { x: start.x, y: start.y }; // sets the start position of the branch
    this.end = { x: start.x, y: start.y }; // end starts at same point, will grow over time
    this.angle = angle; // direction
    this.targetLen = targetLen; // max length this branch will grow to
    this.generation = generation; // generation number

    this.len = 0; // how much it has currently grown
    this.speed = random(0.3, 0.7); // how fast it grows
    this.shrinkSpeed = random(0.5, 1.2); // how fast it shrinks if glitching

    this.finished = false; // true when branch stops growing or glitching
    this.childrenBranch = false; // tracks if children have been created already
    this.branches = []; // array to store child branches

    this.glitching = false; // true when branch is shrinking
  }

  // update logic
  update() {
    // if length is too short
    if (this.targetLen < 15) {
      this.finished = true; // mark as done
      return; //exot
    }

    // glitching logic
    if (this.glitching) {
      this.len -= this.shrinkSpeed; // shrink backwards towards start point

      // if fully shrunk
      if (this.len <= 0) {
        this.len = 0;
        this.finished = true; // marks done
        this.end = { x: this.start.x, y: this.start.y }; // move end to start
      } else {
        // update the end point
        this.end.x = this.start.x + cos(this.angle) * this.len;
        this.end.y = this.start.y + sin(this.angle) * this.len;
      }
    }

    // growing logic
    else if (!this.finished) {
      // if growing
      if (this.len < this.targetLen) {
        // if not done growing
        this.len += this.speed; // keeps growing

        // update the end point as it grows
        this.end.x = this.start.x + cos(this.angle) * this.len;
        this.end.y = this.start.y + sin(this.angle) * this.len;
      } else {
        this.finished = true; // finished growing
      }

      // if finished growing, spawn children or glitch
      if (this.finished && !this.childrenBranch) {
        // if not the last generation:
        if (this.generation > 0) {
          this.makeBranch(); // makes branch
        } else {
          // 50% chance to glitch if last generation
          if (random() < 0.5) {
            this.startGlitch(); // glitc instead of grow
          }
        }

        this.childrenBranch = true; // prevents repeating
      }
    }

    // loop through children branches
    for (let i = this.branches.length - 1; i >= 0; i--) {
      let child = this.branches[i]; // gets each child branch

      // check if glitching child will hit 0 next
      if (child.glitching && child.len - child.shrinkSpeed <= 0) {
        this.branches.splice(i, 1); // remove from array
      } else {
        child.update(); // keeps updating if not
      }
    }
  }

  // add new child branches
  makeBranch() {
    const numChildren = int(random(2, 3)); // choose 2 or 3 children
    let created = false; // tracks if at least one child was made

    // loop for each child
    for (let i = 0; i < numChildren; i++) {
      const newAngle = this.angle + random(-PI / 4, PI / 4); // random angle
      const newGeneration = this.generation - 1; // one generation lower
      const spawnChance = map(this.generation, 1, 8, 0.2, 1.0); // less chance to spawn as generation lowers

      // checks if generation is valid, and a random chance on creation
      if (newGeneration > 0 && random() < spawnChance) {
        //creates a random length based on min and max
        const newLen = random(
          max(10, newGeneration * 5 + 10), // makes sure it isn't too short
          newGeneration * 20 + 20 // max value
        );

        // creates new branch (yay recursion!)
        const child = new Branch(
          { x: this.end.x, y: this.end.y }, // new branch starts where this one ends
          newAngle,
          newLen,
          newGeneration,
          this //makes this branch the parent of new branches
        );
        this.branches.push(child); // add to branch's children
        created = true; // mark we created something
      }
    }

    // if no children got made, possibility of glitch instead
    if (!created && random() < 0.5) {
      // 50% chance
      this.startGlitch();
    }
  }

  // starts glitching
  startGlitch() {
    this.glitching = true; //activates shrinking
    this.finished = false; // keeps it shrinking
  }

  // draw function for branch and its children
  show() {
    if (this.targetLen < 15) return; // skip if branch is too short

    stroke(255, map(this.generation, 0, 8, 100, 255)); // transparency lowers by generation
    strokeWeight(map(this.generation, 0, 8, 1, 3)); // stroke gets thinner by generation

    line(this.start.x, this.start.y, this.end.x, this.end.y); // draws the line

    //loops through child branches
    for (let child of this.branches) {
      child.show(); // draws them
    }
  }
}
