/**
 * Resultado de un server action.
 *
 * Los errores esperados —sin sesión, rol insuficiente, clave temporal sin
 * cambiar, datos inválidos, registro inexistente— son parte del contrato de la
 * acción y se devuelven como valor, con un código que el panel puede leer.
 *
 * No se comunican lanzando: en producción Next reemplaza el mensaje de una
 * excepción de server action por uno genérico con digest, de modo que el
 * navegador no recibe nada con que distinguir un caso de otro. Las excepciones
 * quedan para las fallas genuinas, donde lo que importa es el log del servidor.
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
 * Códigos que significan que la sesión ya no sirve. El panel los trata distinto
 * del resto: abre la pantalla de inicio de sesión en vez de un aviso pasajero.
 */
const CODIGOS_DE_SESION: CodigoError[] = [
  'NO_AUTORIZADO',
  'ROL_INSUFICIENTE',
  'CAMBIO_CLAVE_PENDIENTE',
];

export function esProblemaDeSesion(resultado: ResultadoError): boolean {
  return CODIGOS_DE_SESION.includes(resultado.codigo);
}
