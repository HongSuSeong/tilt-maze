// How the ball feels, found by hand in the tilt spike (public/spike/). Board units: the board is 100 wide and 160 deep,
// a 25 cm board, so 400 units are a metre. Only the sensitivity is the player's; the rest stays fixed.
export const FEEL = {
  BW: 100, BH: 160, RIM: 3,   // the board, and the rim wall around it
  R: 4.2,                     // ball radius
  G: 9.81 * 400 * 5 / 7,      // a solid ball rolling down a slope accelerates at 5/7 g sin(angle)
  fric: 0.6,                  // rolling resistance, per second (exponential)
  bounce: 0.35,               // how much of the speed into a wall comes back
  vmax: 1400,
  brk: 220,                   // speed into a cracked wall that breaks it
  keep: 0.75,                 // share of speed kept through a wall it breaks
  dead: 1,                    // degrees of tilt that do nothing, so a still hand stays still
  smooth: 0.5,                // how much of each new sensor reading is taken
  sub: 4,                     // physics steps per frame
  lean: 0.4,                  // the board on screen leans this share of the hand's tilt
};
