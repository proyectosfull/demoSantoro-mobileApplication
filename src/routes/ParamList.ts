
export type RootStackParamList = {
    LoginScreen: undefined;
    UserInfoScreen: undefined;
    PreMenuScreen: undefined;
    SeleccionarTiendaScreen: {
      tiendas: Array<{
        id: number;
        latitude: string;
        longitude: string;
        name: string;
        region: string | null;
      }>;
      latitude: number;
      longitude: number;
    };
    MenuScreen: undefined | { 
      tiendaId?: number; 
      pending?: boolean; 
      justRegistered?: boolean;
    };
    FichasScreen: undefined;
    MarcasDataScreen: undefined;
    ProductMarcaDataScreen: { ficha: any };
    EvaluacionesScreen: undefined;
    ComunicadosScreen: undefined;
    ComunicadoDetailScreen: { comunicado: any };
    SimuladorScreen: undefined;
    PermissionsScreen: undefined;
    EvidenciasScreen: undefined;
    SplashScreen: undefined;
    SendDataLocalScreen: undefined;
    ViewPdf: {multimedia: string};
    EncuestasScreen: undefined;
    EncuestaResolveScreen: { encuesta: any };
    EvaluacionResolveScreen: { evaluacion: any };
    VerReportesSimulador: {urlPdf: string|undefined};
  };

