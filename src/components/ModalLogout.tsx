import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text, Platform, ToastAndroid, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { Modal } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import { Button, IconButton } from 'react-native-paper';
import Snackbar from 'react-native-snackbar';
import NetworkService from '../utils/Conection';
import TrustValueApi from '../network/TrustValueApi';
import { ModalInternet } from './ModalInternet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationCoords from '../models/LocationCoords';
import UserLogin from '../models/UserLogin';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLocation } from '../hooks/UseLocation';
import { useFocusEffect } from '@react-navigation/native';
import LaboralAbsences from '../models/LaboralAbsences';
import { Formik } from 'formik';
import * as yup from 'yup';
import TextInputError from './TextInputError';
import { cleanSingle } from 'react-native-image-crop-picker';

interface Options {
  isModalOpen: boolean;
  title: string;
  description: string;
  section?: string;
  setIsModalOpen: any;
  nav?: StackNavigationProp<RootStackParamList, 'MenuScreen' | 'PreMenuScreen' | 'SeleccionarTiendaScreen' | 'UserInfoScreen', undefined>;
  asistenciaIdForLogout?: number; 

  onSubmit?: (piezas: number, abordos: number) => void;
  loading?: boolean;
}

interface Location {
  latitude: number,
  longitude: number
}

const ventaSchema = yup.object().shape({
  venta: yup.string().required('La venta diaria es obligatoria'),
  abordos: yup.string().required('El numero de abordos es obligatorio'),
});


