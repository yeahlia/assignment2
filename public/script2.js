// doesnt use objects still, but pointed edges?

// --- GLOBAL VARIABLES -------------------------------------------------------------------------------------
let growingBranches = []; // array of all growing branches
let mainPointX, mainPointY; // holds the coordinates of the centre where the branches will start growing

// SETUP ----------------------------------------------------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight); // creates canvas the size on the window
  background("black"); // black background
  stroke("white"); // white lines
  strokeWeight(2); // thickness of the lines

  mainPointX = width / 2; // sets the main point middle of the total width
  mainPointY = height / 2; // sets the main point middle of the total height

  // starts the loop with 10 branches
  for (let i = 0; i < 10; i++) {
    let startAngle = random(TWO_PI); // chooses a random angle of an entire circle
    // creates new branch with a maximum of 8 generations and pushes it to the growingBranches array
    growingBranches.push(new Branch(mainPointX, mainPointY, startAngle, 8));
  }
}

// DRAW -----------------------------------------------------------------------------------------------------
function draw() {
  // if there is zero values in growingBranches array:
  // if (growingBranches.length === 0) {
  //   // creates a new branch with a random angle and a depth of 6
  //   growingBranches.push(new Branch(mainPointX, mainPointY, random(TWO_PI), 6));
  // }

  // background(black);

  // loops through the growingBranches array
  for (let i = growingBranches.length - 1; i >= 0; i--) {
    growingBranches[i].update(); // runs the update function
    growingBranches[i].show(); // runs the show function

    // if branch is finished growing:
    if (growingBranches[i].finished) {
      let finishedBranch = growingBranches[i]; // saves the finished branch into a temporary variable
      growingBranches.splice(i, 1); // removes it after saving (otherwise will keep growing forever)

      const numChildren = int(random(2, 3)); // spawns either 2 or 3 children branches

      // loops depending on the the number of children branches
      for (let j = 0; j < numChildren; j++) {
        // picks a new angle for the child branches
        const newAngle = finishedBranch.angle + random(-PI / 4, PI / 4);
        const newDepth = max(0, finishedBranch.depth - 1); // decreases depth

        const spawnChance = map(finishedBranch.depth, 1, 8, 0.2, 1.0); // less likely for deeper generations

        // only creates child if depth is above 0 + random chance
        if (newDepth > 0 && random() < spawnChance) {
          // push to growingBranches array
          growingBranches.push(
            new Branch( // starts building branch
              // x coordinate for new branch
              finishedBranch.x + // starts from parent branch's x coordinate
                // calculates the x direction and makes it the actual final point
                cos(finishedBranch.angle) * finishedBranch.len,
              finishedBranch.y + // starts from parent branch's y coordinate
                // calculates the y direction and makes it the actual final point
                sin(finishedBranch.angle) * finishedBranch.len,
              newAngle, // direction the new branch will grow
              newDepth // depth value (which slowly shrinks over generations)
            )
          );
        }
      }
    }
  }
}

// --- BRANCH CLASS -----------------------------------------------------------------------------------------
// defines the Branch class
class Branch {
  // the necesssary information
  constructor(x, y, angle, depth) {
    this.x = x; // starting property of x position
    this.y = y; // starting property of y position
    this.angle = angle; // starting property of angle
    this.depth = depth; // starting property of depth
    this.len = 0; // starts the branch with 0 length

    let minLen = max(10, depth * 5 + 10); // makes sure branches aren't short
    let maxLen = depth * 20 + 20; // max length it can grow
    this.targetLen = random(minLen, maxLen); // sets the length within that range

    this.finished = false; // makes sure it doesn't finish when it is first created
    this.speed = random(0.3, 0.7); // random speed of growth between 0.3 and 0.7

    this.lifetime = 200 + depth * 20; // each branch lives longer based on its depth
  }

  // update logic
  update() {
    // skip this branch completely if it's too short
    if (this.targetLen < 15) {
      this.finished = true;
      return;
    }

    // if branch hasn't fully grown:
    if (this.len < this.targetLen) {
      this.len += this.speed; // keeps growing
      this.lifetime--; // reduces lifetime by 1 each frame

      // if lifetime hits 0
      if (this.lifetime <= 0) {
        this.finished = true; // branch dies
        return;
      }
    } else {
      this.finished = true; // branch dies
    }
  }

  // show logic
  show() {
    if (this.targetLen < 15) return; // skip drawing if branch is too short

    // stroke transparency fades with depth; thickness thins with depth
    stroke(255, map(this.depth, 0, 8, 30, 255)); // lighter in later generations
    strokeWeight(map(this.depth, 0, 8, 0.5, 2)); // thinner in later generations

    push(); // saves current canvas settings?
    translate(this.x, this.y); // move origin to branch starting point
    rotate(this.angle); // rotates canvas by branch angle
    line(0, 0, this.len, 0); // draws line
    pop(); // restores previous canvas settings
  }
}
