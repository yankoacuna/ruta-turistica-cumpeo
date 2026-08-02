import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', minHeight: '60vh' }}>
      <h1 className="h1" style={{ fontSize: '3rem', color: 'var(--color-rojo)' }}>404</h1>
      <h2 className="h2 mt-2">¡PLOP! Página no encontrada</h2>
      <p className="text-muted mt-2 mb-6">La atracción o sección que buscas no existe en Pelotillehue.</p>
      <Link href="/" className="btn btn-primary">
        🏠 Volver al Inicio
      </Link>
    </div>
  );
}
