
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Atom, Bond } from '../types';
import { ELEMENTS } from '../constants';
import { Box } from 'lucide-react';

interface Molecule3DProps {
  atoms: Atom[];
  bonds: Bond[];
}

const Molecule3D: React.FC<Molecule3DProps> = ({ atoms, bonds }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ isDown: false, x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current || atoms.length === 0) return;

    const container = containerRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 1000, 15000);

    const fov = 35;
    const camera = new THREE.PerspectiveCamera(fov, width / (height || 1), 1, 50000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: "high-performance",
      preserveDrawingBuffer: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(1000, 1000, 1000);
    scene.add(mainLight);

    const fillLight = new THREE.PointLight(0xffffff, 2.0);
    fillLight.position.set(-800, 500, 500);
    scene.add(fillLight);

    const group = new THREE.Group();
    scene.add(group);

    const positions = atoms.map(a => new THREE.Vector3(a.x, -a.y, 0));
    const box = new THREE.Box3().setFromPoints(positions);
    const center = new THREE.Vector3(); box.getCenter(center);
    const size = new THREE.Vector3(); box.getSize(size);
    // Tăng maxDim tham chiếu để ngăn camera zoom quá sát vào phân tử nhỏ
    const maxDim = Math.max(size.x, size.y, size.z, 300); 

    const atomMeshes: Record<string, THREE.Mesh> = {};
    atoms.forEach(atom => {
      const el = ELEMENTS[atom.symbol] || { color: '#cccccc' };
      const radius = atom.symbol === 'H' ? 10 : 18; 
      const geometry = new THREE.SphereGeometry(radius, 64, 64);
      
      const material = new THREE.MeshPhysicalMaterial({ 
        color: new THREE.Color(el.color || '#cccccc'),
        roughness: 0.15,
        metalness: 0.1,
        reflectivity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        sheen: 0.5,
        emissive: new THREE.Color(el.color).multiplyScalar(0.02),
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(atom.x - center.x, -(atom.y + center.y), 0);
      group.add(mesh);
      atomMeshes[atom.id] = mesh;
    });

    bonds.forEach(bond => {
      const a1 = atomMeshes[bond.atom1Id];
      const a2 = atomMeshes[bond.atom2Id];
      if (!a1 || !a2) return;
      const direction = new THREE.Vector3().subVectors(a2.position, a1.position);
      const length = direction.length();
      const midPoint = new THREE.Vector3().addVectors(a1.position, a2.position).multiplyScalar(0.5);
      
      const createCylinder = (offset = new THREE.Vector3()) => {
        const geom = new THREE.CylinderGeometry(5, 5, length, 32); 
        const mat = new THREE.MeshStandardMaterial({ 
          color: 0x334155, 
          roughness: 0.2, 
          metalness: 0.5 
        });
        const cylinder = new THREE.Mesh(geom, mat);
        cylinder.position.copy(midPoint).add(offset);
        cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
        group.add(cylinder);
      };

      if (bond.type === 1) createCylinder();
      else if (bond.type === 2) {
        const cross = new THREE.Vector3(0,0,1).cross(direction).normalize().multiplyScalar(8); 
        createCylinder(cross.clone()); createCylinder(cross.clone().negate());
      } else {
        const cross = new THREE.Vector3(0,0,1).cross(direction).normalize().multiplyScalar(11); 
        createCylinder(); createCylinder(cross.clone()); createCylinder(cross.clone().negate());
      }
    });

    const aspect = width / height;
    const vFov = fov * (Math.PI / 180);
    let dist = (maxDim / 2) / Math.tan(vFov / 2);
    if (aspect < 1) dist = dist / aspect;
    
    camera.position.set(0, 0, dist * 1.5);
    camera.lookAt(0, 0, 0);

    const onMouseDown = (e: MouseEvent) => { mouseRef.current = { isDown: true, x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return;
      group.rotation.y += (e.clientX - mouseRef.current.x) * 0.007;
      group.rotation.x += (e.clientY - mouseRef.current.y) * 0.007;
      mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY;
    };
    const onMouseUp = () => { mouseRef.current.isDown = false; };
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!mouseRef.current.isDown) {
        group.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth; const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId); resizeObserver.disconnect();
      window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousedown', onMouseDown);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose(); scene.clear();
    };
  }, [atoms, bonds]);

  return (
    <div className="w-full h-full relative bg-[#0f172a] cursor-grab active:cursor-grabbing flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full" />
      {atoms.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <Box className="text-cyan-500/5 w-64 h-64 animate-pulse mb-8" />
          <p className="text-cyan-500/20 font-black uppercase tracking-[1em] text-sm">3D LABORATORY</p>
        </div>
      )}
    </div>
  );
};

export default Molecule3D;
