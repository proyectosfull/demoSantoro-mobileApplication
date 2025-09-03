/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useEffect, useState} from 'react';
import {ScrollView} from 'react-native-gesture-handler';
import {Image, StyleSheet, ToastAndroid, Platform} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../routes/ParamList';
import {useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AxiosBuilder from '../network/AxiosBuilder';
import Snackbar from 'react-native-snackbar';
import UserLogin from '../models/UserLogin';
import TrustValueApi from '../network/TrustValueApi';
import axios from 'axios';
import NetworkService from '../utils/Conection';

type Props = StackScreenProps<RootStackParamList, 'SplashScreen'>;
export const SplashScreen = (props: Props) => {

  //verifica si hay sesion iniciada al cargar la app
  const checkSession = useCallback(async () => {
    try {
      const logged = await AsyncStorage.getItem('logged');
      await NetworkService.init();
      if (NetworkService.isConnected === true && NetworkService.isInternetReacheable) {
        if (logged !== null) {
          if (logged === 'true') {
            const userInLocal = await AsyncStorage.getItem('username');
            const passInLocal = await AsyncStorage.getItem('password');
            const keyInLocal = await AsyncStorage.getItem('keyphone');

            const userData: UserLogin = {
              username: userInLocal,
              password: passInLocal,
              key_phone: keyInLocal,
            };
            new TrustValueApi()
              .login(userData)
              .then(responseLogin => {
                //si el inicio de sesion es correcto, se guardan los siguientes valores
                //en el async storage
                if (responseLogin.data.status !== 0) {
                  AsyncStorage.multiSet([
                    ['logged', 'true'],
                    ['token', 'Bearer ' + responseLogin.data.bearer_token],
                    ['username', userData.username!!],
                    ['password', userData.password!!],
                    ['limite',JSON.stringify(responseLogin.data.profile.limited_attendance!!)],
                    ['name', responseLogin.data.profile.name!!],
                    ['idUser', JSON.stringify(responseLogin.data.profile.id)],
                    ['surname', responseLogin.data.profile.surnames!!],
                    ['keyphone', userData.key_phone!!],
                    [
                      'userInSession',
                      JSON.stringify(responseLogin.data.profile),
                    ],
                  ]).then(() => {
                    Snackbar.show({
                      text: 'Sesion Iniciada!!!',
                      duration: Snackbar.LENGTH_LONG,
                      textColor: '#ed7d18',
                    });
                    props.navigation.replace(
                      'UserInfoScreen',
                      responseLogin.data.profile,
                    );
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
            AxiosBuilder.clear();
            await AsyncStorage.multiRemove([
              'logged',
              'token',
              'username',
              'name',
              'limite',
              'surname',
              'userInSession',
              'keyphone',
              'password',
            ]);
            props.navigation.replace('LoginScreen');
          }
        } else {
          if (Platform.OS === 'android') {
            ToastAndroid.show('Inicia Sesion', ToastAndroid.SHORT);
          } else {
            Snackbar.show({
              text: 'Inicia Sesion',
              duration: Snackbar.LENGTH_LONG,
              textColor: '#ed7d18',
            });
          }
          props.navigation.replace('LoginScreen');
        }
      } else {
        await AsyncStorage.multiRemove([
          'logged',
          'token',
          'username',
          'name',
          'limite',
          'surname',
          'userInSession',
          'keyphone',
          'password'
        ]);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Inicia Sesion cuanco tengas conexion de nuevo', ToastAndroid.SHORT);
        } else {
          Snackbar.show({
            text: 'Inicia Sesion cuando tengas conexion de nuevo',
            duration: Snackbar.LENGTH_LONG,
            textColor: '#ed7d18',
          });
        }
        props.navigation.replace('LoginScreen');
      }
    } catch (error) {
      console.error('Error al verificar la sesión:', error);
    }
  }, []);

  useEffect(() => {
    setTimeout(checkSession, 1500);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        resizeMode="contain"
        style={styles.image}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  image: {width: '100%'},
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    padding: 20,
    backgroundColor: 'white',
  },
});