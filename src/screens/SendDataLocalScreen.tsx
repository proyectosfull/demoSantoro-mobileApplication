
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Text, Platform, ToastAndroid } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import { Button } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';
import sqLite from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Snackbar from 'react-native-snackbar';
import TrustValueApi from '../network/TrustValueApi';
import UserLogin from '../models/UserLogin';
import axios from 'axios';
import Evidences from '../models/Evidences';
import NetworkService from '../utils/Conection';

const db = sqLite.openDatabase(
  { name: 'localTV.db', location: 'default' },
  () => { },
  error => {
    console.log(error);
  },
);

type Props = StackScreenProps<RootStackParamList, 'SendDataLocalScreen'>;
export default function SendDataLocalScreen(props: Props) {

  const [userDataLocal, setUserDataLocal] = useState<UserLogin>({});
  const [loading, setLoading] = useState(false);
  const [evidences, setEvidences] = useState<Evidences>(
    {
      asunto: '',
      mensaje: '',
      multimedia: {
        photos: [],
        videos: [],
      },
    }
  );

  const getLocalUser = async () => {
    const userInLocal = await AsyncStorage.getItem('username');
    const passInLocal = await AsyncStorage.getItem('password');
    const keyInLocal = await AsyncStorage.getItem('keyphone');
    setUserDataLocal({
      username: userInLocal,
      password: passInLocal,
      key_phone: keyInLocal,
    });
  };

  const sendEvidencesTest = async (setLoading: (value: boolean) => void) => {
    NetworkService.init();
    setLoading(true);
    if (NetworkService.isConnected === true && NetworkService.isInternetReacheable) {
      console.log('info que mando al server');
      new TrustValueApi()
        .sendEvidences(evidences)
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
                      .sendEvidences(evidences)
                      .then(responseTwoAsist => {
                        if (
                          responseTwoAsist.status === 200 ||
                          responseTwoAsist.status === 201
                        ) {
                          AsyncStorage.removeItem('evidencesLocally');
                          if (Platform.OS === 'android') {
                            ToastAndroid.show(
                              '¡Se enviaron sus evidencias exitosamente',
                              ToastAndroid.SHORT,
                            );
                            props.navigation.goBack();
                          } else {
                            Snackbar.show({
                              text: '¡Se enviaron sus evidencias exitosamente',
                              duration: Snackbar.LENGTH_LONG,
                              textColor: '#ed7d18',
                            });
                            props.navigation.goBack();
                          }
                          dropTableLocally();
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
            if (
              response.status === 200 ||
              response.status === 201
            ) {
              setLoading(false);
              AsyncStorage.removeItem('evidencesLocally');
              if (Platform.OS === 'android') {
                ToastAndroid.show(
                  '¡Se enviaron sus evidencias exitosamente',
                  ToastAndroid.SHORT,
                );
                props.navigation.goBack();
              } else {
                Snackbar.show({
                  text: '¡Se enviaron sus evidencias exitosamente',
                  duration: Snackbar.LENGTH_LONG,
                  textColor: '#ed7d18',
                });
                props.navigation.goBack();
              }
              dropTableLocally();
            } else {
              Snackbar.show({
                text: 'Ocurrio un error interno, intente mas tarde',
                duration: Snackbar.LENGTH_LONG,
              });
            }
          }
        })
        .catch(error => {
          setLoading(false);
          console.log(error);
          Snackbar.show({
            text: 'Ocurrio un error intenta de nuevo',
            duration: Snackbar.LENGTH_LONG,
          });
        });

    } else {
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          'No tiene conexion a internet, siguen pendientes de envio',
          ToastAndroid.SHORT,
        );
        props.navigation.navigate('MenuScreen');
      } else {
        Snackbar.show({
          text: 'No tiene conexion a internet, siguen pendientes de envio',
          duration: Snackbar.LENGTH_LONG,
          textColor: '#ed7d18',
        });
        props.navigation.navigate('MenuScreen');
      }
    }
  };

  const getDataLocally = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Evidences ',
        [],
        (tx, results) => {
          for (let i = 0; i < results.rows.length; i++) {
            const record = results.rows.item(i);
            evidences.asunto = record.asunto;
            evidences.mensaje = record.mensaje;
            evidences.multimedia!.videos = JSON.parse(record.videos);
            evidences.multimedia!.photos = JSON.parse(record.photos);
            //const photosJSON = record.photos;
            //const photosArray = JSON.parse(photosJSON);
          }
        },
        error => {
          console.error('Error al recuperar el registro:', error);
        },
      );
    });
  };

  const dropTableLocally = () => {
    return new Promise<void>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM Evidences',
          [],
          (tx, results) => {
            console.log(
              'Datos de la tabla Evidences eliminados correctamente.',
            );
            AsyncStorage.setItem('evidencesLocally', 'false');
            resolve();
          },
          error => {
            console.error(
              'Error al eliminar los datos de la tabla Evidences:',
              error,
            );
            reject(error);
          },
        );
      });
    });
  };

  useEffect(() => {
    getLocalUser();
    getDataLocally();
  }, []);

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalOptions}>
        <View
          style={{
            width: '100%',
            backgroundColor: '#ed7d18',
            flexDirection: 'row',
            height: 40,
          }}>
          <View
            style={{
              width: '50%',
              paddingHorizontal: 10,
              justifyContent: 'center',
            }}>
            <Text style={{ color: '#f2f2f6', fontSize: 18 }}>
              {' '}
              Datos Pendientes
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => props.navigation.navigate('MenuScreen')}
            style={{
              width: '50%',
              height: 40,
              backgroundColor: '#ed7d18',
              justifyContent: 'center',
              alignItems: 'flex-end',
              paddingRight: 14,
            }}>
            <Icon name="close" size={28} color="#f2f2f6" />
          </TouchableOpacity>
        </View>
        <View
          style={{
            width: '90%',
            marginHorizontal: 20,
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            marginVertical: '5%',
          }}>
          <Text style={{ color: '#888', fontWeight: '500', fontSize: 18 }}>
            Tienes datos pendientes por enviar y ya tienes conexion a internet,
            ¿deseas enviarlos?
          </Text>
        </View>
        <View
          style={{
            bottom: 0,
            position: 'absolute',
            marginBottom: 20,
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}>
          <Button
            mode="text"
            labelStyle={styles.buttonFont}
            loading={loading}
            onPress={() => sendEvidencesTest(setLoading)}>
            SI
          </Button>
          <Button
            mode="text"
            labelStyle={styles.buttonFont}
            onPress={() => props.navigation.navigate('MenuScreen')}>
            NO
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOptions: {
    width: '90%',
    borderRadius: 5,
    flexDirection: 'column',
    marginTop: '8%',
    backgroundColor: '#fff',
    elevation: 5,
    height: '35%', // Establece la altura a 'auto' para que no se ajuste al teclado.
    marginHorizontal: '4%',
    borderColor: '#000',
    borderWidth: 1,
  },
  buttonFont: {
    fontWeight: 'bold',
    fontSize: 20,
  },
});