import { MathUtils } from 'three'

const MOBILE_BREAKPOINT = 768
const MOBILE_VIEWPORT_COVERAGE = 0.7
const DESKTOP_VIEWPORT_COVERAGE = 0.66
const CUBE_ASSEMBLY_BASE_SPAN = 2.35
const MIN_SCALE = 0.8
const MAX_SCALE = 1.4

function getResponsiveCubeScale(width, height) {
  if (!width || !height) return 1

  const minDimension = Math.min(width, height)
  const isMobile = width <= MOBILE_BREAKPOINT
  const coverage = isMobile ? MOBILE_VIEWPORT_COVERAGE : DESKTOP_VIEWPORT_COVERAGE
  const unclampedScale = (minDimension * coverage) / CUBE_ASSEMBLY_BASE_SPAN

  return MathUtils.clamp(unclampedScale, MIN_SCALE, MAX_SCALE)
}

export default getResponsiveCubeScale
