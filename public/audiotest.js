function setup() {
  createCanvas(400, 400);
  userStartAudio(); // <- important! allow audio
  background(220);

  osc = new p5.Oscillator("sine");
  osc.freq(440);
  osc.amp(0.5);
  osc.start();
}
