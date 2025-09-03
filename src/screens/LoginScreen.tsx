

/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Header from '../components/Header';
import { Formik } from 'formik';
import * as yup from 'yup';
import TextInputError from '../components/TextInputError';
import { Button, TextInput } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrustValueApi from '../network/TrustValueApi';
import axios from 'axios';
import Snackbar from 'react-native-snackbar';
import UserLogin from '../models/UserLogin';
import NetworkService from '../utils/Conection';
import { ModalInternet } from '../components/ModalInternet';
import { useLocation } from '../hooks/UseLocation';

import { Modal, Text } from 'react-native';

const loginSchema = yup.object().shape({
  username: yup.string().required('El Usuario es obligatorio'),
  password: yup.string().required('La contraseña es obligatoria'),
});

type Props = StackScreenProps<RootStackParamList, 'LoginScreen'>;

export default function LoginScreen(props: Props) {
  const [isFocusedUsername, setIsFocusedUsername] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [isModalInternetOpen, setIsModalInternetOpen] = useState(false);
  const { hasLocation, position, getCurrentLocation } = useLocation();
  const [loading, setLoading] = useState(false);
  const [pwdVisible, setPwdVisible] = useState(true);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const getLoc = async () => {
    const { latitude, longitude } = await getCurrentLocation();
  }

  const userLogin: UserLogin = {
    username: '',
    password: '',
    key_phone: '',
  };

  //Obtengo el ID del dispositivo
  DeviceInfo.getUniqueId().then((uniqueId) => {
    // iOS: "FCDBD8EF-62FC-4ECB-B2F5-92C9E79AC7F9"
    // Android: "dd96dec43fb81c97"
    // Windows: "{2cf7cb3c-da7a-d508-0d7f-696bb51185b4}"
    console.log(uniqueId)
    userLogin.key_phone =  uniqueId;
  });

  // Funcion para para mostrar el modal de error 
  const showErrorModal = (message: string) => {
    setErrorModalMessage(message); 
    setErrorModalVisible(true);
    setTimeout(() => {
      setErrorModalVisible(false); 
    }, 3000); // la duracion es de 3 segundos
  }; 

  // Funcion para hacer Login
  const tryLogin = useCallback(
    (user: UserLogin, setLoading: (value: boolean) => void) => {
      NetworkService.init();
      if (NetworkService.isConnected === true && NetworkService.isInternetReacheable) {
        setLoading(true);
        new TrustValueApi()
          .login(user)
          .then(response => {
            console.log(response.data,"usuario")
            setLoading(false);
            //si el inicio de sesion es correcto, se guardan los siguientes valores
            //en el async storage
            if (response.data.status !== 0) {
              AsyncStorage.multiSet([
                ['logged', 'true'],
                ['token', 'Bearer ' + response.data.bearer_token],
                ['username', user.username!!],
                ['password', user.password!!],
                ['name', response.data.profile.name!!],
                ['limite',JSON.stringify(response.data.profile.limited_attendance!!)],
                ['surname', response.data.profile.surnames!!],
                ['keyphone', user.key_phone!!],
                ['userInSession', JSON.stringify(response.data.profile)],
              ]).then(() => {
                Snackbar.show({
                  text: 'Sesion Iniciada!!!',
                  duration: Snackbar.LENGTH_LONG,
                  textColor: '#ed7d18',
                });
                props.navigation.replace('UserInfoScreen');
              });
            } else {
              // Snackbar.show({
              //   text: 'Las credenciales no son correctas o el dispositivo en el que inicias sesion es otro',
              //   duration: Snackbar.LENGTH_LONG,
              //   textColor: '#ed7d18',
              // });
              showErrorModal('Las credenciales no son correctas o el dispositivo en el que inicias sesion es otro'); 
            }
          })
          .catch(error => {

            setLoading(false);
            console.log('El error es' + error);
            if (axios.isAxiosError(error)) {
              if (error.response) {
                // Snackbar.show({
                //   text: 'Error en el servidor',
                //   duration: Snackbar.LENGTH_LONG,
                //   textColor: '#ed7d18',
                // });
                showErrorModal('Error en el servidor'); 
              }
            }
          });
      } else {
        setIsModalInternetOpen(true);
      }
    },
    [props.navigation],
  );

  useEffect(() => {
    getLoc();
  }, []);

  //Funciones para ir guardando los valores de los inputs
  const handleFocusUsername = () => {
    setIsFocusedUsername(true);
  };

  const handleBlurUsername = () => {
    setIsFocusedUsername(false);
  };
  const handleFocusPassword = () => {
    setIsFocusedPassword(true);
  };

  const handleBlurPassword = () => {
    setIsFocusedPassword(false);
  };

  return (
    <View style={styles.backgroundImage}>

      <Modal
        visible= {errorModalVisible}
        transparent
        animationType= "fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}>
          <View style={{
            backgroundColor: '#fff', 
            padding: 24,
            borderRadius: 10,
            alignItems: 'center',
            minWidth: 220, 
            elevation: 8, 
          }}>
            <Text style={{ color: '#ed7d18', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>¡Error!</Text>
            <Text style={{ color: '#333', textAlign: 'center' }} >{errorModalMessage}</Text>

          </View>
        </View>
      </Modal>

      <Header texto="Trust Value!" />
      <View style={styles.containerImage}>
        <Image source={require('../assets/logo.png')} style={styles.image} />
      </View>
      <View style={styles.containerForm}>
        <Formik
          initialValues={{
            username: '',
            password: '',
          }}
          validationSchema={loginSchema}
          onSubmit={(values) => {
            userLogin.username = values.username;
            userLogin.password = values.password;
            if(values.username === 'userPlayStore' || values.username === 'userAppleStore'){
                 userLogin.key_phone = 'atv';
            }
            tryLogin(userLogin,setLoading);
          }}>
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            touched,
            errors,
          }) => (
            <View>
              <TextInputError
                mode="outlined"
                textColor="black"
                label="Usuario"
                placeholder="Usuario"
                onFocus={handleFocusUsername}
                style={{
                  ...styles.inputsLogin,
                  borderBottomColor: isFocusedUsername ? '#ed7d18' : '#b1b1b1',
                }}
                onChangeText={handleChange('username')}
                onBlur={() => {
                  handleBlur('username');
                  handleBlurUsername();
                }}
                value={values.username}
                touched={touched.username}
                errorMessage={errors.username}
              />
              <TextInputError
                mode="outlined"
                label="Contraseña"
                secureTextEntry={pwdVisible}
                textColor="black"
                placeholder="Contraseña"
                onFocus={handleFocusPassword}
                style={{
                  ...styles.inputsLogin,
                  borderBottomColor: isFocusedPassword ? '#ed7d18' : '#b1b1b1',
                }}
                onChangeText={handleChange('password')}
                onBlur={() => {
                  handleBlur('password');
                  handleBlurPassword();
                }}
                value={values.password}
                touched={touched.password}
                errorMessage={errors.password}
                right={
                  <TextInput.Icon
                    icon={pwdVisible ? 'eye' : 'eye-off'}
                    onPress={() => setPwdVisible(!pwdVisible)}
                  />
                }
              />
              <View style={styles.containerPositionButton}>
                <Button
                  mode="text"
                  onPress={() => {
                    setLoading(true);
                    handleSubmit();
                  }}
                  textColor="#f2f2f6"
                  loading={loading}
                  disabled={loading}
                  labelStyle={styles.buttonFont}>
                  INICIAR SESIÓN
                </Button>
              </View>
            </View>
          )}
        </Formik>
      </View>

      <ModalInternet
        isModalOpen={isModalInternetOpen}
        setIsModalOpen={setIsModalInternetOpen}
        iconName="wifi-off"
        title="Sin Internet"
        description="No puede iniciar sesion sin internet, intentelo cuando se reestablezca la conexion"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerForm: {
    width: '100%',
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  containerImage: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '10%',
  },
  image: {
    width: '100%',
    marginLeft: 8,
  },
  inputsLogin: {
    width: '100%',
    backgroundColor: '#fff',
  },
  containerPositionButton: {
    width: '100%',
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#ed7d18',
  },
  buttonFont: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
