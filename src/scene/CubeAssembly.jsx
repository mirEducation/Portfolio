import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import getResponsiveCubeScale from './getResponsiveCubeScale'

const GRID_SIZE = 3
const CUBE_SIZE = 0.72
const TARGET_GAP_MM = 2.5
const REFERENCE_CUBE_MM = 30
const GAP_UNITS = (TARGET_GAP_MM / REFERENCE_CUBE_MM) * CUBE_SIZE
const STEP = CUBE_SIZE + GAP_UNITS

const createNoiseTextures = (size = 128) => {
  const pixelCount = size * size
  const heightData = new Float32Array(pixelCount)

  for (let i = 0; i < pixelCount; i += 1) {
    heightData[i] = Math.random()
  }

  const bumpData = new Uint8Array(pixelCount * 4)
  const normalData = new Uint8Array(pixelCount * 4)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = y * size + x
      const left = heightData[y * size + ((x - 1 + size) % size)]
      const right = heightData[y * size + ((x + 1) % size)]
      const down = heightData[((y - 1 + size) % size) * size + x]
      const up = heightData[((y + 1) % size) * size + x]
      const dx = right - left
      const dy = up - down
      const dz = 1.0
      const normal = new THREE.Vector3(-dx * 3, -dy * 3, dz).normalize()

      const h = Math.floor(heightData[index] * 255)
      bumpData[index * 4] = h
      bumpData[index * 4 + 1] = h
      bumpData[index * 4 + 2] = h
      bumpData[index * 4 + 3] = 255

      normalData[index * 4] = Math.floor((normal.x * 0.5 + 0.5) * 255)
      normalData[index * 4 + 1] = Math.floor((normal.y * 0.5 + 0.5) * 255)
      normalData[index * 4 + 2] = Math.floor((normal.z * 0.5 + 0.5) * 255)
      normalData[index * 4 + 3] = 255
    }
  }

  const bumpMap = new THREE.DataTexture(bumpData, size, size, THREE.RGBAFormat)
  bumpMap.wrapS = THREE.RepeatWrapping
  bumpMap.wrapT = THREE.RepeatWrapping
  bumpMap.repeat.set(5, 5)
  bumpMap.needsUpdate = true

  const normalMap = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat)
  normalMap.wrapS = THREE.RepeatWrapping
  normalMap.wrapT = THREE.RepeatWrapping
  normalMap.repeat.set(5, 5)
  normalMap.needsUpdate = true

  return { bumpMap, normalMap }
}

const createGlyphGeometry = () => {
  const arm = 0.055
  const length = 0.18
  const shape = new THREE.Shape()
  shape.moveTo(-arm, -length)
  shape.lineTo(arm, -length)
  shape.lineTo(arm, -arm)
  shape.lineTo(length, -arm)
  shape.lineTo(length, arm)
  shape.lineTo(arm, arm)
  shape.lineTo(arm, length)
  shape.lineTo(-arm, length)
  shape.lineTo(-arm, arm)
  shape.lineTo(-length, arm)
  shape.lineTo(-length, -arm)
  shape.lineTo(-arm, -arm)
  shape.lineTo(-arm, -length)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: false,
  })
  geometry.center()
  return geometry
}

function CubeAssembly() {
  const viewport = useThree((state) => state.viewport)
  const groupRef = useRef(null)
  const cubeRef = useRef(null)
  const glyphRef = useRef(null)
  const groupScale = useMemo(
    () => getResponsiveCubeScale(viewport.width, viewport.height),
    [viewport.height, viewport.width]
  )

  const cubeGeometry = useMemo(() => new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE), [])
  const glyphGeometry = useMemo(() => createGlyphGeometry(), [])
  const accentGeometry = useMemo(
    () => new THREE.BoxGeometry(CUBE_SIZE * 1.75, CUBE_SIZE * 0.28, CUBE_SIZE * 0.28),
    []
  )

  const { bumpMap, normalMap } = useMemo(() => createNoiseTextures(), [])

  const cubeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e8e3d4',
        metalness: 0.05,
        roughness: 0.7,
        bumpMap,
        bumpScale: 0.02,
        normalMap,
        normalScale: new THREE.Vector2(0.25, 0.25),
      }),
    [bumpMap, normalMap]
  )

  const glyphMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.35,
        metalness: 0.02,
      }),
    []
  )

  const accentMaterials = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: '#6e5a8d', roughness: 0.75, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: '#5f7f6c', roughness: 0.75, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: '#8a5b5b', roughness: 0.75, metalness: 0.05 }),
    ],
    []
  )

  const cubeMatrices = useMemo(() => {
    const matrices = []
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          const matrix = new THREE.Matrix4()
          matrix.setPosition(x * STEP, y * STEP, z * STEP)
          matrices.push(matrix)
        }
      }
    }
    return matrices
  }, [])

  const glyphMatrices = useMemo(() => {
    const matrices = []
    const dummy = new THREE.Object3D()
    const faceOffset = CUBE_SIZE * 0.5 + 0.018
    const outward = new THREE.Vector3(0, 0, 1)

    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          const center = new THREE.Vector3(x * STEP, y * STEP, z * STEP)
          const normals = []
          if (x === -1) normals.push(new THREE.Vector3(-1, 0, 0))
          if (x === 1) normals.push(new THREE.Vector3(1, 0, 0))
          if (y === -1) normals.push(new THREE.Vector3(0, -1, 0))
          if (y === 1) normals.push(new THREE.Vector3(0, 1, 0))
          if (z === -1) normals.push(new THREE.Vector3(0, 0, -1))
          if (z === 1) normals.push(new THREE.Vector3(0, 0, 1))

          normals.forEach((normal) => {
            dummy.position.copy(center).addScaledVector(normal, faceOffset)
            dummy.quaternion.setFromUnitVectors(outward, normal)
            dummy.scale.setScalar(1)
            dummy.updateMatrix()
            matrices.push(dummy.matrix.clone())
          })
        }
      }
    }

    return matrices
  }, [])

  useLayoutEffect(() => {
    if (!cubeRef.current || !glyphRef.current) return

    cubeMatrices.forEach((matrix, i) => cubeRef.current.setMatrixAt(i, matrix))
    cubeRef.current.instanceMatrix.needsUpdate = true

    glyphMatrices.forEach((matrix, i) => glyphRef.current.setMatrixAt(i, matrix))
    glyphRef.current.instanceMatrix.needsUpdate = true
  }, [cubeMatrices, glyphMatrices])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.28
    groupRef.current.rotation.x += delta * 0.12
  })

  return (
    <group ref={groupRef} scale={groupScale}>
      <instancedMesh ref={cubeRef} args={[cubeGeometry, cubeMaterial, cubeMatrices.length]} />
      <instancedMesh ref={glyphRef} args={[glyphGeometry, glyphMaterial, glyphMatrices.length]} />

      <mesh geometry={accentGeometry} material={accentMaterials[0]} scale={[1.05, 1, 1]} />
      <mesh
        geometry={accentGeometry}
        material={accentMaterials[1]}
        rotation={[0, 0, Math.PI / 2]}
        scale={[1.05, 1, 1]}
      />
      <mesh
        geometry={accentGeometry}
        material={accentMaterials[2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[1.05, 1, 1]}
      />
    </group>
  )
}

export default CubeAssembly
