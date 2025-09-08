import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Platform,
  ToastAndroid,
  Dimensions,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import { Appbar, Button } from 'react-native-paper';
import { ModalEvaOEnc } from '../components/ModalEvaOEnc';
import CardMenu from '../components/CardMenu';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ModalLogout } from '../components/ModalLogout';
import NetworkService from '../utils/Conection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModalInternet } from '../components/ModalInternet';
import TrustValueApi from '../network/TrustValueApi';
import AxiosBuilder from '../network/AxiosBuilder';
import Snackbar from 'react-native-snackbar';
import axios from 'axios';
import UserLogin from '../models/UserLogin';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import TrustValueApiUrls from '../network/TrustValueApiUrls';

type Props = StackScreenProps<RootStackParamList, 'MenuScreen'>;
interface TypesLocalDB {
  comunicados: null | string,
  simulador: null | string,
  evidencias: null | string,
  fichas: null | string,
  evaluacion: null | string,
  encuesta: null | string,
}
export default function MenuScreen(props: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalIncOpen, setIsModalIncOpen] = useState(false);
  const [isModalMenuOpen, setIsModalMenuOpen] = useState(false);
  const [section, setSection] = useState('');
  const [titleModal, setTitleModal] = useState('');
  const [descriptionModal, setDescriptionModal] = useState('');
  const [isModalInternetOpen, setIsModalInternetOpen] = useState(false);
  const [finishDay, setIsFinishDay] = useState(false);
  const [limiteAsist, setLimiteAsist] = useState(3);
  const [nameUser, setNameUser] = useState<string | null>('');
  const [surNameUser, setSurNameUser] = useState<string | null>('');
  const [userDataLocal, setUserDataLocal] = useState<UserLogin>({});
  const [asist, setAsist] = useState(false);
  const [localDataBase, setLocalDataBase] = useState<TypesLocalDB>({
    comunicados: null,
    simulador: null,
    evidencias: null,
    fichas: null,
    evaluacion: null,
    encuesta: null,
  });
  const [connect, setConnect] = useState<boolean | null>(false);
  const [reacheable, setReacheable] = useState<boolean | null>(false);
  const [loading, setLoading] = useState(false);
  const [userInSesion, setUserInSesion] = useState<any>();
  const iconWidth = 0.40 * Dimensions.get('window').width;
  const [comunicadosUsuario, setComunicadosUsuario] = useState<[] | null | undefined>([]);
  const [evaluacionesUsuario, setEvaluacionesUsuario] = useState<[] | null | undefined>([]);
  const [encuestasUsuario, setEncuestasUsuario] = useState<[] | null | undefined>([]);
  const [diferenciaComunicados, setDiferenciacomunicados] = useState(0);
  const [idAsistencia, setIdAsistencia] = useState<number | undefined>(undefined);

  //al cargar la app, obtiene valores del asyncStorage
  const getAsistenciaValue = async () => {
    try {
      NetworkService.init();
      const data: any = await AsyncStorage.getItem('userInSession');
      const lim = await AsyncStorage.getItem('limite');
      const value = await AsyncStorage.getItem('finishDay');
      const asistencia = await AsyncStorage.getItem('asistencia');
      const nameUserSession = await AsyncStorage.getItem('name');
      const surNameUserSession = await AsyncStorage.getItem('surname');
      const userInLocal = await AsyncStorage.getItem('username');
      const passInLocal = await AsyncStorage.getItem('password');
      const keyInLocal = await AsyncStorage.getItem('keyphone');
      const evidencesInLocal = await AsyncStorage.getItem('evidencesLocally');
      const idAsist = await AsyncStorage.getItem('idAsistencia');

      console.log('Finish day en menu es ' + value);
      const parsedLimite = Number(lim);
      const parsedIdAsist = idAsist ? Number(idAsist) : undefined;

      setLimiteAsist(parsedLimite);
      setIdAsistencia(parsedIdAsist);

      setLocalDataBase(prevState => ({
        ...prevState,
        evidencias: evidencesInLocal,
      }));

      setUserDataLocal({
        username: userInLocal,
        password: passInLocal,
        key_phone: keyInLocal,
      });
      setUserInSesion(JSON.parse(data));
      setNameUser(nameUserSession);
      setSurNameUser(surNameUserSession);
      const booleanValue = value === 'true' ? true : false;
      const valueAsist = asistencia === 'true' ? true : false;
      setAsist(valueAsist);
      setIsFinishDay(booleanValue);

      await NetworkService.init();
    } catch (error) {
      console.error('Error al obtener el valor de AsyncStorage:', error);
    }
  };

  const toggleModal = () => {
    setIsModalMenuOpen(!isModalMenuOpen);
  };

  const handleFinishDay = async (piezas: number, abordos: number) => {
    setLoading(true); 
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 500; 
    const asistenciaId = idAsistencia; 
    const axiosInst = await AxiosBuilder.getAuthInstance();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const resp = await axiosInst.post(TrustValueApiUrls.ENDDAY, {
          asistencia_id: asistenciaId, 
          piezas,
          abordos
        });
        if (resp.data.status == 1) {
          await AsyncStorage.setItem('asistencia', 'true');
          await AsyncStorage.removeItem('idAsistencia');
          setLoading(false); 
          props.navigation.replace('UserInfoScreen'); 
          return; 
        } else {
          console.warn(`Intento ${attempt} cancelado: ${resp.data.message}`);
        }
      } catch (error) {
        console.error(`Error en el intento ${attempt} finalizar jornada:`, error);
      }
      await new Promise(res => setTimeout(res, RETRY_DELAY_MS)); 
    }
    setLoading(false);
  };

  const handleOutsidePress = () => {
    if (isModalMenuOpen) {
      toggleModal();
    }
  };

  useEffect(() => {
    getAsistenciaValue();
  }, []);

  useEffect(
    useCallback(() => {
      const { pending, justRegistered } = props.route.params || {};

      if (justRegistered) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            'La asistencia se ha registrado correctamente',
            ToastAndroid.LONG
          );
        } else {
          Alert.alert('Asistencia registrada', 'La asistencia se ha registrado correctamente', [{ text: 'OK' }]);
        }
        props.navigation.setParams({ justRegistered: false });
      } else if (pending) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            'Ya tienes una asistencia pendiente registrada.',
            ToastAndroid.LONG
          );
        } else {
          Alert.alert('Asistencia pendiente', 'Ya tienes una asistencia pendiente registrada.', [{ text: 'OK' }]);
        }
        props.navigation.setParams({ pending: false });
      }
    }, [props.route.params])
  );

  useEffect(() => {
    const unsubscribeFocus = props.navigation.addListener('focus', async () => {
      await getAsistenciaValue(); 
      NetworkService.init();
      const evidencesInLocal = await AsyncStorage.getItem('evidencesLocally');
      setLocalDataBase(prevState => ({
        ...prevState,
        evidencias: evidencesInLocal,
      }));
    });

    return () => {
      unsubscribeFocus();
    };
  }, [props.navigation]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setConnect(state.isConnected);
      setReacheable(state.isInternetReachable);
      NetworkService.isConnected = state.isConnected;
      NetworkService.isInternetReacheable = state.isInternetReachable;
    });
    return () => {
      unsubscribe();
    };
  }, [connect, reacheable]);

  const tryLogout = useCallback((setLoading: (value: boolean) => void) => {
    NetworkService.init();
    if (NetworkService.isConnected === true && NetworkService.isInternetReacheable) {
      setLoading(true);
      new TrustValueApi()
        .logout()
        .then(response => {
          if (response.status === 401) {
            new TrustValueApi()
              .login(userDataLocal)
              .then(responseLogin => {
                if (responseLogin.data.status !== 0) {
                  AsyncStorage.multiSet([
                    ['logged', 'true'],
                    ['token', 'Bearer ' + responseLogin.data.bearer_token],
                  ]).then(() => {
                    new TrustValueApi()
                      .logout()
                      .then(responseLogout2 => {
                        if (responseLogout2.status === 200 || responseLogout2.status === 201) {
                          AxiosBuilder.clear();
                          handleOutsidePress();
                          if (Platform.OS === 'android') {
                            ToastAndroid.show(
                              '¡Sesion Cerrada Correctamente',
                              ToastAndroid.SHORT,
                            );
                            props.navigation.replace('LoginScreen');
                          } else {
                            Snackbar.show({
                              text: '¡Sesion Cerrada Correctamente',
                              duration: Snackbar.LENGTH_LONG,
                              textColor: '#ed7d18',
                            });
                            props.navigation.replace('LoginScreen');
                          }
                        }
                      })
                      .catch(error => {
                        console.log(error);
                        Snackbar.show({
                          text: 'Error al cerrar sesion',
                          duration: Snackbar.LENGTH_LONG,
                        });
                      });
                  });
                }
              })
              .catch(error => {
                console.log('El error es' + error);
              });
          } else {
            if (response.status === 200 || response.status === 201) {
              setLoading(false);
              AxiosBuilder.clear();
              handleOutsidePress();
              if (Platform.OS === 'android') {
                ToastAndroid.show(
                  '¡Sesion Cerrada Correctamente',
                  ToastAndroid.SHORT,
                );
                props.navigation.replace('LoginScreen');
              } else {
                Snackbar.show({
                  text: '¡Sesion Cerrada Correctamente',
                  duration: Snackbar.LENGTH_LONG,
                  textColor: '#ed7d18',
                });
                props.navigation.replace('LoginScreen');
              }
            }
          }
        })
        .catch(error => {
          setLoading(false);
          console.log(error);
          Snackbar.show({
            text: 'Error al cerrar sesion',
            duration: Snackbar.LENGTH_LONG,
          });
        });
    } else {
      setIsModalInternetOpen(true);
    }
  }, [userDataLocal]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#ed7d18" barStyle="light-content" />
      <Appbar.Header style={{ backgroundColor: '#ed7d18', height: 50 }}>
        <Appbar.BackAction
          onPress={() => {
            props.navigation.navigate('UserInfoScreen');
          }}
          color={'#f2f2f6'}
        />
        <Appbar.Content title="Menú" titleStyle={{ color: '#f2f2f6' }} />
        <Appbar.Action icon="account" color={'#f2f2f6'} onPress={toggleModal} />
      </Appbar.Header>

      {/* --- SOLO EVIDENCIAS Y FIN DE JORNADA --- */}
      <View style={styles.containerMenu}>
        <View style={styles.containerSingle}>
          <TouchableOpacity onPress={() => {
              props.navigation.navigate('EvidenciasScreen')
          }}>
            <CardMenu
              iconName={finishDay === false ? require('../assets/evidences.png') : require('../assets/evidences.png')}
              name="Evidencias"
              blocked={false}
              connectedWifi={NetworkService.isConnected}
              internetReacheable={NetworkService.isInternetReacheable}
              existLocalData={localDataBase.evidencias}
              nav={props.navigation}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => {
          if (finishDay === false) {
            setIsModalIncOpen(true); 
          } else {
            if (Platform.OS === 'android') {
              ToastAndroid.show(
                'Sin asistencia no puedes finalizar jornada',
                ToastAndroid.SHORT,
              );
            } else {
              Alert.alert(
                'No hay asistencia',
                'Para poder finalizar jornada, es necesario enviar asistencia antes.',
                [{ text: 'OK' }],
                { cancelable: false }
              );
            }
          }
        }}
          style={{ backgroundColor: '#4682B4', height: 50, width: '70%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginBottom: '5%', borderRadius: 10, marginLeft: '2%', alignSelf: 'center' }}>
          <Icon name="logout" size={25} color="#f2f2f6" />
          <Text style={{ color: '#f2f2f6', fontWeight: '500', fontSize: 24, marginLeft: 5 }}>Fin de Jornada</Text>
        </TouchableOpacity>
      </View>

      {/* --- MODALES --- */}
      <ModalEvaOEnc
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        nav={props.navigation}
        section={section}
        title={titleModal}
        description={descriptionModal}
      />
      {isModalMenuOpen && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={toggleModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalOptions}>
              <View style={{ width: '100%', backgroundColor: '#ed7d18', flexDirection: 'row', height: 40, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}>
                <View style={{ width: '50%', paddingHorizontal: 10, justifyContent: 'center' }}>
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
              <View style={styles.containerIcon}>
                {userInSesion?.profile_picture ? (
                  <Image
                    style={{ width: 100, height: 100, borderRadius: 100 }}
                    source={{ uri: userInSesion.profile_picture }}
                  />
                ) : (
                  <View style={styles.largeIcon}>
                    <Icon name="account-circle" size={140} color="#c3c3c3" />
                  </View>
                )}
              </View>
              <View style={{
                justifyContent: 'flex-start',
                alignItems: 'center',
                marginTop: '5%',
                flexDirection: 'column',
                paddingLeft: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#c3c3c3',
                marginHorizontal: 15,
                marginBottom: 5
              }}>
                <Text style={{
                  color: '#888',
                  fontSize: 18,
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                }}>
                  {nameUser}
                </Text>
                <Text style={{
                  color: '#888',
                  fontSize: 18,
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                }}>
                  {surNameUser}
                </Text>
                <TouchableOpacity onPress={() => {
                  handleOutsidePress();
                  props.navigation.navigate('UserInfoScreen');
                }} style={{ flexDirection: 'row', marginTop: 30, marginBottom: '3%' }}>
                  <Text style={{
                    color: '#ed7d18',
                    fontSize: 18,
                    fontWeight: '400',
                    fontStyle: 'italic',
                    marginTop: 5,
                    marginRight: 10,
                  }}>
                    Ver Perfil
                  </Text>
                  <Icon name="account-eye-outline" size={30} color="#ed7d18" />
                </TouchableOpacity>
              </View>
              <View style={styles.buttonFixed}>
                <Button
                  mode="text"
                  icon="logout"
                  onPress={() => {
                    tryLogout(setLoading);
                  }}
                  loading={loading}
                  textColor="#fff"
                  labelStyle={{ ...styles.buttonFont, color: '#ed7d18' }}>
                  Cerrar Sesión
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <ModalLogout
        isModalOpen={isModalIncOpen}
        setIsModalOpen={setIsModalIncOpen}
        nav={props.navigation}
        title="Finalizar Jornada"
        description="¿Estas seguro que quieres dar por finalizada tu jornada? Se cerrará la sesión"
        asistenciaIdForLogout={idAsistencia}
        onSubmit={(piezas, abordos) => {
          handleFinishDay(piezas, abordos);
        }}
      />
       <ModalInternet
        isModalOpen={isModalInternetOpen}
        setIsModalOpen={setIsModalInternetOpen}
        iconName="wifi-off"
        title="Sin Internet"
        description="No puede cerrar sesion sin internet, intentelo cuando se reestablezca la conexion"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerMenu: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  containerSingle: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptions: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  containerIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  largeIcon: { justifyContent: 'center', alignItems: 'center' },
  buttonFixed: { marginTop: 20, alignSelf: 'center' },
  buttonFont: { fontSize: 16 },
});
