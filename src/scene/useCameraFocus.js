import { useCallback, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const DEFAULT_FOCUS_DISTANCE = 2.7
const POSITION_STIFFNESS = 6.5
const TARGET_STIFFNESS = 8

function useCameraFocus(controlsRef) {
  const camera = useThree((state) => state.camera)

  const focusTarget = useRef({
    cameraPosition: camera.position.clone(),
    controlsTarget: new THREE.Vector3(),
  })

  const initialized = useRef(false)

  const focusDistance = useMemo(() => DEFAULT_FOCUS_DISTANCE, [])

  const focusFace = useCallback(
    (point, normal) => {
      if (!point || !normal) return

      const worldPoint = point.clone()
      const worldNormal = normal.clone().normalize()

      focusTarget.current.controlsTarget.copy(worldPoint)
      focusTarget.current.cameraPosition.copy(worldPoint).addScaledVector(worldNormal, focusDistance)
    },
    [focusDistance]
  )

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    if (!initialized.current) {
      focusTarget.current.controlsTarget.copy(controls.target)
      focusTarget.current.cameraPosition.copy(camera.position)
      initialized.current = true
    }

    const posAlpha = 1 - Math.exp(-POSITION_STIFFNESS * delta)
    const targetAlpha = 1 - Math.exp(-TARGET_STIFFNESS * delta)

    camera.position.lerp(focusTarget.current.cameraPosition, posAlpha)
    controls.target.lerp(focusTarget.current.controlsTarget, targetAlpha)
    controls.update()
  })

  return { focusFace }
}

export default useCameraFocus
