import { Canvas } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { PLACEHOLDER_LABEL } from './data/nodeMetadata'
import Scene from './scene/Scene'

function App() {
  const controlsRef = useRef(null)
  const [selectedFaceData, setSelectedFaceData] = useState({
    category: null,
    label: PLACEHOLDER_LABEL,
  })

  return (
    <main className="scene-container">
      <Canvas
        shadows
        camera={{ position: [3.8, 3.2, 5.6], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
      >
        <Scene
          controlsRef={controlsRef}
          onNodeFaceClick={(selection) =>
            setSelectedFaceData(
              selection?.faceMetadata ?? { category: null, label: PLACEHOLDER_LABEL }
            )
          }
        />
      </Canvas>

      {selectedFaceData?.category ? (
        <aside className="selection-panel" aria-live="polite">
          <p className="selection-panel__category">{selectedFaceData.category}</p>
          <p className="selection-panel__label">{selectedFaceData.label}</p>
        </aside>
      ) : null}
    </main>
  )
}

export default App
