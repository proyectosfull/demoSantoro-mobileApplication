/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import {Modal} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../routes/ParamList';
import {Button, IconButton} from 'react-native-paper';
import ImagePicker from 'react-native-image-crop-picker';
import Snackbar from 'react-native-snackbar';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as yup from 'yup';
import {Formik} from 'formik';
import TextInputError from './TextInputError';
import axios from 'axios';
import TrustValueApi from '../network/TrustValueApi';
import NetworkService from '../utils/Conection';
import LaboralAbsences from '../models/LaboralAbsences';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Options {
  isModalOpen: boolean;
  title: string;
  description: string;
  setIsModalOpen: any;
  section?: string;
  nav: StackNavigationProp<
    RootStackParamList,
    'PreMenuScreen' | 'MenuScreen',
    undefined
  >;
}

const descriptionSchema = yup.object().shape({
  description: yup.string().required('La descripcion es obligatoria'),
});

export const ModalIncapacidad = (props: Options) => {
  const [photo, setPhoto] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [objectLaboralAbsences, setObjectLaboralAbsences] =
    useState<LaboralAbsences>({
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

  const takeImage = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.5,
        includeBase64: true,
      },
      (photoResponse: any) => {
        if (photoResponse.didCancel) return;
        if (photoResponse.errorCode) return;
        if (photoResponse.errorMessage) return;
        const base64Image =
          photoResponse.assets && photoResponse.assets[0].base64;
        if (photo.length < 1) {
          if (base64Image && typeof base64Image === 'string') {
            const newPhoto = {
              uri: photoResponse.assets[0].uri,
              type: photoResponse.assets[0].type,
              name: photoResponse.assets[0].fileName,
            };
            // Solo asigna el valor si uri es una cadena válida
            setPhoto([...photo, base64Image]); // Agrega la nueva URI al estado existente
            const updatedObject = {...objectLaboralAbsences}; // Otra opción: const updatedObject = Object.assign({}, objectLaboralAbsences);
            // Actualiza la propiedad específica en el objeto clonado
            updatedObject.evidencia = newPhoto;
            // Establece el nuevo objeto como el estado actual
            setObjectLaboralAbsences(updatedObject);
            if (Platform.OS === 'android') {
              ToastAndroid.show(
                '¡Se guardo correctamente su imagen',
                ToastAndroid.SHORT,
              );
            } else {
              Snackbar.show({
                text: '¡Se guardo correctamente su imagen',
                duration: Snackbar.LENGTH_LONG,
                textColor: '#ed7d18',
              });
            }
          }
        } else {
          if (Platform.OS === 'android') {
            ToastAndroid.show('Solo puede adjuntar 1 foto', ToastAndroid.SHORT);
          } else {
            Snackbar.show({
              text: 'Solo puede adjuntar 1 foto',
              duration: Snackbar.LENGTH_LONG,
              textColor: '#ed7d18',
            });
          }
        }
      },
    );
  };

  const sendLaboralAbsence = async (descriptionInc: string) => {
    NetworkService.init();
    if (
      NetworkService.isConnected === true &&
      NetworkService.isInternetReacheable === true
    ) {
      try {
        if (photo.length === 0) {
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              'Debe tomar la fotografia de la incapacidad',
              ToastAndroid.SHORT,
            );
          } else {
            Snackbar.show({
              text: 'Debe tomar la fotografia de la incapacidad',
              duration: Snackbar.LENGTH_LONG,
              textColor: '#ed7d18',
            });
          }
        } else {
          setLoading(true);
          const auxObjectLaboralAbsence: LaboralAbsences = {
            razon: 'incapacidad',
            descripcion: descriptionInc,
            evidencia: objectLaboralAbsences.evidencia,
            inicioVacaciones: '',
            finVacaciones: '',
          };
          console.log('le estoy mandando: ');
          console.log(auxObjectLaboralAbsence);
          const response = await new TrustValueApi().sendLaboralAbsences(
            auxObjectLaboralAbsence,
          );
          if (response.status === 200 || response.status === 201) {
            AsyncStorage.setItem('preMenuCheck', 'true');
            AsyncStorage.setItem('absence', 'true');
            setLoading(false);
            if (Platform.OS === 'android') {
              ToastAndroid.show(
                'Su incapacidad ha sido enviada, continue navegando',
                ToastAndroid.SHORT,
              );
              props.setIsModalOpen(false);
              props.nav.navigate('MenuScreen');
              console.log(response.data);
              console.log(response.data.errors);
            } else {
              Snackbar.show({
                text: 'Su incapacidad ha sido enviada, continue navegando',
                duration: Snackbar.LENGTH_LONG,
                textColor: '#ed7d18',
              });
              props.setIsModalOpen(false);
              props.nav.navigate('MenuScreen');
            }
          } else {
            console.log(response);
            setLoading(false);
            Snackbar.show({
              text: 'Ocurrió un error interno,cierra sesion e inténtalo más tarde',
              duration: Snackbar.LENGTH_LONG,
            });
          }
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

  return (
    <Formik
      initialValues={{
        description: '',
      }}
      validationSchema={descriptionSchema}
      onSubmit={values => {
        sendLaboralAbsence(values.description);
      }}>
      {({handleChange, handleBlur, handleSubmit, values, touched, errors}) => (
        <View>
          <Modal
            visible={props.isModalOpen}
            transparent={true}
            animationType={'slide'}>
            <View style={styles.fondo}>
              <View style={styles.modalCancel}>
                <View style={styles.titleContainer}>
                  <View
                    style={{
                      width: '20%',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Icon name="calendar" size={30} color="#fff" />
                  </View>
                  <View
                    style={{
                      width: '80%',
                      flexDirection: 'row',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                    }}>
                    <Text style={styles.titleStyle}>INCAPACIDAD</Text>
                    <TouchableOpacity
                      onPress={() => props.setIsModalOpen(false)}
                      style={{
                        width: '50%',
                        height: 40,
                        backgroundColor: '#ed7d18',
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                        paddingRight: 14,
                      }}>
                      <Icon name="close" size={22} color="#f2f2f6" />
                    </TouchableOpacity>
                  </View>
                </View>
                <TextInputError
                  mode="outlined"
                  outlineColor="#c1c1c1"
                  textColor="black"
                  label="Descripcion"
                  style={{height: 150, marginTop: 7}}
                  placeholder="Descripcion"
                  onChangeText={handleChange('description')}
                  onBlur={() => {
                    handleBlur('description');
                  }}
                  value={values.description}
                  touched={touched.description}
                  errorMessage={errors.description}
                />
                <View
                  style={{
                    width: '100%',
                    flexDirection: 'row',
                    marginTop: '-23%',
                    zIndex: 999,
                    justifyContent: 'flex-end',
                  }}>
                  <View style={{marginRight: '-3%'}}>
                    <IconButton
                      icon="file-image"
                      iconColor={'#888'}
                      size={24}
                      onPress={takeImage}
                    />
                  </View>
                </View>
                <View style={styles.buttonFixed}>
                  <Button
                    mode="text"
                    onPress={() => {
                      handleSubmit();
                    }}
                    loading={loading}
                    textColor="#fff"
                    labelStyle={{...styles.buttonFont, color: '#ed7d18'}}>
                    ENVIAR
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </Formik>
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
    height: 310,
    marginHorizontal: '7%',
    borderRadius: 10,
    paddingHorizontal: 15,
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
    marginTop: 'auto', // Empujar hacia la parte inferior
    width: '100%',
    paddingHorizontal: 10,
    paddingBottom: '5%',
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
    paddingHorizontal: 15,
  },
  tittle: {
    color: '#888',
    fontSize: 22,
    fontWeight: '700',
  },
  textModal: {
    color: '#888',
    fontSize: 18,
    fontWeight: '500',
  },
  buttonFixed: {
    width: '98%',
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: '8%',
    marginLeft: 3,
    marginRight: 5,
    backgroundColor: '#fff',
    marginTop: '8%',
    borderWidth: 2,
    borderColor: '#ed7d18',
    marginHorizontal: 15,
  },
  buttonFont: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  titleStyle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    height: 45,
    backgroundColor: '#ed7d18',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});
