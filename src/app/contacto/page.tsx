'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulamos un retraso de red para dar feedback visual
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });
      
      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* ── HERO SECTION ─────── */}
      <section className="hero" style={{ height: '40vh', minHeight: '300px' }} aria-label="Contacto Cumpeo">
        <img
          className="hero-img"
          src="/assets/images/placeholder.webp" // Idealmente una foto de la plaza o algo acogedor
          alt="Contacto Cumpeo"
          style={{ opacity: 0.6 }}
        />
        <div className="hero-overlay" style={{ background: `linear-gradient(to bottom, rgba(30, 30, 36, 0.4), rgba(30, 30, 36, 0.9))` }}></div>

        <div className="hero-content" style={{ paddingTop: '60px' }}>
          <h1 className="hero-title font-display" style={{ color: 'var(--color-sol)' }}>
            ¡Escríbenos, no te quedes plop!
          </h1>
          <p className="hero-desc">
            ¿Tienes dudas sobre cómo llegar, dónde alojar o qué comer? Nuestro equipo de turismo está listo para ayudarte.
          </p>
        </div>
      </section>

      {/* ── CONTACT CONTENT ─────── */}
      <main className="container" style={{ position: 'relative', zIndex: 10, marginTop: '-40px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px',
          background: 'var(--color-surface)',
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          border: '1px solid var(--color-border)'
        }}>
          
          {/* Lado Izquierdo: Info de Contacto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2 className="font-display" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Información Turística</h2>
              <p className="text-muted">La oficina central de turismo de Cumpeo te espera con los brazos abiertos.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.5rem', background: 'var(--color-surface-soft)', padding: '12px', borderRadius: '50%' }}>📍</div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>Dirección Oficial</h4>
                  <p className="text-muted" style={{ margin: 0 }}>Plaza de Armas S/N, Cumpeo.<br/>Comuna de Río Claro, Región del Maule.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.5rem', background: 'var(--color-surface-soft)', padding: '12px', borderRadius: '50%' }}>📞</div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>Teléfono</h4>
                  <p className="text-muted" style={{ margin: 0 }}>+56 71 2 XXX XXX</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.5rem', background: 'var(--color-surface-soft)', padding: '12px', borderRadius: '50%' }}>✉️</div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>Correo Electrónico</h4>
                  <p className="text-muted" style={{ margin: 0 }}>turismo@cumpeo.cl</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>Síguenos en Redes Sociales</h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Fake social buttons */}
                <a href="#" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E1306C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>IG</a>
                <a href="#" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#4267B2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>FB</a>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Formulario */}
          <div style={{ background: 'var(--color-surface-soft)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 className="font-display" style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Envíanos un Mensaje</h3>
            
            {isSuccess ? (
              <div style={{ background: 'rgba(72, 187, 120, 0.1)', border: '1px solid #48BB78', padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
                <h4 style={{ color: '#48BB78', marginBottom: '8px' }}>¡Mensaje enviado con éxito!</h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Gracias por contactarnos. Te responderemos más rápido de lo que canta un gallo.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="nombre" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>Tu Nombre</label>
                  <input 
                    type="text" 
                    id="nombre" 
                    name="nombre" 
                    required 
                    value={formData.nombre}
                    onChange={handleChange}
                    style={{ padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'white' }}
                    placeholder="Ej. Washington"
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="email" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>Correo Electrónico</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    value={formData.email}
                    onChange={handleChange}
                    style={{ padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'white' }}
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="asunto" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>¿Sobre qué nos escribes?</label>
                  <select 
                    id="asunto" 
                    name="asunto" 
                    value={formData.asunto}
                    onChange={handleChange}
                    style={{ padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'white' }}
                  >
                    <option value="">Selecciona un asunto...</option>
                    <option value="tours">Información de Tours</option>
                    <option value="alojamiento">Ayuda con Alojamiento</option>
                    <option value="eventos">Eventos Próximos</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="mensaje" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>Mensaje</label>
                  <textarea 
                    id="mensaje" 
                    name="mensaje" 
                    rows={4} 
                    required 
                    value={formData.mensaje}
                    onChange={handleChange}
                    style={{ padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'white', resize: 'vertical' }}
                    placeholder="Escribe tus dudas aquí..."
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ marginTop: '8px', padding: '14px', width: '100%', fontSize: '1rem', display: 'flex', justifyContent: 'center', opacity: isSubmitting ? 0.7 : 1 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando mensaje...' : 'Enviar Mensaje 📬'}
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
