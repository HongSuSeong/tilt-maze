// Round each element form: a soft glow of its colour, on the floor under it too, and a white sticker shine. They sit on
// the form's rig (not the form), so they keep facing the camera.
import * as THREE from 'three';
import { FEEL } from './feel.js';

const r = FEEL.R * 0.1;

const tex = draw => { const c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')); return new THREE.CanvasTexture(c); };
let GLOW, OVAL;
const glowTex = () => (GLOW ??= tex(g => { const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.4, 'rgba(255,255,255,.5)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64); }));
const ovalTex = () => (OVAL ??= tex(g => { g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(32, 32, 30, 30, 0, 0, 7); g.fill(); }));

// the camera looks down at about 62°: "toward the camera" from the board
const TOWARD = new THREE.Vector3(0, Math.sin(62 * Math.PI / 180), Math.cos(62 * Math.PI / 180));
// how far the shine sits from the centre (toward the camera), and how big, for each form
const SHINE = { water: [1.05, 1], fire: [1.1, 0.9], ice: [1.05, 0.85], spark: [1.0, 0.9], stone: [1.15, 0.8], gas: [1.0, 0.95], steam: [1.0, 0.95], snow: [1.05, 1], blast: [0.95, 0.85] };
const COLOR = { water: '#5BB8F5', fire: '#FF7A2E', ice: '#8FD8F0', spark: '#FFD23F', stone: '#B8ADA3', gas: '#B8E986', steam: '#DDEBFA', snow: '#DCEBFA', blast: '#FF6A3C' };



// Adds the glow and the shine to a form's rig.
export function addFlair(el, wrap) {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: COLOR[el], transparent: true, opacity: 0.45, depthWrite: false }));
  h.scale.set(r * 3.6, r * 3.6, 1); h.renderOrder = -1; wrap.add(h);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(r * 4, r * 4), new THREE.MeshBasicMaterial({ map: glowTex(), color: COLOR[el], transparent: true, opacity: 0.5, depthWrite: false }));
  f.rotation.x = -Math.PI / 2; f.position.y = -r * 0.97; wrap.add(f);
  const [d, s] = SHINE[el], at = TOWARD.clone().multiplyScalar(r * d).add(new THREE.Vector3(-r * 0.36, r * 0.12, 0));
  const big = new THREE.Sprite(new THREE.SpriteMaterial({ map: ovalTex(), color: '#FFFFFF', transparent: true, rotation: -0.6, depthWrite: false })); big.scale.set(r * 0.42 * s, r * 0.24 * s, 1); big.position.copy(at); big.renderOrder = 3; wrap.add(big);
  const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: ovalTex(), color: '#FFFFFF', transparent: true, depthWrite: false })); dot.scale.set(r * 0.1 * s, r * 0.1 * s, 1); dot.position.copy(at).add(new THREE.Vector3(r * 0.2 * s, -r * 0.14 * s, 0)); dot.renderOrder = 3; wrap.add(dot);
}
