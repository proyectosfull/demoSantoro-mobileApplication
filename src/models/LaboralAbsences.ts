
export default class LaboralAbsences {
    razon?: string = undefined;
    descripcion?: string = undefined;
    evidencia?: {
        uri: string;
        name: string;
        type: string;
      } = {
        uri: '',
        name: '',
        type: '',
      };
    inicioVacaciones?: string = undefined;
    finVacaciones?: string = undefined;
}
