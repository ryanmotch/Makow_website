export default function MakowLogo({ size = 48, className = '' }) {
  return (
    <img
      src="/logo.PNG"
      alt="Makow Genealogy"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      className={className}
    />
  )
}