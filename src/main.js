// Wiring. For now only the screenshot route: #shot=LEVELID[:dark] draws that stage at rest.
import { createView } from './render3d.js';
import { createRun } from './run.js';
import { levelById } from './levels/index.js';

const m = location.hash.match(/^#shot=([\w-]+)(?::(dark))?$/);
const level = levelById(m ? m[1] : 'w1-3'), view = createView(document.body), run = createRun(level);
view.load(level); view.setDark(m && m[2] === 'dark');
addEventListener('resize', () => view.resize());
const flat = { x: 0, y: 0 };
(function frame() { view.update(run, flat, 1 / 60); requestAnimationFrame(frame); })();
