import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Globe from "globe.gl";

export default function WeatherGlobe({
  lat,
  lng,
  size = 320,
  currentTime = Date.now() / 1000,
}) {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const cloudMeshRef = useRef(null);
  const pinGroupRef = useRef(null);
  const [isGlobeView, setIsGlobeView] = useState(false);

  // Convert latitude/longitude to 3D position
  const toXYZ = (R, latDeg, lngDeg, altitudeMul = 1) => {
    const phi = (90 - latDeg) * Math.PI / 180;
    const theta = (lngDeg + 180) * Math.PI / 180;
    const r = R * altitudeMul;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 🌍 Initialize globe
    const globe = Globe({ waitForGlobeReady: true })(el)
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor("#87CEEB")
      .atmosphereAltitude(0.25)
      .globeImageUrl("https://cdn.jsdelivr.net/npm/three-globe@2.26.0/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("https://cdn.jsdelivr.net/npm/three-globe@2.26.0/example/img/earth-topology.png");

    globe.width(size);
    globe.height(size);

    const camera = globe.camera();
    camera.position.z = 450;

    const controls = globe.controls();
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;
    controls.minDistance = 140;
    controls.maxDistance = 650;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    // 🎨 Lighting — uniform global light (no day/night contrast)
    const scene = globe.scene();
    const ambient = new THREE.AmbientLight(0xffffff, 1.1); // bright & uniform
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(100, 100, 100);
    scene.add(ambient, fillLight);

    // ☁️ Clouds
    const cloudTexture = new THREE.TextureLoader().load(
      "https://cdn.jsdelivr.net/gh/roblabs/earth-3d-textures@main/clouds.png"
    );
    const cloudGeo = new THREE.SphereGeometry(100.7, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(cloudMesh);
    cloudMeshRef.current = cloudMesh;

    // 📍 3D Pin marker (cone + base sphere)
    const pinGroup = new THREE.Group();
    const coneGeo = new THREE.ConeGeometry(1.5, 5, 16);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xff4d4d,
      emissive: 0xaa0000,
      emissiveIntensity: 0.7,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = Math.PI;

    const baseGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const baseMat = new THREE.MeshBasicMaterial({ color: 0xff6666 });
    const base = new THREE.Mesh(baseGeo, baseMat);

    pinGroup.add(cone);
    pinGroup.add(base);
    pinGroup.visible = false;
    scene.add(pinGroup);
    pinGroupRef.current = { pinGroup };

    // 🌫️ Animation loop
    const animate = () => {
      if (cloudMeshRef.current) cloudMeshRef.current.rotation.y += 0.00025;
      controls.update();
      requestAnimationFrame(animate);
    };
    animate();

    globeRef.current = globe;

    return () => {
      if (el) el.innerHTML = "";
      globeRef.current = null;
    };
  }, [size]);

  // 📍 Update pin position (always on front side)
  useEffect(() => {
    const { pinGroup } = pinGroupRef.current || {};
    if (!pinGroup) return;
    const pos = toXYZ(100, lat, lng, 1.02);
    pinGroup.position.copy(pos);
    const normal = pos.clone().normalize();
    pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  }, [lat, lng]);

  // 🎯 Focus camera on city
  const focusOnLocation = (zoomAltitude = 0.12, duration = 2500) => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    const { pinGroup } = pinGroupRef.current || {};

    controls.autoRotate = false;
    globe.pointOfView({ lat, lng, altitude: zoomAltitude }, duration);

    setTimeout(() => {
      if (!pinGroup) return;
      pinGroup.visible = true;

      // pulse in effect
      pinGroup.scale.set(0.5, 0.5, 0.5);
      const start = performance.now();
      const pop = () => {
        const t = Math.min(1, (performance.now() - start) / 500);
        const s = 0.5 + 0.5 * t;
        pinGroup.scale.set(s, s, s);
        if (t < 1) requestAnimationFrame(pop);
      };
      requestAnimationFrame(pop);
    }, duration * 0.85);
  };

  // 🌍 Toggle globe zoom
  const toggleGlobeView = () => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    const { pinGroup } = pinGroupRef.current || {};

    if (isGlobeView) {
      focusOnLocation(0.12, 2000);
    } else {
      globe.pointOfView({ lat, lng, altitude: 1.8 }, 2000);
      controls.autoRotate = true;
      if (pinGroup) pinGroup.visible = false;
    }
    setIsGlobeView(!isGlobeView);
  };

  // auto zoom to city on load
  useEffect(() => {
    focusOnLocation(0.12, 2500);
  }, [lat, lng]);

  return (
    <div
      className="relative flex justify-center items-center"
      style={{ width: "100%", maxWidth: `${size}px`, aspectRatio: "1/1" }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
          background: "radial-gradient(circle at center, #000 30%, #0a0a0a 100%)",
          boxShadow: "0 10px 50px rgba(0,0,0,0.6)",
        }}
      />
      <button
        onClick={toggleGlobeView}
        className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-xs text-white hover:bg-white/20 transition"
      >
        {isGlobeView ? "🔍 Zoom In" : "🌍 Globe View"}
      </button>
    </div>
  );
}
