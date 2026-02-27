import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import CubeAssembly from './scene/CubeAssembly'

function App() {
  return (
    <main className="scene-container">
      <Canvas camera={{ position: [3.8, 3.2, 5.6], fov: 45 }}>
        <color attach="background" args={['#050816']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 7, 5]} intensity={1.3} color="#ffffff" />
        <directionalLight position={[-5, -3, -4]} intensity={0.35} color="#b7c4ff" />
        <CubeAssembly />
        <OrbitControls enablePan={false} minDistance={4} maxDistance={9} />
      </Canvas>
    </main>
  )
}

export default App
