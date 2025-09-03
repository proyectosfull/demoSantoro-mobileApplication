import React, { useState, useEffect, useContext } from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Platform, ToastAndroid, PermissionsAndroid, Alert } from 'react-native'; // Agregamos TouchableOpacity
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import Header from '../components/Header';
import { ModalVacations } from '../components/ModalVacations';
import Snackbar from 'react-native-snackbar';
import { useLocation } from '../hooks/UseLocation';
import PreMenuCardOptions from '../components/PreMenuCardOptions';
import NetworkService from '../utils/Conection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModalInternet } from '../components/ModalInternet';
import TrustValueApi from '../network/TrustValueApi';
import UserLogin from '../models/UserLogin';
import axios from 'axios';
import sqLite from 'react-native-sqlite-storage';
import LaboralAbsences from '../models/LaboralAbsences';
import { ModalLogout } from '../components/ModalLogout';
import { PermissionsContext } from '../Context/PermisionContext';
import { format, set } from 'date-fns';
import moment from 'moment-timezone';
import DeviceInfo from 'react-native-device-info';
import PreMenuCardOptions2 from '../components/PreMenuCardOptions2';
import TrustValueApiUrls from '../network/TrustValueApiUrls';
import { check } from 'react-native-permissions';


interface Location {
  latitude: number,
  longitude: number
}

const db = sqLite.openDatabase(
  { name: 'localTV.db', location: 'default' },
  () => { },
  error => { console.log(error) }
);

