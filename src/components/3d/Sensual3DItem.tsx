'use client'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshWobbleMaterial, Sphere } from '@react-three/drei'
import { easing } from 'maath'

export function Sensual3DItem() {
  return (
    <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} />
      <WobbleSphere />
    </Canvas>
  )
}

function WobbleSphere() {
  const ref = useRef<any>()
  
  useFrame((state, delta) => {
    if(ref.current) {
        // Rotate the sphere
        ref.current.rotation.y += delta * 0.2;
        // Gently move it
        easing.damp3(ref.current.position, [0, Math.sin(state.clock.elapsedTime) * 0.1, 0], 0.2, delta);
    }
  });

  return (
    <Sphere ref={ref} args={[1, 32, 32]}>
      <MeshWobbleMaterial
        color="#900D0D"
        speed={1}
        factor={0.2}
      />
    </Sphere>
  );
}
