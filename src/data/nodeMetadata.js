const FACE_CATEGORIES = {
  positiveX: 'ML',
  negativeX: 'Website Tools',
  positiveY: 'Mathematical Curiosities',
  negativeY: 'Physics',
  positiveZ: 'Apps',
}

const PLACEHOLDER_LABEL = 'Project Placeholder'

const getFaceCategoriesForPosition = ({ x, y, z }) => {
  const categories = []

  if (x === 1) categories.push(FACE_CATEGORIES.positiveX)
  if (x === -1) categories.push(FACE_CATEGORIES.negativeX)
  if (y === 1) categories.push(FACE_CATEGORIES.positiveY)
  if (y === -1) categories.push(FACE_CATEGORIES.negativeY)
  if (z === 1) categories.push(FACE_CATEGORIES.positiveZ)

  return categories
}

const baseNodeMetadata = []

for (let x = -1; x <= 1; x += 1) {
  for (let y = -1; y <= 1; y += 1) {
    for (let z = -1; z <= 1; z += 1) {
      const index = baseNodeMetadata.length
      const position = { x, y, z }
      const categories = getFaceCategoriesForPosition(position)
      const labels = Object.fromEntries(categories.map((category) => [category, PLACEHOLDER_LABEL]))

      baseNodeMetadata.push({
        index,
        position,
        categories,
        labels,
      })
    }
  }
}

const physicsSpot = baseNodeMetadata.find(({ position }) => position.x === 0 && position.y === -1 && position.z === 0)
if (physicsSpot) {
  physicsSpot.labels[FACE_CATEGORIES.negativeY] = '1D Elastic Collision Simulator'
}

const websiteToolsSpot = baseNodeMetadata.find(
  ({ position }) => position.x === -1 && position.y === 0 && position.z === 0
)
if (websiteToolsSpot) {
  websiteToolsSpot.labels[FACE_CATEGORIES.negativeX] = 'Geographical Midpoint Tool'
}

export const nodeMetadata = baseNodeMetadata

const getCategoryFromLocalNormal = (normal) => {
  if (!normal) return null

  if (normal.x > 0.5) return FACE_CATEGORIES.positiveX
  if (normal.x < -0.5) return FACE_CATEGORIES.negativeX
  if (normal.y > 0.5) return FACE_CATEGORIES.positiveY
  if (normal.y < -0.5) return FACE_CATEGORIES.negativeY
  if (normal.z > 0.5) return FACE_CATEGORIES.positiveZ

  return null
}

export const getNodeFaceMetadata = (nodeIndex, localNormal) => {
  const category = getCategoryFromLocalNormal(localNormal)
  const node = nodeMetadata[nodeIndex]

  if (!node || !category) {
    return {
      category: null,
      label: PLACEHOLDER_LABEL,
    }
  }

  return {
    category,
    label: node.labels[category] ?? PLACEHOLDER_LABEL,
  }
}

export { FACE_CATEGORIES, PLACEHOLDER_LABEL }