export const ModalLogout = (props: Options) => {
  const [isModalInternetOpen, setIsModalInternetOpen] = useState(false);
  const [isModalLocOpen, setIsModalLocOpen] = useState(false);
  const [userDataLocal, setUserDataLocal] = useState<UserLogin>({});
  const [idAsist, setIdAsist] = useState(0);
  const [loading, setLoading] = useState(false);
  const { hasLocation, position, getCurrentLocation } = useLocation();
  const [coordDevice, setCoordDevice] = useState<Location>({
    latitude: 0,
    longitude: 0,
  });
  const [horaActual, setHoraActual] = useState('');
  const [showImput, setShowInput] = useState(false);
  const [isFocusedVenta, setIsFocusedVenta] = useState(false);
  const [objectLaboralAbsences, setObjectLaboralAbsences] = useState<LaboralAbsences>({
    razon: '',
    descripcion: '',
    evidencia: {
      uri: '',
      name: '',
      type: '',
    },
    inicioVacaciones: '',
    finVacaciones: '',
  });

  const obtenerFechaHoraUTC = async () => {
    try {
      const respuesta = await fetch('https://worldtimeapi.org/api/ip');
      const datos = await respuesta.json();
      console.log(datos.datetime)
      setHoraActual(datos.datetime);
    } catch (error) {
      console.error('Error al obtener la fecha y hora UTC:', error);
      return null;
    }
  };

  const toggleModal = () => {
    props.setIsModalOpen(!props.isModalOpen);
  };

  const handleOutsidePress = () => {
    setShowInput(false);
    if (props.isModalOpen) {
      setShowInput(false);
      toggleModal();
    }
  };

  const handleFocusVenta = () => {
    setIsFocusedVenta(true);
  };

  const handleBlurVenta = () => {
    setIsFocusedVenta(false);
  };

  const getLocalUser = async () => {
    try {
      const { latitude, longitude } = await getCurrentLocation();
      const userInLocal = await AsyncStorage.getItem('username');
      const passInLocal = await AsyncStorage.getItem('password');
      const keyInLocal = await AsyncStorage.getItem('keyphone');
      const idAsistencia = await AsyncStorage.getItem('idAsistencia');
      const parsedIdAsist = Number(idAsistencia);
      setIdAsist(parsedIdAsist);
      setUserDataLocal({
        username: userInLocal,
        password: passInLocal,
        key_phone: keyInLocal,
      });
      setCoordDevice({
        latitude: latitude,
        longitude: longitude,
      });
      await obtenerFechaHoraUTC();
    } catch (error) {
      console.error('Error al obtener idAsist desde AsyncStorage: ', error);
    }
  };


  const sendLaboralAbsence = async () => {
    NetworkService.init();
    if (
      NetworkService.isConnected === true &&
      NetworkService.isInternetReacheable === true
    ) {
      setLoading(true);
      try {
        const updatedObject = { ...objectLaboralAbsences }; 
        updatedObject.razon = 'descanso';
        setObjectLaboralAbsences(updatedObject);
        const auxObjectLaboralAbsence: LaboralAbsences = {
          razon: 'descanso',
          descripcion: '',
          evidencia: {
            uri: '',
            name: '',
            type: '',
          },
          inicioVacaciones: '',
          finVacaciones: '',
        };
        const response = await new TrustValueApi().sendLaboralAbsences(auxObjectLaboralAbsence);
        if (response.status === 200 || response.status === 201) {
          setLoading(false);
          AsyncStorage.setItem('preMenuCheck', 'true');
          AsyncStorage.setItem('absence', 'true');
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              'Su descanso ha sido enviado, continue navegando',
              ToastAndroid.SHORT,
            );
            props.setIsModalOpen(false);
            if (props.nav) {
              props.nav.navigate('MenuScreen');
            }
          } else {
            Snackbar.show({
              text: 'Su descanso ha sido enviado, continue navegando',
              duration: Snackbar.LENGTH_LONG,
              textColor: '#ed7d18',
            });
            props.setIsModalOpen(false);
            if (props.nav) {
              props.nav.navigate('MenuScreen');
            }
          }
        } else {
          console.log(response);
          setLoading(false);
          Snackbar.show({
            text: 'Ocurrió un error interno,cierra sesion e inténtalo más tarde',
            duration: Snackbar.LENGTH_LONG,
          });
        }
      } catch (error) {
        setLoading(false);
        console.log('El error es' + error);
        if (axios.isAxiosError(error)) {
          if (error.response) {
            console.log(error.response);
            Snackbar.show({
              text: 'Ocurrió un error interno, inténtalo más tarde',
              duration: Snackbar.LENGTH_LONG,
              textColor: '#ed7d18',
            });
          }
        }
      }
    } else {
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          'No tiene conexion a una red, intente mas tarde',
          ToastAndroid.SHORT,
        );
      } else {
        Snackbar.show({
          text: 'No tiene conexion a una red, intente mas tarde',
          duration: Snackbar.LENGTH_LONG,
          textColor: '#ed7d18',
        });
      }
    }
  };

  const tryLogout = useCallback(async (piezas: number, abordos: number) => {
    setLoading(true);
    try {
      // Obtener la hora UTC antes de continuar
      await obtenerFechaHoraUTC();
      
      await getLocalUser();
      console.log('piezas en tryLoout ' + piezas)
      console.log('Hora ' + horaActual.replace('T', ' ').substring(0, 19))
      
      NetworkService.init();
      if (NetworkService.isConnected === true && NetworkService.isInternetReacheable) {
        const asistenciaIdFromProps = props.asistenciaIdForLogout ?? null; 
        if(!asistenciaIdFromProps) {
          setLoading(false); 
          // Snackbar.show({
          //   text: 'No se encontro una asistencia pendiente para finalizar', 
          //   duration: Snackbar.LENGTH_LONG,
          //   textColor: '#ed7d18',
          // });
          return; 
        }

        new TrustValueApi()
          .endDay(coordDevice, asistenciaIdFromProps, horaActual.replace('T', ' ').substring(0, 19), piezas, abordos)
          .then(response => {
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
                        .endDay(coordDevice, asistenciaIdFromProps, horaActual.replace('T', ' ').substring(0, 19), piezas, abordos)
                        .then(responseTwoAsist => {
                          if (
                            responseTwoAsist.status === 200 ||
                            responseTwoAsist.status === 201
                          ) {
                            if (responseTwoAsist.data.status === 0) {
                              setIsModalLocOpen(true);
                            } else {
                              AsyncStorage.setItem('finishDay', 'true');
                              AsyncStorage.removeItem('idAsistencia');
                              props.setIsModalOpen(false);
                              if (Platform.OS === 'android') {
                                ToastAndroid.show(
                                  '¡Finalizacion de jornada Correctamente, favor de cerrar sesion',
                                  ToastAndroid.SHORT,
                                );
                                if(props.nav) {
                                  props.nav.navigate('UserInfoScreen');
                                }
                              } else {
                                Snackbar.show({
                                  text: '¡Finalizacion de jornada Correctamente, favor de cerrar sesion',
                                  duration: Snackbar.LENGTH_LONG,
                                  textColor: '#ed7d18',
                                });
                                if(props.nav) {
                                  props.nav.navigate('UserInfoScreen');
                                }
                                
                              }
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
                  } else {
                    console.log('');
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
                console.log(response.data);
                if (response.data.status === 0) {
                  setLoading(false);
                  setIsModalLocOpen(true);
                } else {
                  setLoading(false);
                  AsyncStorage.setItem('finishDay', 'true');
                  AsyncStorage.removeItem('idAsistencia');
                  props.setIsModalOpen(false);
                  if (Platform.OS === 'android') {
                    ToastAndroid.show(
                      '¡Finalización de jornada Correcta, Cierra sesion',
                      ToastAndroid.SHORT,
                    );
                    if(props.nav) {
                      props.nav.navigate('UserInfoScreen');
                    }
                  } else {
                    Snackbar.show({
                      text: '¡Finalización de jornada Correctamente, Cierra sesion',
                      duration: Snackbar.LENGTH_LONG,
                      textColor: '#ed7d18',
                    });
                    if(props.nav) {
                      props.nav.navigate('UserInfoScreen');
                    }
                    
                  }
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
              text: 'Ocurrio un error interno, intente mas tarde',
              duration: Snackbar.LENGTH_LONG,
            });
          });
      } else {
        setIsModalInternetOpen(true);
      }
    } catch (error) {
      setLoading(false);
      Snackbar.show({
        text: 'Error al obtener la hora actual. Intenta de nuevo.',
        duration: Snackbar.LENGTH_LONG,
        textColor: '#ed7d18',
      });
    }
  }, [idAsist, userDataLocal, coordDevice, horaActual]);


  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await getLocalUser(); // Espera a que getLocalUser termine
      };

      fetchData(); // Llama a la función que realiza las operaciones después de obtener los datos
    }, [])
  );

  return (
    <View>
      <Modal
        visible={props.isModalOpen}
        transparent={true}
        animationType={'slide'}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={ Platform.OS === 'ios' ? 40 : 0 }
        >
          <View style={styles.fondo}>
            <View style={showImput === false ? styles.modalCancel : styles.modalCancel2}>
              <View style={{ width: '100%', backgroundColor: '#ed7d18', flexDirection: 'row', height: 40, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, }}>
                <View style={{ width: '50%', paddingHorizontal: 10, justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row' }}>
                  <Text style={{ fontSize: 16, color: '#f2f2f6' }}>{props.title}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleOutsidePress()}
                  style={{
                    width: '50%',
                    height: 40,
                    backgroundColor: '#ed7d18',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    paddingRight: 14,
                    borderBottomRightRadius: 10,
                  }}>
                  <Icon name="close" size={22} color="#f2f2f6" />
                </TouchableOpacity>
              </View>
              {showImput ? (
                <>
                  <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: '3%' }}>
                    <Text style={{ fontSize: 18, color: '#000' }}>¿Cuantas piezas vendiste hoy?</Text>
                  </View>
                  <View>
                    <Formik
                      initialValues={{
                        venta: '',
                        abordos: '', 
                      }}
                      validationSchema={ventaSchema}
                      onSubmit={(values) => {
                        const esNumeroValido = /^\d+$/.test(values.venta);
                        const esNumeroEntero = esNumeroValido && Number.isInteger(parseFloat(values.venta));

                        const esNumeroValidoAbordos = /^\d+$/.test(values.abordos);
                        const esNumeroEnteroAbordos = esNumeroValidoAbordos && Number.isInteger(parseFloat(values.abordos)); 

                        if (esNumeroValido && esNumeroEntero && esNumeroValidoAbordos && esNumeroEnteroAbordos) {
                          setLoading(true);
                          tryLogout(parseInt(values.venta, 10), parseInt(values.abordos, 10));
                        } else {
                          if (Platform.OS === 'android') {
                            ToastAndroid.show(
                              'Ambos campos deben ser números enteros',
                              ToastAndroid.SHORT,
                            );

                          } else {
                            Snackbar.show({
                              text: 'Ambos campos deben ser números enteros',
                              duration: Snackbar.LENGTH_LONG,
                              textColor: '#ed7d18',
                            });

                          }
                        }
                      }}>
                      {({
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        values,
                        touched,
                        errors,
                      }) => (
                        <>
                          <View style={styles.containerForm}>
                            <TextInputError
                              mode="outlined"
                              keyboardType="numeric"
                              textColor="black"
                              label="Ventas de hoy"
                              placeholder="Ventas de hoy "
                              onFocus={handleFocusVenta}
                              style={{
                                ...styles.inputsLogin,
                                borderBottomColor: isFocusedVenta ? '#ed7d18' : '#b1b1b1',
                              }}
                              onChangeText={handleChange('venta')}
                              onBlur={() => {
                                handleBlur('venta');
                                handleBlurVenta();
                              }}
                              value={values.venta}
                              touched={touched.venta}
                              errorMessage={errors.venta}
                            />

                            <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: '3%' }}>
                              <Text style={{ fontSize: 18, color: '#000' }}>¿Cuantas abordos tuviste hoy?</Text>
                            </View>

                            <TextInputError
                              mode="outlined"
                              keyboardType="numeric"
                              textColor="black"
                              label="Número de abordos"
                              placeholder="Número de abordos"
                              style={{
                                ...styles.inputsLogin,
                                borderBottomColor: isFocusedVenta ? '#ed7d18' : '#b1b1b1',
                                marginTop: 10,
                              }}
                              onChangeText={handleChange('abordos')}
                              onBlur={handleBlur('abordos')}
                              value={values.abordos}
                              touched={touched.abordos}
                              errorMessage={errors.abordos}
                            />
                          </View>

                          <View style={styles.containerPositionButton2}>
                            <View style={styles.buttonIconContainer}>
                              <IconButton
                                icon="arrow-left-bold"
                                iconColor="#fff"
                                size={24}
                                onPress={() => setShowInput(false)}
                                style={{ margin: 0 }}
                              />
                            </View>
                            <View style={ styles.buttonSendContainer }>
                              <Button
                              mode="text"
                              onPress={() => {
                                handleSubmit();
                              }}
                              icon="send"
                              textColor="#fff"
                              loading={loading}
                              disabled={loading}
                              labelStyle={styles.buttonFont}
                              contentStyle={{ flexDirection: 'row-reverse' }}
                              style={{ margin: 0, minWidth: 80 }}
                              >
                              Enviar
                            </Button>
                            </View>
                            
                          </View>
                        </>
                      )}
                    </Formik>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.containerTitle}>
                    <Text style={styles.textModal}>{props.description}</Text>
                  </View>
                  <View style={styles.containerPositionButton}>
                    <View style={styles.containerButtonModal}>
                      <Button
                        mode="text"
                        textColor="#ed7d18"
                        disabled={loading}
                        labelStyle={styles.buttonFont}
                        onPress={() => {
                          props.setIsModalOpen(false);
                        }}>
                        NO
                      </Button>
                      <Button
                        mode="text"
                        loading={loading}
                        disabled={loading}
                        textColor="#ed7d18"
                        labelStyle={styles.buttonFont}
                        onPress={() => {
                          props.section === 'preMenu' ? sendLaboralAbsence() : setShowInput(true);
                        }}>
                        SI
                      </Button>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ModalInternet
        isModalOpen={isModalInternetOpen}
        setIsModalOpen={setIsModalInternetOpen}
        iconName="wifi-off"
        title="Sin Internet"
        description="No puede cerrar sesion sin internet, intentelo cuando se reestablezca la conexion"
      />
      <ModalInternet
        isModalOpen={isModalLocOpen}
        setIsModalOpen={setIsModalLocOpen}
        iconName="map-marker-off"
        title="Fuera de Rango"
        description="No se puede registrar la petición, estas fuera del rango de tu sucursal"
      />
    </View>
  );
};

