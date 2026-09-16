/**
 * Resultado de un server action.
 *
 * Por qué existe: Next.js reemplaza el mensaje de cualquier excepción no
 * capturada de un server action por uno genérico con digest cuando corre en
 * producción, para no filtrar detalles del servidor al navegador. El panel, en
 * cambio, decidía qué hacer leyendo ese mensaje:
 *
 *     if (err.message.includes('No autorizado')) mostrarSesionExpirada();
 *     showToast(`Error: ${err.message}`);
 *
 * En el hosting real eso nunca se cumple: el modal de sesión vencida no
 * aparecía jamás y al funcionario municipal le salía "An error occurred in the
 * Server Components render" en vez de un aviso en español. Peor aún, es
 * invisible en desarrollo, donde el mensaje sí llega entero.
 *
 * La regla, entonces: los errores ESPERADOS —sin sesión, rol insuficiente,
 * datos inválidos, registro no encontrado— son parte del contrato de la acción
 * y se devuelven como valor. Las excepciones quedan para las fallas genuinas
 * (la base caída, un bug), donde el mensaje genérico de Next sí es lo correcto
 * y lo que importa es el log del servidor.
 */

export type CodigoError =
  /** No hay sesión, o venció. El panel debe pedir volver a entrar. */
  | 'NO_AUTORIZADO'
  /** Hay sesión, pero el rol no alcanza para esta acción. */
  | 'ROL_INSUFICIENTE'
  /** La sesión usa una contraseña temporal que todavía no se cambia. */
  | 'CAMBIO_CLAVE_PENDIENTE'
  /** Los datos que llegaron no pasan las reglas del formulario. */
  | 'VALIDACION'
  /** El registro al que apunta la acción ya no está. */
  | 'NO_ENCONTRADO'
  /** La acción chocaría con algo que ya existe. */
  | 'CONFLICTO';

export interface ResultadoOk<T> {
  ok: true;
  data: T;
}

export interface ResultadoError {
  ok: false;
  codigo: CodigoError;
  /** Mensaje ya redactado para mostrarle a la persona, en español. */
  mensaje: string;
  /** Errores por campo, para que el formulario marque exactamente qué falta. */
  detalles?: Record<string, string>;
}

export type Resultado<T> = ResultadoOk<T> | ResultadoError;

export function exito<T>(data: T): ResultadoOk<T> {
  return { ok: true, data };
}

export function fallo(
  codigo: CodigoError,
  mensaje: string,
  detalles?: Record<string, string>
): ResultadoError {
  return { ok: false, codigo, mensaje, detalles };
}

/**
 * Los tres códigos que significan "esta sesión ya no sirve". El panel los trata
 * distinto del resto: en vez de un aviso pasajero, abre la pantalla de volver a
 * iniciar sesión.
 */
const CODIGOS_DE_SESION: CodigoError[] = [
  'NO_AUTORIZADO',
  'ROL_INSUFICIENTE',
  'CAMBIO_CLAVE_PENDIENTE',
];

export function esProblemaDeSesion(resultado: ResultadoError): boolean {
  return CODIGOS_DE_SESION.includes(resultado.codigo);
}