type Props = StackScreenProps<RootStackParamList, 'PreMenuScreen'>;
export default function PreMenuScreen(props: Props) {
  //abre o cierra el modal de incapacidad
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalDescansoOpen, setIsModalDescansoOpen] = useState(false);
  const { position, getCurrentLocation } = useLocation();
  const permissionsContext = useContext(PermissionsContext);
  const { permissions } = permissionsContext;

  //modal internet
  const [isModalIncOpen, setIsModalIncOpen] = useState(false);
  //modal location
  const [isModalLocOpen, setIsModalLocOpen] = useState(false);
  // almacena la info del localStorage
  const [userDataLocal, setUserDataLocal] = useState<UserLogin>({});
  const [loadingDescanso, setloadingDescanso] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coordDevice, setCoordDevice] = useState<Location>({
    latitude: 0,
    longitude: 0,
  });
  const [limiteAsist, setLimiteAsist] = useState<string | null>('false');
  const [finishDay, setFinishDay] = useState<string | null>('false');
  const [asistCheck, setAsistCheck] = useState<boolean | string | null>();
  const [objectLaboralAbsences, setObjectLaboralAbsences] = useState<LaboralAbsences>({
    razon: '',
    descripcion: '',
    evidencia: {
      uri: '',
      name: '',
      type: '',
    },
  });
  const [horaActual, setHoraActual] = useState('');

  const obtenerFechaHoraUTC = async () => {
    try {
      const respuesta = await fetch('https://worldtimeapi.org/api/ip');
      const datos = await respuesta.json();
      setHoraActual(datos.datetime);
    } catch (error) {
      console.error('Error al obtener la fecha y hora UTC:', error);
      return null;
    }
  };

  //recupera la info del usar del localStorage
  const getLocalUser = async () => {
    NetworkService.init();
    await NetworkService.initAsistencia();
    await NetworkService.isCheckAsist();
    const asist = await AsyncStorage.getItem('asistencia')
    const userInLocal = await AsyncStorage.getItem('username');
    const passInLocal = await AsyncStorage.getItem('password');
    const keyInLocal = await AsyncStorage.getItem('keyphone');
    const lat = await AsyncStorage.getItem('latitude');
    const long = await AsyncStorage.getItem('longitude');
    const lim = await AsyncStorage.getItem('limite');
    const endDay = await AsyncStorage.getItem('finishDay');
    const parsedLat = Number(lat);
    const parsedLong = Number(long);

    setAsistCheck(asist);

    setUserDataLocal({
      username: userInLocal,
      password: passInLocal,
      key_phone: keyInLocal,
    });
    setCoordDevice({
      latitude: parsedLat,
      longitude: parsedLong,
    });
    setLimiteAsist(lim);
    setFinishDay(endDay);
  };

  //funcion para marcar la asistencia
  const checkAsis = async () => {
    const asistencia = await NetworkService.getDataLocally('asistencia');

    if (permissions.locationStatus === 'blocked') {
      Alert.alert(
        'Permisos bloqueados',
        'Para poder enviar tu asistencia es necesario que tengas activados tus permisos de ubicacion, tendrás que activarlos manualmente.',
        [
          {
            text: 'OK',
          },
        ],
        { cancelable: false }
      );
    } else {
      if (NetworkService.isConnected === true && NetworkService.isInternetReacheable) {
        await getCurrentLocation();
        await getLocalUser();
        setLoading(true);
        if (asistencia === true || asistencia === 'true') {
          if (limiteAsist === 'false' && finishDay === 'true') {
            //solo si tiene limitedAttendence 0 puede volver a mandar otra asistencia 
            new TrustValueApi()
              .checkAsistencia(coordDevice, horaActual.replace('T', ' ').substring(0, 19))
              .then(async response => {
                console.log('respuesta')
                console.log(response)
                if (response.status === 401) {
                  new TrustValueApi()
                    .login(userDataLocal)
                    .then(responseLogin => {
                      //si el inicio de sesion es correcto, se guardan los siguientes valores
                      //en el async storage
                      if (responseLogin.data.status !== 0) {
                        AsyncStorage.multiSet([
                          ['logged', 'true'],
                          ['token', 'Bearer ' + responseLogin.data.bearer_token],
                        ]).then(() => {
                          new TrustValueApi()
                            .checkAsistencia(coordDevice, horaActual.replace('T', ' ').substring(0, 19))
                            .then(async responseTwoAsist => {
                              if (
                                responseTwoAsist.status === 200 ||
                                responseTwoAsist.status === 201
                              ) {
                                if (responseTwoAsist.data.status === 0) {
                                  if (Platform.OS === 'android') {
                                    if (responseTwoAsist.data.errors[0] === 'Ya tienes una sesión activa.') {
                                      ToastAndroid.show(
                                        responseTwoAsist.data.errors[0],
                                        ToastAndroid.SHORT,
                                      );
                                    } else {
                                      ToastAndroid.show(
                                        'Debes estar al menos a 300mts de tu sucursal',
                                        ToastAndroid.SHORT,
                                      );
                                    }

                                  } else {
                                    Snackbar.show({
                                      text: responseTwoAsist.data.errors[0],
                                      duration: Snackbar.LENGTH_LONG,
                                      textColor: '#ed7d18',
                                    });
                                  }
                                  setLoading(false)
                                } else {
                                  AsyncStorage.setItem('preMenuCheck', 'true');
                                  AsyncStorage.setItem('finishDay', 'false');
                                  const id = String(response.data.data.id);
                                  AsyncStorage.setItem('idAsistencia', id);
                                  AsyncStorage.setItem('asistencia', 'true');
                                  Snackbar.show({
                                    text: 'Asistencia marcada con exito',
                                    duration: Snackbar.LENGTH_LONG,
                                    textColor: '#ed7d18',
                                  });
                                  props.navigation.navigate('MenuScreen');
                                }
                              } else {
                                Snackbar.show({
                                  text: 'Ocurrio un error interno, intente mas tarde',
                                  duration: Snackbar.LENGTH_LONG,
                                });
                              }
                            })
                            .catch(error => {
                              console.log(error);
                              Snackbar.show({
                                text: 'Ocurrio un error interno, intente mas tarde',
                                duration: Snackbar.LENGTH_LONG,
                              });
                            });
                        });
                      }
                    })
                    .catch(error => {
                      if (axios.isAxiosError(error)) {
                        if (error.response) {
                          Snackbar.show({
                            text: 'Ocurrio un error interno, intente mas tarde',
                            duration: Snackbar.LENGTH_LONG,
                            textColor: '#ed7d18',
                          });
                        }
                      }
                    });
                } else {
                  if (response.status === 200 || response.status === 201) {
                    if (response.data.status === 0) {
                      setLoading(false);
                      if (Platform.OS === 'android') {
                        if (response.data.errors[0] === 'Ya tienes una sesión activa.') {
                          ToastAndroid.show(
                            response.data.errors[0],
                            ToastAndroid.SHORT,
                          );
                        } else {
                          ToastAndroid.show(
                            'Debes estar al menos a 300mts de tu sucursal',
                            ToastAndroid.SHORT,
                          );
                        }
                      } else {
                        Snackbar.show({
                          text: response.data.errors[0],
                          duration: Snackbar.LENGTH_LONG,
                          textColor: '#ed7d18',
                        });
                      }
                      setLoading(false)
                    } else {
                      setLoading(false);
                      AsyncStorage.setItem('preMenuCheck', 'true');
                      AsyncStorage.setItem('finishDay', 'false');
                      const id = String(response.data.data.id);
                      AsyncStorage.setItem('idAsistencia', id);
                      AsyncStorage.setItem('asistencia', 'true');
                      Snackbar.show({
                        text: 'Nueva Asistencia marcada con exito',
                        duration: Snackbar.LENGTH_LONG,
                        textColor: '#ed7d18',
                      });
                      props.navigation.navigate('MenuScreen');
                    }
                  } else {
                    Snackbar.show({
                      text: 'Ocurrio un error interno, intente mas tarde',
                      duration: Snackbar.LENGTH_LONG,
                    });
                  }
                }
              })
              .catch(error => {
                setLoading(false)
                console.log(error);
                Snackbar.show({
                  text: 'Ocurrio un error intenta de nuevo',
                  duration: Snackbar.LENGTH_LONG,
                });
              });
          } else {
            setLoading(false);
            Snackbar.show({
              text: 'La asistencia ya fue marcada el dia de hoy, continue su navegacion',
              duration: Snackbar.LENGTH_LONG,
              textColor: '#ed7d18',
            });
            props.navigation.navigate('MenuScreen');
          }
        } else {
          new TrustValueApi()
            .checkAsistencia(coordDevice, horaActual.replace('T', ' ').substring(0, 19))
            .then(async response => {
              if (response.status === 401) {
                new TrustValueApi()
                  .login(userDataLocal)
                  .then(responseLogin => {
                    //si el inicio de sesion es correcto, se guardan los siguientes valores
                    //en el async storage
                    if (responseLogin.data.status !== 0) {
                      AsyncStorage.multiSet([
                        ['logged', 'true'],
                        ['token', 'Bearer ' + responseLogin.data.bearer_token],
                      ]).then(() => {
                        new TrustValueApi()
                          .checkAsistencia(coordDevice, horaActual.replace('T', ' ').substring(0, 19))
                          .then(async responseTwoAsist => {
                            if (
                              responseTwoAsist.status === 200 ||
                              responseTwoAsist.status === 201
                            ) {
                              if (responseTwoAsist.data.status === 0) {
                                if (Platform.OS === 'android') {
                                  if (responseTwoAsist.data.errors[0] === 'Ya tienes una sesión activa.') {
                                    ToastAndroid.show(
                                      responseTwoAsist.data.errors[0],
                                      ToastAndroid.SHORT,
                                    );
                                  } else {
                                    ToastAndroid.show(
                                      'Debes estar al menos a 300mts de tu sucursal',
                                      ToastAndroid.SHORT,
                                    );
                                  }
                                } else {
                                  Snackbar.show({
                                    text: responseTwoAsist.data.errors[0],
                                    duration: Snackbar.LENGTH_LONG,
                                    textColor: '#ed7d18',
                                  });
                                }
                                setLoading(false)
                              } else {
                                AsyncStorage.setItem('preMenuCheck', 'true');
                                AsyncStorage.setItem('finishDay', 'false');
                                const id = String(response.data.data.id);
                                AsyncStorage.setItem('idAsistencia', id);
                                AsyncStorage.setItem('asistencia', 'true');
                                Snackbar.show({
                                  text: 'Asistencia marcada con exito',
                                  duration: Snackbar.LENGTH_LONG,
                                  textColor: '#ed7d18',
                                });
                                props.navigation.navigate('MenuScreen');
                              }
                            } else {
                              Snackbar.show({
                                text: 'Ocurrio un error interno, intente mas tarde',
                                duration: Snackbar.LENGTH_LONG,
                              });
                            }
                          })
                          .catch(error => {
                            console.log(error);
                            Snackbar.show({
                              text: 'Ocurrio un error interno, intente mas tarde',
                              duration: Snackbar.LENGTH_LONG,
                            });
                          });
                      });
                    }
                  })
                  .catch(error => {
                    console.log('El error es' + error);
                    if (axios.isAxiosError(error)) {
                      if (error.response) {
                        Snackbar.show({
                          text: 'Ocurrio un error interno, intente mas tarde',
                          duration: Snackbar.LENGTH_LONG,
                          textColor: '#ed7d18',
                        });
                      }
                    }
                  });
              } else {
                if (response.status === 200 || response.status === 201) {
                  if (response.data.status === 0) {
                    if (Platform.OS === 'android') {
                      if (response.data.errors[0] === 'Ya tienes una sesión activa.') {
                        ToastAndroid.show(
                          response.data.errors[0],
                          ToastAndroid.SHORT,
                        );
                      } else {
                        ToastAndroid.show(
                          'Debes estar al menos a 300mts de tu sucursal',
                          ToastAndroid.SHORT,
                        );
                      }
                    } else {
                      Snackbar.show({
                        text: response.data.errors[0],
                        duration: Snackbar.LENGTH_LONG,
                        textColor: '#ed7d18',
                      });
                    }
                    setLoading(false)
                  } else {
                    setLoading(false);
                    AsyncStorage.setItem('preMenuCheck', 'true');
                    AsyncStorage.setItem('finishDay', 'false');
                    const id = String(response.data.data.id);
                    AsyncStorage.setItem('idAsistencia', id);
                    AsyncStorage.setItem('asistencia', 'true');
                    Snackbar.show({
                      text: 'Asistencia marcada con exito',
                      duration: Snackbar.LENGTH_LONG,
                      textColor: '#ed7d18',
                    });
                    props.navigation.navigate('MenuScreen');
                  }
                } else {
                  Snackbar.show({
                    text: 'Ocurrio un error interno, intente mas tarde',
                    duration: Snackbar.LENGTH_LONG,
                  });
                }
              }
            })
            .catch(error => {
              console.log(error);
              Snackbar.show({
                text: 'Ocurrio un error intenta de nuevo',
                duration: Snackbar.LENGTH_LONG,
              });
            });
        }
      } else {
        if (asistencia === true || asistencia === 'true') {
          Snackbar.show({
            text: 'La asistencia ya fue marcada el dia de hoy, continue su navegacion, aunque no tenga conexion',
            duration: Snackbar.LENGTH_LONG,
            textColor: '#ed7d18',
          });
          props.navigation.navigate('MenuScreen');
        } else {
          // La asistencia está marcada como falsa o no existe
          setIsModalIncOpen(true);
        }
      }
    }
  };

  useEffect(() => {
    getLocalUser();
  }, []);

  useEffect(() => {
    obtenerFechaHoraUTC();
  }, []);

  useEffect(() => {
    const unsubscribeFocus = props.navigation.addListener('focus', async () => {
      NetworkService.init();
      // Esto se ejecutará cada vez que la pantalla A obtenga el foco
      const endDay = await AsyncStorage.getItem('finishDay');
      setFinishDay(endDay);
      // Realiza aquí las acciones necesarias para actualizar la pantalla A
    });

    return () => {
      unsubscribeFocus();
    };
  }, [props.navigation]);



  return (
    <View style={styles.container}>
      
      <Header texto="Asistencia" />
      {loading ? (
        <View style={styles.containerIndicatorAsist}>
          <ActivityIndicator size={50} color="#ed7d18" />
        </View>
      ) : (
        <TouchableOpacity
          style={styles.containerImageAsist}
          disabled={loading}
          onPress={async () => {
            setLoading(true);

            try {
               // 1) Estado de asistencia
              const asistencia = await AsyncStorage.getItem('asistencia');
              const finish     = await AsyncStorage.getItem('finishDay');
              const limiteAsist = await AsyncStorage.getItem('limite'); 

              // Si el usuario es limitado 
              if (asistencia === 'true' && finish === 'true' && limiteAsist === 'true') {
                setLoading(false);
                // Mensaje
                if (Platform.OS === 'android') {
                  ToastAndroid.show(
                    'Ya marcaste tu asistencia hoy. Intenta de nuevo mañana.',
                    ToastAndroid.LONG,
                  );
                }
                return; 
              }

              // 2) Geolocalización
              const currentPosition = await getCurrentLocation();
              const latitude  = currentPosition?.latitude;
              const longitude = currentPosition?.longitude;

              if (
                latitude  == null ||
                longitude == null ||
                isNaN(latitude) ||
                isNaN(longitude)
              ) {
                setLoading(false);
                Snackbar.show({
                  text: 'No se pudo obtener tu ubicación actual',
                  duration: Snackbar.LENGTH_LONG,
                  textColor: '#ed7d18'
                });
                return;
              }

              // 3) Petición de sucursales por geolocalización
              const token    = await AsyncStorage.getItem('token');
              const response = await axios.post(
                TrustValueApiUrls.BRANCH_OFFICES_BY_GEOLOCATION,
                { latitude: String(latitude), longitude: String(longitude) },
                { headers: { Authorization: token || '' } }
              );

              const tiendas: any[] =
                response.data.status === 1
                  ? response.data.data
                  : [];

              if (tiendas.length === 0) {
                setLoading(false);
                Snackbar.show({
                  text: 'No se encontraron sucursales cercanas',
                  duration: Snackbar.LENGTH_LONG,
                  textColor: '#ed7d18'
                });
                return;
              }

              // 4) Si hay asistencia pendiente, rama “fin de jornada”
              if (asistencia === 'true' && finish === 'false') {
                setLoading(false);

                if (tiendas.length === 1) {
                  // Un solo sitio → directo a MenuScreen
                  props.navigation.navigate('MenuScreen');
                } else {
                  // Varios sitios → selección de tienda para finalizar
                  props.navigation.navigate('SeleccionarTiendaScreen', {
                    tiendas,
                    latitude,
                    longitude
                  });
                }
                return;
              }

              if (tiendas.length === 1 && limiteAsist === 'false') {
                await checkAsis();
                return; 
              }


              // 5) Nuevo registro de asistencia → siempre selección de tienda
              setLoading(false);
              props.navigation.navigate('SeleccionarTiendaScreen', {
                tiendas,
                latitude,
                longitude
              });

            } catch (error) {
              setLoading(false);
              console.log('Error al obtener sucursales:', error);
              Snackbar.show({
                text: 'Error al obtener sucursales',
                duration: Snackbar.LENGTH_LONG,
                textColor: '#ed7d18'
              });
            }
          }}
        >
          <Image
            style={styles.imageAsist}
            source={require('../assets/check.gif')}
          />
        </TouchableOpacity>
      )}

      <View style={styles.textContainer}>
        <Text style={styles.textStyle}>Asistencia</Text>
      </View>

      <View style={styles.containerPosition}>
        <View style={styles.containerMenuAsis}> 
            
              <TouchableOpacity 
                onPress={() => props.navigation.navigate('MenuScreen')}
                disabled={false}
                activeOpacity={0.7}
              >

                <PreMenuCardOptions2
                  iconName={require('../assets/navigate.png')}
                  name="Navegar"
                  blocked={false}
                />
              </TouchableOpacity>
            
        </View>
      </View>

      <ModalInternet
        isModalOpen={isModalIncOpen}
        setIsModalOpen={setIsModalIncOpen}
        iconName="wifi-off"
        title="Sin Internet"
        description="No tiene conexion a internet, se enviara la asistencia cuando se reestablezca la conexion"
      />
      <ModalInternet
        isModalOpen={isModalLocOpen}
        setIsModalOpen={setIsModalLocOpen}
        iconName="map-marker-off"
        title="Fuera de Rango"
        description="No se puede registrar la petición, estas fuera del rango de tu sucursal"
      />
      <ModalLogout
        isModalOpen={isModalDescansoOpen}
        setIsModalOpen={setIsModalDescansoOpen}
        section='preMenu'
        nav={props.navigation}
        title="Enviar Descanso"
        description="¿Estas seguro que quieres enviar tu descanso?"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  containerImageAsist: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    height: '35%',
    marginTop: '15%',  // ests es para la imagen de asistencia
  },

  imageAsist: {
    width: 280,
    height: 280,
  },

  textContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: '-5%', // espacio de asistencia 
  },

  textStyle: {
    color: '#ed7d18',
    fontSize: 36,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },

  containerPosition: {
    marginTop: 10,
    width: '104%',
    paddingHorizontal: 50,
  },

  containerMenuAsis: {
    flexDirection: 'column',
    width: '100%',
    height: '40%',
    justifyContent: 'center',
    marginTop: '20%',
  },
  containerIndicator: {
    width: '100%',
    alignItems: 'center',
    marginTop: '100%',
  },

  containerIndicatorAsist: {
    width: '100%',
    alignItems: 'center',
    marginTop: '50%',
    marginBottom: '30%',
  },

  onlyButtonRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },

});