import { useCallback, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const DEFAULT_FOCUS_DISTANCE = 2.7
const POSITION_STIFFNESS = 6.5
const TARGET_STIFFNESS = 8
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0, 5)
const DEFAULT_CONTROLS_TARGET = new THREE.Vector3(0, 0, 0)

function useCameraFocus(controlsRef) {
  const camera = useThree((state) => state.camera)

  const focusTarget = useRef({
    cameraPosition: DEFAULT_CAMERA_POSITION.clone(),
    controlsTarget: DEFAULT_CONTROLS_TARGET.clone(),
  })

  const initialized = useRef(false)

  const focusFace = useCallback(({ worldPoint, worldNormal } = {}) => {
    if (!worldPoint || !worldNormal) return

    const targetPoint = worldPoint.clone()
    const targetNormal = worldNormal.clone().normalize()

    focusTarget.current.controlsTarget.copy(targetPoint)
    focusTarget.current.cameraPosition
      .copy(targetPoint)
      .addScaledVector(targetNormal, DEFAULT_FOCUS_DISTANCE)
  }, [])

  const resetFocus = useCallback(() => {
    focusTarget.current.controlsTarget.copy(DEFAULT_CONTROLS_TARGET)
    focusTarget.current.cameraPosition.copy(DEFAULT_CAMERA_POSITION)
  }, [])

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    if (!initialized.current) {
      focusTarget.current.controlsTarget.copy(DEFAULT_CONTROLS_TARGET)
      focusTarget.current.cameraPosition.copy(DEFAULT_CAMERA_POSITION)
      controls.target.copy(DEFAULT_CONTROLS_TARGET)
      camera.position.copy(DEFAULT_CAMERA_POSITION)
      initialized.current = true
    }

    const posAlpha = 1 - Math.exp(-POSITION_STIFFNESS * delta)
    const targetAlpha = 1 - Math.exp(-TARGET_STIFFNESS * delta)

    camera.position.lerp(focusTarget.current.cameraPosition, posAlpha)
    controls.target.lerp(focusTarget.current.controlsTarget, targetAlpha)
    controls.update()
  })

  return { focusFace, resetFocus }
}

export default useCameraFocus
