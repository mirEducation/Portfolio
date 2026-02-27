import { Canvas } from '@react-three/fiber'

function App() {
  return (
    <main className="scene-container">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={['#050816']} />
      </Canvas>
    </main>
  )
}

export default App