export const styles = StyleSheet.create({
  fondo: {
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCancel: {
    width: '85%',
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: '#fff',
    elevation: 5,
    minHeight: 200,
    maxHeight: '60%',
    marginHorizontal: '7%',
    paddingHorizontal: 15,
    borderRadius: 10,
    justifyContent: 'center'
  },
  modalCancel2: {
    width: '85%',
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: '#fff',
    elevation: 5,
    minHeight: 250,
    maxHeight: '70%', 
    marginHorizontal: '7%',
    paddingHorizontal: 15,
    borderRadius: 10,
    justifyContent: 'center', 

  },
  textContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: '8%',
  },
  textStyle: {
    color: '#888',
    fontSize: 18,
  },
  containerPositionButton: {
    marginTop: '15%',
    width: '100%',
    paddingHorizontal: 10,
    paddingBottom: '5%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  containerPositionButton2: {
    width: '100%',
    paddingHorizontal: 5,
    paddingBottom: '5%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alingItems: 'center', 
    marginTop: 10,
  },
  buttonIconContainer: {
    backgroundColor: '#ed7d18',
    borderRadius: 8, 
    justifiContent: 'center', 
    alignItems: 'center', 
    padding: 0, 
    width: 48, 
    height: 40, 
  },
  buttonSendContainer: {
    backgroundColor: '#4683B4', 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    height: 42, 
  },
  containerButtonModal: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  containerTitle: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginVertical: '5%',
  },
  tittle: {
    color: '#888',
    fontSize: 22,
    fontWeight: '700',
  },
  textModal: {
    color: '#888',
    fontSize: 18,
    fontWeight: '400',
  },
  buttonFont: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  containerForm: {
    width: '100%',
    //height: '70%',
    paddingHorizontal: 5,
    justifyContent: 'flex-start',
    marginTop: 10,
    marrginBottom: 10, 
  },
  inputsLogin: {
    width: '100%',
    backgroundColor: '#fff',
    minHeight: 48, 
    fontSize: 18, 
  },
});
