import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { getNodeFaceMetadata } from '../data/nodeMetadata'
import getResponsiveCubeScale from './getResponsiveCubeScale'

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

function CubeAssembly({ onNodeFaceClick }) {
  const viewport = useThree((state) => state.viewport)
  const groupRef = useRef(null)
  const [hoveredNode, setHoveredNode] = useState(null)
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
        emissive: '#8ea4ff',
        emissiveIntensity: 0.03,
      }),
    [bumpMap, normalMap]
  )

  const hoverMaterial = useMemo(() => {
    const material = cubeMaterial.clone()
    material.emissiveIntensity = 0.16
    return material
  }, [cubeMaterial])

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

  const cubePositions = useMemo(() => {
    const positions = []
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          positions.push(new THREE.Vector3(x * STEP, y * STEP, z * STEP))
        }
      }
    }
    return positions
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

  const glyphRef = useRef(null)

  useLayoutEffect(() => {
    if (!glyphRef.current) return
    glyphMatrices.forEach((matrix, i) => glyphRef.current.setMatrixAt(i, matrix))
    glyphRef.current.instanceMatrix.needsUpdate = true
  }, [glyphMatrices])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.28
    groupRef.current.rotation.x += delta * 0.12
  })

  const handleNodeClick = (event, nodeIndex) => {
    event.stopPropagation()
    if (!onNodeFaceClick || !event.face) return

    const worldPoint = event.point.clone()
    const localNormal = event.face.normal.clone()
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(event.object.matrixWorld)
    const worldNormal = localNormal.clone().applyMatrix3(normalMatrix).normalize()
    const faceMetadata = getNodeFaceMetadata(nodeIndex, localNormal)

    onNodeFaceClick({
      worldPoint,
      worldNormal,
      nodeIndex,
      faceMetadata,
    })
  }

  return (
    <group ref={groupRef} scale={groupScale}>
      {cubePositions.map((position, index) => (
        <mesh
          key={`cube-node-${index}`}
          position={position}
          geometry={cubeGeometry}
          material={hoveredNode === index ? hoverMaterial : cubeMaterial}
          castShadow
          receiveShadow
          onPointerOver={(event) => {
            event.stopPropagation()
            setHoveredNode(index)
          }}
          onPointerOut={(event) => {
            event.stopPropagation()
            setHoveredNode((prev) => (prev === index ? null : prev))
          }}
          onClick={(event) => handleNodeClick(event, index)}
        />
      ))}

      <instancedMesh
        ref={glyphRef}
        args={[glyphGeometry, glyphMaterial, glyphMatrices.length]}
        castShadow
        receiveShadow
      />

      <mesh
        geometry={accentGeometry}
        material={accentMaterials[0]}
        scale={[1.05, 1, 1]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={accentGeometry}
        material={accentMaterials[1]}
        rotation={[0, 0, Math.PI / 2]}
        scale={[1.05, 1, 1]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={accentGeometry}
        material={accentMaterials[2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[1.05, 1, 1]}
        castShadow
        receiveShadow
      />
    </group>
  )
}

export default CubeAssembly
