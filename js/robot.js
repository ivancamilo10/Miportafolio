/**
 * Procedural running robot — built entirely from primitives and animated with
 * hand-written sine waves + spring/damping easing (no GLTF, no animation library).
 * Exposes window.initRobotScene(canvasId).
 */
(function () {
  function buildRobot(THREE) {
    const cream = 0xF6F1E4;
    const ink = 0x25231D;
    const terracotta = 0xC85A28;
    const visor = 0x2B2E33;

    const bodyMat = new THREE.MeshStandardMaterial({ color: cream, roughness: 0.45, metalness: 0.15 });
    const jointMat = new THREE.MeshStandardMaterial({ color: terracotta, roughness: 0.35, metalness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: ink, roughness: 0.5, metalness: 0.2 });
    const visorMat = new THREE.MeshStandardMaterial({ color: visor, roughness: 0.2, metalness: 0.6, emissive: 0x1a3d3d, emissiveIntensity: 0.4 });

    const robot = new THREE.Group();

    // ---- Torso ----
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 0.9, 4, 8), bodyMat);
    torso.position.y = 1.55;
    robot.add(torso);

    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.18), jointMat);
    chestPlate.position.set(0, 1.65, 0.5);
    robot.add(chestPlate);

    // ---- Head ----
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.55, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.55), bodyMat);
    headGroup.add(head);
    const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.05), visorMat);
    visorMesh.position.set(0, 0.02, 0.28);
    headGroup.add(visorMesh);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), darkMat);
    antenna.position.set(0, 0.4, 0);
    headGroup.add(antenna);
    const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), jointMat);
    antennaTip.position.set(0, 0.55, 0);
    headGroup.add(antennaTip);
    robot.add(headGroup);

    // ---- Limb factory ----
    function makeLimb({ upperLen, lowerLen, radius, isArm }) {
      const shoulder = new THREE.Group();

      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(radius, upperLen, 4, 8), bodyMat);
      upper.position.y = -upperLen / 2 - radius;
      shoulder.add(upper);

      const elbow = new THREE.Group();
      elbow.position.y = -upperLen - radius * 2;
      shoulder.add(elbow);

      const jointBall = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.05, 10, 10), jointMat);
      elbow.add(jointBall);

      const lower = new THREE.Mesh(new THREE.CapsuleGeometry(radius * 0.85, lowerLen, 4, 8), isArm ? darkMat : bodyMat);
      lower.position.y = -lowerLen / 2 - radius * 0.85;
      elbow.add(lower);

      let foot = null;
      if (!isArm) {
        foot = new THREE.Mesh(new THREE.BoxGeometry(radius * 2.6, radius * 0.9, radius * 3.4), jointMat);
        foot.position.y = -lowerLen - radius * 1.6;
        foot.position.z = radius * 0.6;
        elbow.add(foot);
      }

      return { shoulder, elbow };
    }

    // Arms
    const armL = makeLimb({ upperLen: 0.55, lowerLen: 0.5, radius: 0.14, isArm: true });
    armL.shoulder.position.set(-0.72, 2.0, 0);
    robot.add(armL.shoulder);

    const armR = makeLimb({ upperLen: 0.55, lowerLen: 0.5, radius: 0.14, isArm: true });
    armR.shoulder.position.set(0.72, 2.0, 0);
    robot.add(armR.shoulder);

    // Legs
    const legL = makeLimb({ upperLen: 0.62, lowerLen: 0.58, radius: 0.19, isArm: false });
    legL.shoulder.position.set(-0.32, 1.05, 0);
    robot.add(legL.shoulder);

    const legR = makeLimb({ upperLen: 0.62, lowerLen: 0.58, radius: 0.19, isArm: false });
    legR.shoulder.position.set(0.32, 1.05, 0);
    robot.add(legR.shoulder);

    return { robot, torso, headGroup, armL, armR, legL, legR };
  }

  function initRobotScene(canvasId) {
    const THREE = window.THREE;
    if (!THREE) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const container = canvas.parentElement;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 1.9, 6.2);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights — warm, matching the cream/terracotta palette
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xfff2df, 1.1);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc85a28, 0.5);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    // Ground disc
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 0.12, 48),
      new THREE.MeshStandardMaterial({ color: 0xEAE3D4, roughness: 0.8 })
    );
    platform.position.y = -0.06;
    scene.add(platform);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.02, 8, 64),
      new THREE.MeshStandardMaterial({ color: 0xC85A28, roughness: 0.4 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    const { robot, torso, headGroup, armL, armR, legL, legR } = buildRobot(THREE);
    robot.position.y = 0;
    scene.add(robot);

    const clock = new THREE.Clock();
    let rampUp = 0; // spring-style ramp so the run cycle eases in rather than snapping on
    let mouseX = 0, mouseY = 0;

    window.addEventListener('pointermove', (e) => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    });

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // spring/damping ease-in for the run amplitude (critically-damped feel)
      rampUp += (1 - rampUp) * 0.02;

      const speed = 6.2;
      const swing = 0.85 * rampUp;
      const phase = t * speed;

      // legs: opposite phase
      legL.shoulder.rotation.x = Math.sin(phase) * swing;
      legR.shoulder.rotation.x = Math.sin(phase + Math.PI) * swing;
      legL.elbow.rotation.x = Math.max(0, Math.sin(phase + 0.6) * 1.1) * rampUp;
      legR.elbow.rotation.x = Math.max(0, Math.sin(phase + Math.PI + 0.6) * 1.1) * rampUp;

      // arms: opposite to same-side leg for natural counter-swing
      armL.shoulder.rotation.x = Math.sin(phase + Math.PI) * swing * 0.8;
      armR.shoulder.rotation.x = Math.sin(phase) * swing * 0.8;
      armL.elbow.rotation.x = 0.4 + Math.max(0, Math.sin(phase + Math.PI) * 0.6) * rampUp;
      armR.elbow.rotation.x = 0.4 + Math.max(0, Math.sin(phase) * 0.6) * rampUp;

      // torso bob + slight lean, footstep impact bounce (abs sine = double frequency)
      const bob = Math.abs(Math.sin(phase)) * 0.09 * rampUp;
      robot.position.y = bob;
      torso.rotation.z = Math.sin(phase) * 0.05 * rampUp;
      robot.rotation.y = Math.sin(t * 0.35) * 0.5; // slow procedural turn, no fixed loop path
      headGroup.rotation.y = -robot.rotation.y * 0.4 + mouseX * 0.4;
      headGroup.rotation.x = mouseY * 0.2;

      // camera parallax
      camera.position.x += (mouseX * 1.4 - camera.position.x) * 0.04;
      camera.position.y += (1.9 - mouseY * 0.6 - camera.position.y) * 0.04;
      camera.lookAt(0, 1.3, 0);

      renderer.render(scene, camera);
    }
    animate();
  }

  window.initRobotScene = initRobotScene;
})();