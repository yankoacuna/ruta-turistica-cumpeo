import { Accommodation } from '@/lib/types';
import { saveAccommodation, deleteAccommodation } from '../actions';
import { HookOptions } from '../_types';
import { CENTRO_CUMPEO } from '@/lib/constants';
import { useFichaCrud } from './useFichaCrud';

const alojamientoVacio = (): Partial<Accommodation> => ({
  nombre: '',
  tipo: '',
  descripcion: '',
  coordenadas: { ...CENTRO_CUMPEO },
  direccion: '',
  servicios: [],
  imagenPrincipal: '',
  contacto: { telefono: '', whatsapp: '', email: '', web: '', instagram: '', facebook: '' },
});

/** CRUD de alojamientos en el panel. La mecánica vive en useFichaCrud. */
export function useAlojamientos(initial: Accommodation[], opciones: HookOptions) {
  const crud = useFichaCrud<Accommodation>(
    initial,
    {
      nueva: alojamientoVacio,
      guardar: saveAccommodation,
      eliminar: deleteAccommodation,
      etiqueta: 'alojamiento',
      desdeFila: (fila) =>
        ({
          ...fila,
          coordenadas: fila.coordenadas as any,
          contacto: fila.contacto as any,
        }) as Accommodation,
    },
    opciones
  );

  return { ...crud, alojamientos: crud.items, setAlojamientos: crud.setItems };
}
