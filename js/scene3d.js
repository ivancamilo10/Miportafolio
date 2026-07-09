/**
 * scene3d.js — "Living Code Knot"
 * (comentarios originales sin cambios)
 */
(function () {

  const PALETTE = {
    accent1: [0xC8, 0x5A, 0x28],
    accent2: [0x45, 0xD1, 0xFD],
    accent3: [0xEA, 0xE3, 0xD4],
    dark:    [0x1A, 0x1A, 0x2E]
  };

  function hexToRgbFloat(hexArr) {
    return [hexArr[0] / 255, hexArr[1] / 255, hexArr[2] / 255];
  }

  function buildKnot(THREE) {
    const geo = new THREE.TorusKnotGeometry(1.05, 0.32, 180, 20, 2, 3);
    const pos = geo.attributes.position;
    const count = pos.count;
    const basePositions = new Float32Array(pos.array);

    const colors = new Float32Array(count * 3);
    const c1 = hexToRgbFloat(PALETTE.accent1);
    const c2 = hexToRgbFloat(PALETTE.accent2);
    const c3 = hexToRgbFloat(PALETTE.accent3);

    for (let i = 0; i < count; i++) {
      const t = (i / count);
      const mixT = (Math.sin(t * Math.PI * 4) + 1) / 2;
      const r = c1[0] * (1 - mixT) + c2[0] * mixT;
      const g = c1[1] * (1 - mixT) + c2[1] * mixT;
      const b = c1[2] * (1 - mixT) + c2[2] * mixT;
      const blend = 0.25 + 0.75 * Math.abs(Math.sin(t * Math.PI * 8));
      colors[i * 3] = r * blend + c3[0] * (1 - blend) * 0.3;
      colors[i * 3 + 1] = g * blend + c3[1] * (1 - blend) * 0.3;
      colors[i * 3 + 2] = b * blend + c3[2] * (1 - blend) * 0.3;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.basePositions = basePositions;
    mesh.userData.count = count;
    return mesh;
  }

  function buildParticleHalo(THREE, sourceGeo, particleCount) {
    const srcPos = sourceGeo.attributes.position;
    const srcCount = srcPos.count;

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const c1 = hexToRgbFloat(PALETTE.accent2);
    const c2 = hexToRgbFloat(PALETTE.accent3);
    const c3 = hexToRgbFloat(PALETTE.accent1);

    for (let i = 0; i < particleCount; i++) {
      const srcIdx = Math.floor(Math.random() * srcCount);
      const jitter = 0.35;
      positions[i * 3]     = srcPos.getX(srcIdx) + (Math.random() - 0.5) * jitter;
      positions[i * 3 + 1] = srcPos.getY(srcIdx) + (Math.random() - 0.5) * jitter;
      positions[i * 3 + 2] = srcPos.getZ(srcIdx) + (Math.random() - 0.5) * jitter;

      const pick = Math.random();
      const col = pick < 0.4 ? c1 : pick < 0.7 ? c2 : c3;
      colors[i * 3] = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];

      scales[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    points.userData.basePositions = new Float32Array(positions);
    return points;
  }

  function buildOrbitLines(THREE) {
    const group = new THREE.Group();
    const ringCount = 3;
    const colors = [PALETTE.accent1, PALETTE.accent2, PALETTE.accent3];

    for (let r = 0; r < ringCount; r++) {
      const points = [];
      const segs = 64;
      const radius = 1.9 + r * 0.22;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const col = colors[r];
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(col[0] / 255, col[1] / 255, col[2] / 255),
        transparent: true,
        opacity: 0.35
      });
      const line = new THREE.LineLoop(geo, mat);
      line.rotation.x = Math.PI / 2 + (r - 1) * 0.25;
      line.rotation.z = r * 0.6;
      group.add(line);
    }
    return group;
  }

  function initHeroScene(canvasId) {
    const THREE = window.THREE;
    if (!THREE) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const container = canvas.parentElement;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0.3, 5.8);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const knot = buildKnot(THREE);
    const halo = buildParticleHalo(THREE, knot.geometry, 900);
    const orbitLines = buildOrbitLines(THREE);

    const rig = new THREE.Group();
    rig.add(knot, halo, orbitLines);
    scene.add(rig);

    let mouseX = 0, mouseY = 0;
    window.addEventListener('pointermove', (e) => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });

    // ── RESIZE ROBUSTO ──
    let lastW = 0, lastH = 0;
    let resizeTimeout = null;

    function applyResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;

      // Evita aspect ratio inválido (w o h en 0) que rompe la cámara
      if (w <= 0 || h <= 0) return;

      // Evita re-render si el tamaño no cambió realmente (previene loops)
      if (Math.abs(w - lastW) < 1 && Math.abs(h - lastH) < 1) return;

      lastW = w;
      lastH = h;

      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function scheduleResize() {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(applyResize, 80); // debounce
    }

    // ResizeObserver es más fiable que window.resize en móvil
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(scheduleResize);
      ro.observe(container);
    } else {
      window.addEventListener('resize', scheduleResize);
    }

    // Primer resize, con reintento por si las fuentes aún no cargaron
    applyResize();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(applyResize);
    }
    setTimeout(applyResize, 300);

    const clock = new THREE.Clock();
    const pos = knot.geometry.attributes.position;
    const base = knot.userData.basePositions;
    const count = knot.userData.count;

    const haloPos = halo.geometry.attributes.position;
    const haloBase = halo.userData.basePositions;

    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      for (let i = 0; i < count; i++) {
        const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2];
        const n = Math.sin(bx * 1.5 + t * 1.1) * Math.cos(by * 1.3 + t * 0.9) * 0.06;
        const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
        pos.setXYZ(
          i,
          bx + (bx / len) * n,
          by + (by / len) * n,
          bz + (bz / len) * n
        );
      }
      pos.needsUpdate = true;

      const breathe = 1 + Math.sin(t * 0.8) * 0.04;
      for (let i = 0; i < haloPos.count; i++) {
        haloPos.setXYZ(
          i,
          haloBase[i * 3] * breathe,
          haloBase[i * 3 + 1] * breathe + Math.sin(t * 1.5 + i * 0.01) * 0.03,
          haloBase[i * 3 + 2] * breathe
        );
      }
      haloPos.needsUpdate = true;

      rig.rotation.y = t * 0.22 + mouseX * 0.6;
      rig.rotation.x = Math.sin(t * 0.4) * 0.12 + mouseY * 0.25;
      orbitLines.rotation.z = t * 0.1;

      camera.position.x += (mouseX * 0.7 - camera.position.x) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();
  }

  window.initHeroScene = initHeroScene;
})();