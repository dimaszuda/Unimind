const K = 8.99e9  // Konstanta Coulomb (N·m²/C²)
const MIN_DISTANCE = 40  // jarak minimum supaya gaya tidak infinity

/**
 * Hitung gaya Coulomb antara dua muatan.
 * Return komponen vektor (fx, fy) yang bekerja pada q1 dari q2,
 * dan magnitude gaya-nya.
 */
export function coulombForce(q1, q2) {
  const dx = q2.x - q1.x
  const dy = q2.y - q1.y
  const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DISTANCE)

  const magnitude = (K * Math.abs(q1.value * q2.value)) / (dist * dist)

  // Normalisasi arah
  const nx = dx / dist
  const ny = dy / dist

  // Jika tanda muatan sama → gaya tolak (berlawanan arah)
  // Jika berbeda → gaya tarik (searah)
  const sign = q1.value * q2.value > 0 ? -1 : 1

  return {
    fx: sign * magnitude * nx,
    fy: sign * magnitude * ny,
    magnitude,
  }
}
