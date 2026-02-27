import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import { PLACEHOLDER_LABEL } from './data/nodeMetadata'
import CubeAssembly from './scene/CubeAssembly'
import useCameraFocus from './scene/useCameraFocus'

function SceneContents({ controlsRef, onNodeFaceClick }) {
  const { focusFace } = useCameraFocus(controlsRef)

  const handleNodeFaceClick = (selection) => {
    focusFace(selection)
    onNodeFaceClick(selection)
  }

  return (
    <>
      <color attach="background" args={['#050816']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 7, 5]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-5, -3, -4]} intensity={0.35} color="#b7c4ff" />
      <CubeAssembly onNodeFaceClick={handleNodeFaceClick} />
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
  const [selectedFaceData, setSelectedFaceData] = useState({
    category: null,
    label: PLACEHOLDER_LABEL,
  })

  const infoText = useMemo(() => {
    if (!selectedFaceData.category) {
      return {
        category: 'Click any cube face',
        label: 'Project labels are mapped per face category.',
      }
    }

    return {
      category: selectedFaceData.category,
      label: selectedFaceData.label,
    }
  }, [selectedFaceData])

  return (
    <main className="scene-container">
      <Canvas camera={{ position: [3.8, 3.2, 5.6], fov: 45 }}>
        <SceneContents
          controlsRef={controlsRef}
          onNodeFaceClick={(selection) => setSelectedFaceData(selection.faceMetadata)}
        />
      </Canvas>

      <aside className="selection-panel" aria-live="polite">
        <p className="selection-panel__category">{infoText.category}</p>
        <p className="selection-panel__label">{infoText.label}</p>
      </aside>
    </main>
  )
}

export default App
