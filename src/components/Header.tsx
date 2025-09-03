/* eslint-disable react/self-closing-comp */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */

import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, Dimensions, Modal, Platform, ToastAndroid, Image, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../routes/ParamList';
import { useNavigation } from '@react-navigation/native';
import { Button, IconButton } from 'react-native-paper';
import NetworkService from '../utils/Conection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrustValueApi from '../network/TrustValueApi';
import Snackbar from 'react-native-snackbar';
import AxiosBuilder from '../network/AxiosBuilder';
import { ModalInternet } from './ModalInternet';
import UserLogin from '../models/UserLogin';
import axios from 'axios';


type NavigationProps = StackNavigationProp<RootStackParamList, any>;
export default function Header({ texto }: { texto: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigation = useNavigation<NavigationProps>();
  const [isModalInternetOpen, setIsModalInternetOpen] = useState(false);
  const [nameUser, setNameUser] = useState<string | null>('');
  const [surNameUser, setSurNameUser] = useState<string | null>('');
  const [userDataLocal, setUserDataLocal] = useState<UserLogin>({});
  const [loading, setLoading] = useState(false);
  const [userInSesion, setUserInSesion] = useState<any>();
  const iconWidth = 0.40 * Dimensions.get('window').width;

  //cierra el modal de sesion
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleOutsidePress = () => {
    // Cierra el modal al hacer clic fuera de él
    if (isModalOpen) {
      toggleModal();
    }
  };

  //al cargar elcomponente obtiene el nommbre y apellidos del user en sesion
  const getNameUserSession = async () => {
    try {
      const data: any = await AsyncStorage.getItem('userInSession');
      const nameUserSession = await AsyncStorage.getItem('name');
      const surNameUserSession = await AsyncStorage.getItem('surname');
      const userInLocal = await AsyncStorage.getItem('username');
      const passInLocal = await AsyncStorage.getItem('password');
      const keyInLocal = await AsyncStorage.getItem('keyphone');
      setUserDataLocal({
        username: userInLocal,
        password: passInLocal,
        key_phone: keyInLocal,
      });
      setNameUser(nameUserSession);
      setSurNameUser(surNameUserSession);
      setUserInSesion(JSON.parse(data));
    } catch (error) {
      console.error('Error al obtener idAsist desde AsyncStorage: ', error);
    }
  };

  //funcion que cierra sesion
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
                //si el inicio de sesion es correcto, se guardan los siguientes valores
                //en el async storage
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
                            navigation.replace('LoginScreen');
                          } else {
                            Snackbar.show({
                              text: '¡Sesion Cerrada Correctamente',
                              duration: Snackbar.LENGTH_LONG,
                              textColor: '#ed7d18',
                            });
                            navigation.replace('LoginScreen');
                          }

                        }
                      })
                      .catch(error => {
                        console.log(error);
                        Snackbar.show({
                          text:
                            'Error al cerrar sesion',
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
              setLoading(false);
              AxiosBuilder.clear();
              handleOutsidePress();
              if (Platform.OS === 'android') {
                ToastAndroid.show(
                  '¡Sesion Cerrada Correctamente',
                  ToastAndroid.SHORT,
                );
                navigation.replace('LoginScreen');
              } else {
                Snackbar.show({
                  text: '¡Sesion Cerrada Correctamente',
                  duration: Snackbar.LENGTH_LONG,
                  textColor: '#ed7d18',
                });
                navigation.replace('LoginScreen');
              }
            }
          }
        })
        .catch(error => {
          setLoading(false);
          console.log(error);
          Snackbar.show({
            text:
              'Error al cerrar sesion',
            duration: Snackbar.LENGTH_LONG,
          });
        });
    } else {
      setIsModalInternetOpen(true);
    }

  }, [userDataLocal]);

  //al cargar el componente llama a esa funcion para cargar datos del user
  useEffect(() => {
    getNameUserSession();
  }, []);

  const renderMenuIcon = () => {
    if (texto !== 'Trust Value!' && texto !== 'Verificación de Información') {
      return (
        <TouchableOpacity onPress={toggleModal}>
          <Icon name="account" size={30} color="#f2f2f6" />
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerLeft}>
        <Text style={styles.textHeader}>{texto}</Text>
      </View>
      <View style={styles.containerRight}>
        {renderMenuIcon()}
      </View>

      {/* Modal */}
      {isModalOpen && (
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
          <Modal
            visible={true}
            transparent={true}
            animationType="slide"
            onRequestClose={toggleModal}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalOptions}>
                <View style={{ width: '100%', backgroundColor: '#ed7d18', flexDirection: 'row', height: 40, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, }}>
                  <View style={{ width: '50%', paddingHorizontal: 10, justifyContent: 'center', borderBottomRightRadius: 10, }}>
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
                    <Icon name="close" size={28} color="#f2f2f6" />
                  </TouchableOpacity>
                </View>
                <View style={styles.containerIcon}>
                  {userInSesion.profile_picture ? ( // Renderiza si userInSession.profile_picture tiene un valor
                    <Image
                      style={{ width: 100, height: 100, borderRadius: 100 }}
                      source={{ uri: userInSesion.profile_picture }}
                    />
                  ) : ( // Renderiza si userInSession.profile_picture es null      
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
                  marginBottom:5
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
                    navigation.navigate('UserInfoScreen');
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
        </TouchableWithoutFeedback>
      )}
      <ModalInternet
        isModalOpen={isModalInternetOpen}
        setIsModalOpen={setIsModalInternetOpen}
        iconName="wifi-off"
        title="Sin Internet"
        description="No puede cerrar sesion sin internet, intentelo cuando se reestablezca la conexion"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 70,
    paddingHorizontal: 15,
    backgroundColor: '#ed7d18',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 999,
  },
  containerLeft: {
    width: '70%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal:10,
  },
  containerRight: {
    width: '30%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight:10,
  },
  textHeader: {
    color: '#f2f2f6',
    fontSize: 21,
    fontWeight: '400',
    flexDirection: 'row',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOptions: {
    width: '90%',
    borderRadius: 10,
    flexDirection: 'column',
    paddingHorizontal: 15,
    marginTop: '8%',
    backgroundColor: '#fff',
    height: '57%', // Establece la altura a 'auto' para que no se ajuste al teclado.
    marginHorizontal: '4%',

  },
  buttonFixed: {
    width: '95%',
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: '3%',
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: '#fff',
    marginTop: '1%',
    borderWidth: 2,
    borderColor: '#ed7d18',
    marginHorizontal: 15,
  },
  buttonFont: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  containerIcon: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '5%',
  },
  largeIcon: {
    position: 'relative', // Esto es importante
  },
});
