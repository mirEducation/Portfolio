import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useRef } from 'react'
import CubeAssembly from './scene/CubeAssembly'
import useCameraFocus from './scene/useCameraFocus'

function SceneContents({ controlsRef }) {
  const { focusFace } = useCameraFocus(controlsRef)

  return (
    <>
      <color attach="background" args={['#050816']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 7, 5]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-5, -3, -4]} intensity={0.35} color="#b7c4ff" />
      <CubeAssembly onNodeFaceClick={focusFace} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3.2}
        maxDistance={8.5}
      />
    </>
  )
}

function App() {
  const controlsRef = useRef(null)

  return (
    <main className="scene-container">
      <Canvas camera={{ position: [3.8, 3.2, 5.6], fov: 45 }}>
        <SceneContents controlsRef={controlsRef} />
      </Canvas>
    </main>
  )
}

export default App
