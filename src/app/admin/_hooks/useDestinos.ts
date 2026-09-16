import { Destination } from '@/lib/types';
import { saveDestination, deleteDestination } from '../actions';
import { HookOptions } from '../_types';
import { CENTRO_CUMPEO } from '@/lib/constants';
import { useFichaCrud } from './useFichaCrud';

const destinoVacio = (): Partial<Destination> => ({
  nombre: '',
  slug: '',
  categoria: 'cultural',
  descripcionCorta: '',
  descripcionLarga: '',
  historia: '',
  coordenadas: { ...CENTRO_CUMPEO },
  direccion: '',
  horario: '',
  duracionVisita: '',
  comoLlegar: '',
  tags: [],
  destacado: false,
  imagenPrincipal: '',
  galeria: [],
});

/** CRUD de destinos en el panel. La mecánica vive en useFichaCrud. */
export function useDestinos(initial: Destination[], opciones: HookOptions) {
  const crud = useFichaCrud<Destination>(
    initial,
    {
      nueva: destinoVacio,
      guardar: saveDestination,
      eliminar: deleteDestination,
      etiqueta: 'destino',
      desdeFila: (fila) => ({ ...fila, coordenadas: fila.coordenadas as any }) as Destination,
    },
    opciones
  );

  return { ...crud, destinos: crud.items, setDestinos: crud.setItems };
}
