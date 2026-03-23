import * as THREE from 'three';
import React,{ useRef, useMemo, useEffect } from 'react'; // Import useRef
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Grid, Stars, OrbitControls} from '@react-three/drei';

function Scene() {
  const { scene } = useGLTF('/wasa.glb');
  
  const floorProps = useMemo(() => {
    const floorObject = scene.getObjectByName('Floor');
    if(!floorObject){
      console.error("Could not get Floor!")
      return null;
    }

    const box = new THREE.Box3().setFromObject(floorObject);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return {size, center};
  }, [scene]);
  return (
  <>
  <primitive object={scene} />;

  {floorProps &&(
    <Grid
      position={[floorProps.center.x, floorProps.center.y + 0.01, floorProps.center.z]}
      args={[floorProps.size.x, floorProps.size.z]}
      cellSize={2.36}
      cellColor={"#007bff"}
      sectionSize={23.6}
      sectionColor={"#00c6ff"}
      fadeDistance={200}
      infiniteGrid={false}
    />
  )}
  </>
  );
}

function TopDownController() {

  const { camera } = useThree();
  const keys = useRef({w: false, s:false, a:false, d:false});
  const zoomDelta = useRef(0);

  const pivot = useRef(new THREE.Object3D());
  const targetQuaternion = useRef(new THREE.Quaternion());
  const isRotating = useRef(false);

  const panSpeed = 10;
  const zoomSpeed = 2;

  useEffect(() => {

    pivot.current.add(camera);
    camera.position.set(0,40,0);
    camera.lookAt(pivot.current.position);
    targetQuaternion.current.copy(pivot.current.quaternion);

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (keys.current.hasOwnProperty(key)) keys.current[key] = true;

      if(!isRotating.current){
        if(key === 'e'){
          isRotating.current = true;
          const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/2);
          targetQuaternion.current.premultiply(rotation);
        }
        if(key === 'q'){
          isRotating.current = true;
          const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
          targetQuaternion.current.premultiply(rotation);
        }
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      if(keys.current.hasOwnProperty(key)) keys.current[key] = false;
    };

    const handleWheel = (event) => {
      zoomDelta.current += event.deltaY * 0.01 * zoomSpeed;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
      if(pivot.current) pivot.current.remove(camera);
    };
  }, [camera,zoomSpeed]);

  useFrame((state, delta) => {
    
    const minX = -70;
    const maxX = 90;
    const minZ = -30;
    const maxZ = 30;
    const minY = 5, maxY = 50;

    if(isRotating.current){
      pivot.current.quaternion.slerp(targetQuaternion.current, 0.15);
      if(pivot.current.quaternion.angleTo(targetQuaternion.current)<0.01){
        pivot.current.quaternion.copy(targetQuaternion.current);
        isRotating.current = false;
      }
    }

    if(zoomDelta.current !== 0){
      camera.position.y = THREE.MathUtils.clamp(camera.position.y + zoomDelta.current, minY, maxY);
      zoomDelta.current = 0;
    }

    const moveDirection = new THREE.Vector3();
    if(keys.current.w) moveDirection.z -= 1;
    if(keys.current.s) moveDirection.z += 1;
    if(keys.current.a) moveDirection.x -= 1;
    if(keys.current.d) moveDirection.x += 1;

    moveDirection.normalize();

    moveDirection.applyQuaternion(pivot.current.quaternion);
    pivot.current.position.x += moveDirection.x*panSpeed*delta;
    pivot.current.position.z += moveDirection.z*panSpeed*delta;

    pivot.current.position.x = THREE.MathUtils.clamp(pivot.current.position.x, minX, maxX);
    pivot.current.position.z = THREE.MathUtils.clamp(pivot.current.position.z, minZ, maxZ);
    });

  return <primitive object = {pivot.current}/>;
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 40, 0], fav:60 }}>
      <color attach="background" args ={['#101020']}/>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 5]} intensity={2.5}/>
      <Stars
      radius={100}
      depth={50}
      count={5000}
      factor={4}
      saturation={0}
      fade
      speed={1}
      />
      <Scene />
      <OrbitControls />
    </Canvas>
  );
}

