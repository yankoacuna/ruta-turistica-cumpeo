import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Historia de Cumpeo — El Pueblo de Condorito',
  description: 'Descubre la increíble historia de cómo Cumpeo se convirtió en el único pueblo real de la historieta de Condorito.',
};

export default function HistoriaPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* ── HERO SECTION ─────── */}
      <section className="hero" style={{ height: '50vh', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} aria-label="Historia de Cumpeo">
        <img
          className="hero-img"
          src="/assets/images/ruta-condorito.webp" 
          alt="Historia Cumpeo"
          style={{ opacity: 0.4 }}
        />
        <div className="hero-overlay" style={{ background: `linear-gradient(to bottom, rgba(30, 30, 36, 0.7), var(--color-background))` }}></div>

        <div className="hero-content" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 className="hero-title font-display" style={{ color: 'var(--color-sol)', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', maxWidth: '800px', margin: '0 auto', textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
            La Historia de Cumpeo
          </h1>
          <p className="hero-desc" style={{ maxWidth: '600px', margin: '16px auto 0', fontSize: '1.2rem', color: '#f8f9fa', textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
            De las páginas de una historieta a un destino turístico vibrante y lleno de humor chileno.
          </p>
        </div>
      </section>

      {/* ── CONTENIDO PRINCIPAL ─────── */}
      <main className="container" style={{ position: 'relative', zIndex: 10, marginTop: '-40px' }}>
        
        {/* EL ORIGEN (Dos Columnas) */}
        <section style={{ 
          background: 'var(--color-surface)',
          padding: '48px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          border: '1px solid var(--color-border)',
          marginBottom: '64px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          alignItems: 'center'
        }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '24px', color: 'var(--color-sol)' }}>El Único Pueblo Real</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--color-text)', marginBottom: '16px', fontSize: '1.05rem' }}>
              En el vasto universo creado por el caricaturista René Ríos Boettiger, más conocido como <strong>Pepo</strong>, existen lugares míticos como <em>Pelotillehue</em> (hogar de Condorito) y <em>Buenas Peras</em> (el pueblo rival).
            </p>
            <p style={{ lineHeight: 1.8, color: 'var(--color-text)', marginBottom: '24px', fontSize: '1.05rem' }}>
              Sin embargo, <strong>Cumpeo</strong>, una pintoresca localidad de la comuna de Río Claro en la Región del Maule, tiene un honor exclusivo: es el <strong>único pueblo mencionado en la revista que existe en la vida real</strong>. Condorito a menudo leía el diario "El Hocicón", que ocasionalmente traía noticias de nuestro querido Cumpeo.
            </p>
            <blockquote style={{ 
              borderLeft: '4px solid var(--color-sol)', 
              paddingLeft: '20px', 
              fontStyle: 'italic',
              color: 'var(--color-text-muted)',
              fontSize: '1.1rem'
            }}>
              "¡Exijo una explicación! ¿Cómo es que Cumpeo es real y Pelotillehue no?"
            </blockquote>
          </div>
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '100%', minHeight: '350px', background: 'var(--color-surface-soft)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
             <img src="/assets/images/condorito-oficial.png" alt="Pepo y Condorito" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
             <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'rgba(0,0,0,0.7)', fontSize: '0.85rem', color: 'white', textAlign: 'center' }}>
               Condorito, el ciudadano ilustre.
             </div>
          </div>
        </section>

        {/* LÍNEA DE TIEMPO */}
        <section style={{ marginBottom: '64px' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="section-title">La Ruta Hacia la Tematización</h2>
            <div className="section-subtitle">Hitos clave en la historia de nuestro turismo</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
            {[
              { year: '1949', title: 'Nace Condorito', desc: 'Pepo publica la primera historieta de Condorito, mencionando a Cumpeo como parte de su peculiar geografía.', icon: '🦅' },
              { year: '2012', title: 'La Idea Despega', desc: 'Las autoridades locales y emprendedores de Río Claro deciden transformar a Cumpeo en un pueblo temático oficial.', icon: '💡' },
              { year: '2015', title: 'Inauguración Comercial', desc: 'Abren sus puertas los primeros locales temáticos oficiales como "El Pollo Farsante" y la farmacia "Sin Remedio".', icon: '🏪' },
              { year: 'Actualidad', title: 'Destino Nacional', desc: 'Cumpeo se consolida como una parada turística obligatoria en la Región del Maule, atrayendo a nostálgicos y nuevas generaciones.', icon: '🌟' }
            ].map((hito, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                gap: '24px',
                background: 'var(--color-surface)',
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-surface-soft)',
                alignItems: 'flex-start'
              }}>
                <div style={{ 
                  background: 'var(--color-sol)', 
                  color: 'var(--color-background)',
                  fontWeight: 'bold',
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1.2rem',
                  minWidth: '100px',
                  textAlign: 'center'
                }}>
                  {hito.year}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hito.icon} {hito.title}
                  </h3>
                  <p className="text-muted" style={{ margin: 0, lineHeight: 1.6 }}>{hito.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CURIOSIDADES */}
        <section style={{ 
          background: 'var(--color-surface)', 
          padding: '48px', 
          borderRadius: 'var(--radius-xl)',
          marginBottom: '64px'
        }}>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '32px' }}>¿Sabías que...? 🤔</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div style={{ padding: '24px', background: 'var(--color-background)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-rojo)' }}>
              <h4 style={{ color: 'var(--color-rojo)', marginBottom: '8px' }}>Cerveza Oficial</h4>
              <p className="text-muted" style={{ fontSize: '0.95rem' }}>Cumpeo tiene su propia cerveza artesanal llamada "Tome Pin y Haga Pun", tal como el letrero clásico de la historieta.</p>
            </div>
            
            <div style={{ padding: '24px', background: 'var(--color-background)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-cielo)' }}>
              <h4 style={{ color: 'var(--color-cielo)', marginBottom: '8px' }}>Garganta de Lata</h4>
              <p className="text-muted" style={{ fontSize: '0.95rem' }}>El bar del pueblo está diseñado exactamente igual al bar donde Condorito y sus amigos se juntaban a tomar.</p>
            </div>
            
            <div style={{ padding: '24px', background: 'var(--color-background)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-verde)' }}>
              <h4 style={{ color: 'var(--color-verde)', marginBottom: '8px' }}>Licencia Oficial</h4>
              <p className="text-muted" style={{ fontSize: '0.95rem' }}>Toda la tematización del pueblo se hizo con la autorización legal de los dueños de los derechos de Condorito.</p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '16px' }}>¿Listo para vivir la historieta?</h2>
          <p className="text-muted" style={{ marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px', fontSize: '1.1rem' }}>
            Ven a sacarte una foto con Condorito, tómate un café en "Sin Remedio" y cómete un buen asado en "El Pollo Farsante".
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/#section-destinos" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
              Ver Destinos 🎯
            </Link>
            <Link href="/mapa" className="btn btn-outline" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
              Abrir Mapa GPS 🗺️
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
