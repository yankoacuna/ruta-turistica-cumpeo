import React, { useState } from 'react';
import { Copy, Check, KeyRound, AlertTriangle } from 'lucide-react';
import { ModalWrapper } from '../ModalWrapper';

interface GeneratedPasswordModalProps {
  nombre: string;
  email: string;
  password: string;
  onClose: () => void;
}

/**
 * Se muestra una sola vez, justo después de crear un usuario (o resetear su
 * clave): el admin no elige la contraseña, así que esta es la única
 * oportunidad de verla para copiarla y entregársela a la persona.
 */
export function GeneratedPasswordModal({ nombre, email, password, onClose }: GeneratedPasswordModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles, la clave sigue visible para copiarla a mano.
    }
  };

  return (
    <ModalWrapper title="Contraseña temporal generada" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary leading-relaxed">
          Se creó el acceso de <strong>{nombre}</strong> ({email}) con esta contraseña temporal.
          Cópiala y entrégasela de forma segura — no queda guardada en ningún lugar visible, y
          el sistema le pedirá cambiarla apenas inicie sesión.
        </p>

        <div className="flex items-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-rojo/40 bg-[#FFF5F5]">
          <KeyRound size={18} className="text-rojo shrink-0" />
          <code className="flex-1 text-base font-bold tracking-wide text-text-primary select-all">
            {password}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1E1E24] hover:bg-black text-white transition-all cursor-pointer shrink-0"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiada' : 'Copiar'}
          </button>
        </div>

        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>Al cerrar esta ventana no podrás volver a ver esta contraseña. Si se pierde, deberás resetearla desde la ficha del usuario.</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-1 w-full py-3 rounded-xl font-bold bg-rojo text-white hover:bg-rojo-dark transition-all cursor-pointer"
        >
          Ya la copié, cerrar
        </button>
      </div>
    </ModalWrapper>
  );
}
