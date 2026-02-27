import { OrbitControls } from '@react-three/drei'
import { EffectComposer, N8AO } from '@react-three/postprocessing'
import { useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CubeAssembly from './CubeAssembly'
import useCameraFocus from './useCameraFocus'

const AUTO_ROTATE_IDLE_MS = 5000

function Scene({ controlsRef, onNodeFaceClick }) {
  const { focusFace, resetFocus } = useCameraFocus(controlsRef)
  const gl = useThree((state) => state.gl)

  const selectedNodeRef = useRef(null)
  const lastInteractionRef = useRef(Date.now())
  const [isInteracting, setIsInteracting] = useState(false)
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(false)
import { useMemo } from 'react'
import CubeAssembly from './CubeAssembly'
import useCameraFocus from './useCameraFocus'

function Scene({ controlsRef, onNodeFaceClick }) {
  const { focusFace } = useCameraFocus(controlsRef)

  const handleNodeFaceClick = (selection) => {
    focusFace(selection)
    onNodeFaceClick(selection)
  }

  const composerOptions = useMemo(
    () => ({
      intensity: 2.8,
      aoRadius: 0.24,
      distanceFalloff: 0.8,
      color: '#000000',
    }),
    []
  )

  const registerInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
  }, [])

  const clearSelection = useCallback(() => {
    selectedNodeRef.current = null
    resetFocus()
    onNodeFaceClick(null)
  }, [onNodeFaceClick, resetFocus])

  const handleNodeFaceClick = useCallback(
    (selection) => {
      registerInteraction()
      if (!selection) return

      if (selectedNodeRef.current === selection.nodeIndex) {
        clearSelection()
        return
      }

      selectedNodeRef.current = selection.nodeIndex
      focusFace(selection)
      onNodeFaceClick(selection)
    },
    [clearSelection, focusFace, onNodeFaceClick, registerInteraction]
  )

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return undefined

    const handleControlStart = () => {
      registerInteraction()
      setIsInteracting(true)
    }

    const handleControlEnd = () => {
      registerInteraction()
      setIsInteracting(false)
    }

    controls.addEventListener('start', handleControlStart)
    controls.addEventListener('end', handleControlEnd)

    return () => {
      controls.removeEventListener('start', handleControlStart)
      controls.removeEventListener('end', handleControlEnd)
    }
  }, [controlsRef, registerInteraction])

  useEffect(() => {
    const domElement = gl.domElement

    const handleContextMenu = (event) => {
      event.preventDefault()
      registerInteraction()
      clearSelection()
    }

    const handleWheel = () => {
      registerInteraction()
    }

    domElement.addEventListener('contextmenu', handleContextMenu)
    domElement.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      domElement.removeEventListener('contextmenu', handleContextMenu)
      domElement.removeEventListener('wheel', handleWheel)
    }
  }, [clearSelection, gl, registerInteraction])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const isIdle = Date.now() - lastInteractionRef.current > AUTO_ROTATE_IDLE_MS
      setAutoRotateEnabled(!isInteracting && isIdle)
    }, 200)

    return () => {
      window.clearInterval(interval)
    }
  }, [isInteracting])

  return (
    <>
      <color attach="background" args={['#121316']} />

      <ambientLight intensity={0.5} color="#7d8597" />
      <directionalLight
        position={[0, 8, 0]}
        intensity={2.4}
        color="#f7f4ef"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.00015}
      />
      <hemisphereLight intensity={0.35} color="#c7d3ff" groundColor="#16181f" />

      <CubeAssembly
        onNodeFaceClick={handleNodeFaceClick}
        onInteraction={registerInteraction}
        autoRotateEnabled={autoRotateEnabled}
      />
      <CubeAssembly onNodeFaceClick={handleNodeFaceClick} />

      <EffectComposer multisampling={0}>
        <N8AO {...composerOptions} />
      </EffectComposer>

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

export default Scene
