import { CumpeoEvent, Coordinates } from '@/lib/types';
import { saveEvent, deleteEvent } from '../actions';
import { HookOptions } from '../_types';
import { CENTRO_CUMPEO } from '@/lib/constants';
import { useFichaCrud } from './useFichaCrud';

const eventoVacio = (): Partial<CumpeoEvent> => ({
  nombre: '',
  tipo: 'cultural',
  descripcion: '',
  descripcionLarga: '',
  fecha: '',
  recurrente: true,
  coordenadas: { ...CENTRO_CUMPEO },
  direccion: '',
  imagenPrincipal: '',
  galeria: [],
  tags: [],
  destacado: false,
  activo: true,
});

/** CRUD de eventos en el panel. La mecánica vive en useFichaCrud. */
export function useEventos(initial: CumpeoEvent[], opciones: HookOptions) {
  const crud = useFichaCrud<CumpeoEvent>(
    initial,
    {
      nueva: eventoVacio,
      guardar: saveEvent,
      eliminar: deleteEvent,
      etiqueta: 'evento',
      desdeFila: (fila) =>
        ({
          ...fila,
          coordenadas: fila.coordenadas as unknown as Coordinates,
          galeria: fila.galeria as string[],
          tags: fila.tags as string[],
        }) as unknown as CumpeoEvent,
    },
    opciones
  );

  return { ...crud, eventos: crud.items, setEventos: crud.setItems };
}
