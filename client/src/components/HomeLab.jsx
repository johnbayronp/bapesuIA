import React, { useEffect, useRef, useState } from 'react';

const modes = [
  { id: 'robot', label: 'Robótica', caption: 'Ideas que cobran movimiento.' },
  { id: 'printer', label: 'Impresión 3D', caption: 'De una idea a un objeto real.' },
  { id: 'circuit', label: 'Electrónica', caption: 'Conexiones que crean posibilidades.' },
];

export default function HomeLab({ mode = 'robot', isPaused = false, reducedMotion = false }) {
  const host = useRef(null);
  const action = useRef(0);
  const active = useRef('robot');
  const paused = useRef(false);
  const controlsRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => { active.current = mode; }, [mode]);
  useEffect(() => { paused.current = isPaused; }, [isPaused]);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    Promise.all([import('three'), import('three/addons/controls/OrbitControls.js')]).then(([T, { OrbitControls }]) => {
      if (cancelled || !host.current) return;
      const container = host.current;
      let renderer;
      try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
      catch { setStatus('fallback'); return; }
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(38, 1, 0.1, 60);
      camera.position.set(5, 3.6, 7);
      camera.lookAt(0, 0.5, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.5, 0);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableDamping = true;
      controls.minPolarAngle = 0.3;
      controls.maxPolarAngle = Math.PI / 2;
      controls.update();
      controls.saveState();
      controlsRef.current = {
        reset: () => controls.reset(),
        zoom: (factor) => {
          const offset = camera.position.clone().sub(controls.target);
          offset.setLength(Math.max(5, Math.min(13, offset.length() * factor)));
          camera.position.copy(controls.target).add(offset);
          controls.update();
        },
      };
      scene.add(new T.HemisphereLight(0xc5f8ff, 0x171b48, 3));
      const cyan = new T.PointLight(0x4fffe8, 35); cyan.position.set(3, 4, 2); scene.add(cyan);
      const violet = new T.PointLight(0x9966ff, 45); violet.position.set(-4, 2, -2); scene.add(violet);
      const materials = [];
      const material = (color, glow = false) => {
        const m = new T.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.55, ...(glow ? { emissive: color, emissiveIntensity: 1.4 } : {}) });
        materials.push(m); return m;
      };
      const white = material(0xd9e9f5), dark = material(0x182b45), neon = material(0x51f6dd, true), purple = material(0x9873ff, true);
      const mesh = (group, geometry, mat, x, y, z) => {
        const item = new T.Mesh(geometry, mat); item.position.set(x, y, z); group.add(item); return item;
      };
      const box = (g, w, h, d, mat, x, y, z) => mesh(g, new T.BoxGeometry(w, h, d), mat, x, y, z);
      const world = new T.Group(); scene.add(world);
      mesh(world, new T.CylinderGeometry(2.6, 2.8, 0.18, 64), dark, 0, -1.1, 0);
      const ring = mesh(world, new T.TorusGeometry(2.65, 0.025, 8, 100), neon, 0, -0.99, 0); ring.rotation.x = Math.PI / 2;
      const grid = new T.GridHelper(5, 20, 0x456d8e, 0x203448); grid.position.y = -0.99; world.add(grid);
      const orbit = new T.Group(); world.add(orbit);
      for (let i = 0; i < 3; i++) {
        const arc = mesh(orbit, new T.TorusGeometry(2.95 + i * .16, .012, 6, 80, Math.PI * 1.3), i % 2 ? purple : neon, 0, -.75 + i * .14, 0);
        arc.rotation.x = Math.PI / 2; arc.rotation.z = i * 2;
      }
      const robot = new T.Group(); world.add(robot);
      box(robot, 1.3, 1.15, 0.8, white, 0, 0.05, 0);
      box(robot, 0.8, 0.55, 0.04, dark, 0, 0.1, 0.43);
      for (let i = 0; i < 3; i++) box(robot, 0.12, 0.08, 0.05, neon, -0.24 + i * 0.24, 0.12, 0.47);
      const head = new T.Group(); head.position.y = 1.15; robot.add(head);
      box(head, 1.65, 0.9, 0.95, white, 0, 0, 0);
      box(head, 1.4, 0.55, 0.05, dark, 0, 0, 0.49);
      [-0.4, 0.4].forEach((x) => mesh(head, new T.SphereGeometry(0.11, 16, 16), neon, x, 0.02, 0.55));
      box(head, 0.08, 0.32, 0.08, dark, 0, 0.6, 0);
      mesh(head, new T.SphereGeometry(0.1, 16, 16), purple, 0, 0.8, 0);
      const arms = [];
      [-1, 1].forEach((side) => {
        mesh(robot, new T.SphereGeometry(0.24, 20, 20), dark, side * 0.9, 0.4, 0);
        const arm = new T.Group(); arm.position.set(side * .9, .4, 0); robot.add(arm);
        box(arm, .32, .75, .4, white, side * .13, -.37, 0);
        box(arm, .4, .25, .45, dark, side * .22, -.8, 0);
        arm.rotation.z = side * .2; arms.push(arm);
        box(robot, 0.36, 0.36, 0.38, dark, side * 0.38, -0.72, 0);
        box(robot, 0.55, 0.22, 0.75, white, side * 0.38, -0.9, 0.1);
      });
      const printer = new T.Group(); world.add(printer);
      box(printer, 3.2, 0.22, 2.2, white, 0, -0.8, 0);
      box(printer, 2.5, 0.12, 1.8, dark, 0, -0.61, 0);
      [-1.35, 1.35].forEach((x) => box(printer, 0.16, 2.8, 0.2, white, x, 0.65, 0));
      box(printer, 2.85, 0.16, 0.22, white, 0, 2, 0);
      const gantry = new T.Group(); printer.add(gantry);
      box(gantry, 2.75, 0.1, 0.1, purple, 0, 1.2, 0);
      const nozzle = new T.Group(); gantry.add(nozzle);
      box(nozzle, 0.4, 0.4, 0.4, dark, 0, 1.15, 0.1);
      mesh(nozzle, new T.ConeGeometry(0.12, 0.25, 12), neon, 0, 0.84, 0.1).rotation.z = Math.PI;
      const printLayers = [];
      for (let i = 0; i < 16; i++) printLayers.push(mesh(printer, new T.CylinderGeometry(0.48, 0.5, 0.045, 6), i % 2 ? purple : white, 0, -0.5 + i * 0.065, 0.15));
      const circuit = new T.Group(); world.add(circuit);
      box(circuit, 3.4, 0.12, 2.6, material(0x133d44), 0, -0.25, 0);
      box(circuit, 1.15, 0.4, 1.15, dark, 0, 0.02, 0);
      box(circuit, 0.55, 0.04, 0.55, purple, 0, 0.25, 0);
      for (let i = -3; i <= 3; i++) {
        [-1, 1].forEach((side) => {
          box(circuit, 0.4, 0.045, 0.06, white, side * 0.72, -0.03, i * 0.15);
          box(circuit, 0.06, 0.045, 0.4, white, i * 0.15, -0.03, side * 0.72);
          box(circuit, 0.6, 0.015, 0.025, neon, side * 1.17, -0.175, i * 0.27);
        });
      }
      [-1, 1].forEach((side) => {
        mesh(circuit, new T.CylinderGeometry(0.16, 0.16, 0.5, 16), white, side * 1.35, 0.05, -0.95);
        mesh(circuit, new T.SphereGeometry(0.09, 12, 12), neon, side * 1.35, -0.07, 0.95);
      });
      const groups = { robot, printer, circuit };
      Object.entries(groups).forEach(([id, group]) => {
        group.scale.setScalar(id === active.current ? 1 : 0);
        group.visible = id === active.current;
      });
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      let visible = true, frame = 0, time = 0, last = performance.now();
      let lastAction = 0, waveStart = -10;
      let pointerX = 0, pointerY = 0;
      const pointer = (e) => { const r = container.getBoundingClientRect(); pointerX = ((e.clientX - r.left) / r.width - 0.5) * 0.65; pointerY = ((e.clientY - r.top) / r.height - 0.5) * 0.15; };
      const reset = () => { pointerX = 0; pointerY = 0; };
      const resize = () => { const { width, height } = container.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); };
      const observer = new ResizeObserver(resize); observer.observe(container); resize();
      const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); intersection.observe(container);
      container.addEventListener('pointermove', pointer); container.addEventListener('pointerleave', reset);
      const lost = (event) => { event.preventDefault(); setStatus('fallback'); };
      renderer.domElement.addEventListener('webglcontextlost', lost);
      const tick = (now) => {
        frame = requestAnimationFrame(tick);
        const delta = Math.min((now - last) / 1000, 0.05); last = now;
        if (!visible || document.hidden) return;
        const moving = !reduced.matches && !paused.current;
        if (moving) time += delta;
        Object.entries(groups).forEach(([id, group]) => {
          const target = id === active.current ? 1 : 0;
          const scale = reduced.matches ? target : T.MathUtils.damp(group.scale.x, target, 12, delta);
          group.scale.setScalar(scale);
          group.visible = scale > 0.01;
        });
        controls.update();
        world.rotation.y += ((moving ? pointerX + Math.sin(time * 0.25) * 0.12 : 0) - world.rotation.y) * 0.07;
        world.rotation.x += ((moving ? pointerY : 0) - world.rotation.x) * 0.07;
        if (action.current !== lastAction) { lastAction = action.current; waveStart = time; }
        const wave = Math.max(0, Math.min(1, (time - waveStart) * 3, (3 - (time - waveStart)) * 3));
        arms[1].rotation.z = .2 + wave * (2.1 + Math.sin(time * 11) * .25);
        arms[0].rotation.z = -.2 + Math.sin(time * 1.6) * .08;
        head.rotation.z = wave * -.1;
        head.rotation.y = Math.sin(time * 0.65) * 0.2 + (moving ? pointerX * .8 : 0);
        orbit.rotation.y = time * .18;
        neon.emissiveIntensity = 1.25 + Math.sin(time * 2) * .35;
        robot.position.y = Math.sin(time * 1.1) * 0.06;
        nozzle.position.x = Math.sin(time * 1.3) * 0.65;
        const layerProgress = reduced.matches ? 16 : (time % 8) / 8 * 20;
        printLayers.forEach((layer, index) => { layer.visible = index < layerProgress; });
        circuit.rotation.y = Math.sin(time * 0.3) * 0.22;
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(tick); setStatus('ready');
      cleanup = () => {
        cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect();
        container.removeEventListener('pointermove', pointer); container.removeEventListener('pointerleave', reset);
        renderer.domElement.removeEventListener('webglcontextlost', lost);
        scene.traverse((item) => { item.geometry?.dispose(); });
        materials.forEach((m) => m.dispose());
        const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material]; gridMaterials.forEach((m) => m.dispose());
        controls.dispose(); controlsRef.current = null;
        renderer.dispose(); renderer.domElement.remove();
      };
    }).catch(() => { if (!cancelled) setStatus('fallback'); });
    return () => { cancelled = true; cleanup(); };
  }, []);

  return <div className="home-lab">
    <div className="home-lab-top"><span><i /> BAPESU LAB</span><span>EXPLORA EN 3D</span></div>
    <div className="home-lab-viewport" ref={host} aria-hidden="true" />
    {status !== 'ready' && <div className="home-lab-fallback" aria-hidden="true"><svg viewBox="0 0 160 160" fill="none"><rect x="37" y="35" width="86" height="58" rx="16"/><path d="M80 19v16M57 69h10m26 0h10M48 105h64v34H48zM26 110v20m108-20v20"/><circle cx="80" cy="15" r="5"/></svg><span>{status === 'loading' ? 'Preparando el laboratorio…' : modes.find((m) => m.id === mode).caption}</span></div>}
    <div className="home-lab-badge" aria-hidden="true"><i />{mode === 'robot' ? 'CREAR · PROGRAMAR · EXPLORAR' : mode === 'printer' ? 'DISEÑAR · IMPRIMIR · CONSTRUIR' : 'CONECTAR · INNOVAR · TRANSFORMAR'}</div>
    <div className="home-lab-bottom">
      {mode === 'robot' && <button className="home-robot-action" type="button" disabled={status !== 'ready' || isPaused || reducedMotion} onClick={() => { action.current += 1; }}>Saludar al robot <span aria-hidden="true">✦</span></button>}
      <div className="home-lab-caption"><span>Arrastra para girar · Explora cada detalle</span>
        <div className="home-lab-tools">
          <button type="button" disabled={status !== 'ready'} aria-label="Acercar modelo" onClick={() => controlsRef.current?.zoom(0.85)}>+</button>
          <button type="button" disabled={status !== 'ready'} aria-label="Alejar modelo" onClick={() => controlsRef.current?.zoom(1.15)}>−</button>
          <button type="button" disabled={status !== 'ready'} aria-label="Restablecer vista del modelo" onClick={() => controlsRef.current?.reset()}>↺</button>
        </div>
      </div>
    </div>
  </div>;
}
