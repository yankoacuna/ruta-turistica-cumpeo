import { Restaurant } from '@/lib/types';
import { saveRestaurant, deleteRestaurant } from '../actions';
import { HookOptions } from '../_types';
import { CENTRO_CUMPEO } from '@/lib/constants';
import { useFichaCrud } from './useFichaCrud';

const restauranteVacio = (): Partial<Restaurant> => ({
  nombre: '',
  descripcion: '',
  especialidad: '',
  coordenadas: { ...CENTRO_CUMPEO },
  direccion: '',
  horario: { apertura: '', cierre: '', descripcion: '' },
  contacto: { telefono: '', whatsapp: '', email: '', web: '', instagram: '', facebook: '' },
  imagenPrincipal: '',
  menuUrl: '',
  tags: [],
});

/** CRUD de restaurantes en el panel. La mecánica vive en useFichaCrud. */
export function useRestaurantes(initial: Restaurant[], opciones: HookOptions) {
  const crud = useFichaCrud<Restaurant>(
    initial,
    {
      nueva: restauranteVacio,
      guardar: saveRestaurant,
      eliminar: deleteRestaurant,
      etiqueta: 'restaurante',
      desdeFila: (fila) =>
        ({
          ...fila,
          coordenadas: fila.coordenadas as any,
          horario: fila.horario as any,
          contacto: fila.contacto as any,
        }) as Restaurant,
    },
    opciones
  );

  return { ...crud, restaurantes: crud.items, setRestaurantes: crud.setItems };
}
