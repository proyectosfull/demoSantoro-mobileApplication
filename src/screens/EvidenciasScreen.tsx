import React, { useContext, useEffect, useState } from 'react';
import {
  Modal,
  PermissionsAndroid,
  Platform,
  Image,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import { ActivityIndicator, Button, IconButton, TextInput } from 'react-native-paper';
import Header from '../components/Header';
import { Formik } from 'formik';
import * as yup from 'yup';
import TextInputError from '../components/TextInputError';
import Snackbar from 'react-native-snackbar';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import NetworkService from '../utils/Conection';
import Evidences from '../models/Evidences';
import sqLite from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModalInternet } from '../components/ModalInternet';
import TrustValueApi from '../network/TrustValueApi';
import UserLogin from '../models/UserLogin';
import axios from 'axios';
import FormatArchives from '../models/FormatArchives';


const evidencesSchema = yup.object().shape({
  asunto: yup.string().required('El Asunto es obligatorio'),
  mensaje: yup.string().required('El mensaje es obligatorio'),
});

type Props = StackScreenProps<RootStackParamList, 'EvidenciasScreen'>;

const db = sqLite.openDatabase(
  { name: 'localTV.db', location: 'default' },
  () => { },
  error => { console.log(error) }
);

export default function EvidenciasScreen(props: Props) {
  const [photo, setPhoto] = useState<{}[]>([]);
  const [video, setVideo] = useState<{}[]>([]);
  const [existLocalData, setIsExistLocalData] = useState<string | null>(null);
  const [evidences, setEvidences] = useState<Evidences>({});
  const [isModalIntOpen, setIsModalIntOpen] = useState(false);
  const [isModalLocalOpen, setIsModalLocalOpen] = useState(false);
  const [userDataLocal, setUserDataLocal] = useState<UserLogin>({});
  const [archives, setArchives] = useState<FormatArchives>(new FormatArchives());
  const [loading, setLoading] = useState(false);
  const [horaActual, setHoraActual] = useState('');

  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS Evidences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asunto TEXT,
    mensaje TEXT,
    photos TEXT,
    videos TEXT
  );
`;


  const obtenerFechaHoraUTC = async () => {
    try {
      const respuesta = await fetch('https://worldtimeapi.org/api/ip');
      console.log(respuesta);
      const datos = await respuesta.json();
      console.log(datos.datetime);
      setHoraActual(datos.datetime);
    } catch (error) {
      console.error('Error al obtener la fecha y hora UTC:', error);
      return null;
    }
  };

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

  const createTable = () => {
    db.transaction((tx: any) => {
      tx.executeSql(createTableQuery, [], (tx: any, results: any) => {
        // La tabla se ha creado correctamente o ya existe
        console.log('Tabla Evidences creada o ya existe');
      },
        (error: any) => {
          console.error('Error al crear la tabla Evidences:', error);
        });
    });
  };

  const insertDataLocally = (asunto: string | undefined, msj: string | undefined, multimedia: FormatArchives | undefined) => {
    const photosJSON = JSON.stringify(multimedia!.photos);
    db.transaction((tx: any) => {
      tx.executeSql('INSERT INTO Evidences (asunto, mensaje, photos,videos) VALUES (?, ?, ?, ?)', [asunto, msj, photosJSON], (tx: any, results: any) => {
        console.log('Registro insertado con éxito');
        AsyncStorage.setItem('evidencesLocally', 'true');
      },
        (error: any) => {
          console.error('Error al insertar el registro:', error);
        });
    });
  };

  const dropTableLocally = () => {
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql('DELETE FROM Evidences', [], (tx: any, results: any) => {
          console.log('Datos de la tabla Evidences eliminados correctamente.');
          AsyncStorage.setItem('evidencesLocally', 'false');
          resolve();
        },
          (error: any) => {
            console.error('Error al eliminar los datos de la tabla Evidences:', error);
            reject(error);
          });
      });
    });
  };


  const sendEvidencesTest = async (evidencias: Evidences, setLoading: (value: boolean) => void) => {
    NetworkService.init();
    if (NetworkService.isConnected === true && NetworkService.isInternetReacheable === true) {
      setLoading(true);
      new TrustValueApi()
        .sendEvidences(evidencias, horaActual.replace('T', ' ').substring(0, 19))
        .then(response => {
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
                      .sendEvidences(evidences, horaActual.replace('T', ' ').substring(0, 19))
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
              console.log(response);
              setLoading(false)
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
      if (existLocalData === 'true') {
        setIsModalLocalOpen(true);
      } else {
        insertDataLocally(evidencias.asunto, evidencias.mensaje, evidencias.multimedia);
        setIsModalIntOpen(true);
      }
    }
  };

  const checkLocalEvidences = async () => {
    const localEv = await AsyncStorage.getItem('evidencesLocally');
    setIsExistLocalData(localEv);
  };

  useEffect(() => {
    createTable();
    checkLocalEvidences();
    getLocalUser();
    obtenerFechaHoraUTC();
  }, []);

  const takeImage = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.2, // bajar la calidad de la imagen
        includeBase64: true,
      },
      (photoResponse: any) => {
        if (photoResponse.didCancel) return;
        if (photoResponse.errorCode) return;
        if (photoResponse.errorMessage) return;
        if (photo.length < 3) {
          const uriImage =
            photoResponse.assets && photoResponse.assets[0].uri;
          if (uriImage && typeof uriImage === 'string') {

            console.log(photoResponse.assets[0].type)
            const newPhoto = {
              uri: photoResponse.assets[0].uri,
              type: photoResponse.assets[0].type,
              name: photoResponse.assets[0].fileName,
            };
            console.log(newPhoto)

            setArchives((prevState) => ({
              ...prevState,
              photos: [...prevState.photos, newPhoto],
            }));

            setPhoto([...photo, uriImage]);
            if (Platform.OS === 'android') {
              ToastAndroid.show(
                '¡Se guardo la evidencia de su imagen',
                ToastAndroid.SHORT,
              );
            } else {
              Snackbar.show({
                text: '¡Se guardo la evidencia de su imagen',
                duration: Snackbar.LENGTH_LONG,
                textColor: '#ed7d18',
              });
            }
          }
        } else {
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              'Solo puede adjuntar 3 fotos',
              ToastAndroid.SHORT,
            );
          } else {
            Snackbar.show({
              text: 'Solo puede adjuntar 3 fotos',
              duration: Snackbar.LENGTH_LONG,
              textColor: '#ed7d18',
            });
          }
        }
      },
    );
  };

   const takeVideo = () => {
     launchCamera(
       {
       mediaType: 'video',
         durationLimit: 6,
         quality: 0.5,
       },
       videoResponse => {
         if (videoResponse.didCancel) return;
         if (videoResponse.errorCode) return;
         if (videoResponse.errorMessage) return;
         if (video.length < 1) {
          const uriVideo = videoResponse.assets && videoResponse.assets[0].uri;
           const typeVideo = videoResponse.assets && videoResponse.assets[0].type;
           const nameVideo = videoResponse.assets && videoResponse.assets[0].fileName;
           if (uriVideo && typeof uriVideo === 'string') {

             const newVideo = {
               uri: uriVideo,
               type: typeVideo,
               name: nameVideo,
             };

             setArchives((prevState) => ({
               ...prevState,
               videos: [...prevState.videos, newVideo],
             }));
             // Solo asigna el valor si uri es una cadena válida
             setVideo([...video, uriVideo]); // Agrega la nueva URI al estado existente
             if (Platform.OS === 'android') {
               ToastAndroid.show(
                 '¡Se guardo la evidencia de su video',
                 ToastAndroid.SHORT,
               );
             } else {
               Snackbar.show({
                 text: '¡Se guardo la evidencia de su video',
                 duration: Snackbar.LENGTH_LONG,
                 textColor: '#ed7d18',
               });
             }
           }
         } else {
           if (Platform.OS === 'android') {
             ToastAndroid.show(
               'Solo puede adjuntar 1 video',
               ToastAndroid.SHORT,
             );
           } else {
             Snackbar.show({
               text: 'Solo puede adjuntar 1 video',
               duration: Snackbar.LENGTH_LONG,
               textColor: '#ed7d18',
             });
           }
         }
       },
     );
   };


  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#ed7d18" barStyle="light-content" />
      <Header texto="Evidencias" />
      <View style={styles.containerTitleText}>
        <Text style={styles.title}>
          Adjunta las evidencias correspondientes para enviar
        </Text>
      </View>
      <View
        style={{
          width: '100%',
          paddingHorizontal: 15,
          justifyContent: 'center',
          marginTop: '6%',
        }}>
        <Formik
          initialValues={{
            asunto: '',
            mensaje: '',
          }}
          validationSchema={evidencesSchema}
          onSubmit={values => {
            const nuevoEvidences: Evidences = {
              asunto: values.asunto,
              mensaje: values.mensaje,
              multimedia: archives,
            };
            if (photo.length === 0) {
              if (Platform.OS === 'android') {
                ToastAndroid.show(
                  'Debe adjuntar al menos una evidencia',
                  ToastAndroid.SHORT,
                );
              } else {
                Snackbar.show({
                  text: 'Debe adjuntar al menos una evidencia',
                  duration: Snackbar.LENGTH_LONG,
                  textColor: '#ed7d18',
                });
              }
            } else {
              sendEvidencesTest(nuevoEvidences, setLoading);
            }
            console.log(Evidences);
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
                label="Asunto"
                placeholder="Asunto"
                onChangeText={handleChange('asunto')}
                onBlur={() => {
                  handleBlur('asunto');
                }}
                value={values.asunto}
                touched={touched.asunto}
                errorMessage={errors.asunto}
                outlineColor="#c1c1c1"
              />

              <View style={{
                borderWidth: 2,
                borderColor: '#ed7d18',
                borderRadius: 8,
                marginTop: 10,
                padding: 9,
                backgroundColor: '#fff',
              }}>
                <TextInputError
                  mode="flat"
                  outlineColor="#c1c1c1"
                  textColor="black"
                  label="Escriba su Mensaje"
                  style={{ height: 120, backgroundColor: '#fff', borderWidth: 0 }}
                  placeholder="Escriba su Mensaje"
                  onChangeText={handleChange('mensaje')}
                  onBlur={() => {
                    handleBlur('mensaje');
                  }}
                  value={values.mensaje}
                  touched={touched.mensaje}
                  errorMessage={errors.mensaje}
                />

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}>
                  <View style={{ flexDirection: 'row', gap: 0, marginRight: -8 }}>
                    <IconButton
                      icon="file-image"
                      iconColor={'#888'}
                      size={28}
                      onPress={takeImage}
                      style={{ margin: 0, padding: 0 }}
                    />
                    { <IconButton
                      icon="file-video"
                      iconColor={'#888'}
                      size={28}
                      onPress={takeVideo}
                      style={{ margin: 0, padding: 0 }}
                    /> }
                  </View>

                  <Button
                    mode="contained"
                    onPress={() => {
                      handleSubmit();
                    }}
                    icon="send"
                    loading={loading}
                    style={{ backgroundColor: '#ed7d18', borderRadius: 10 }}
                    labelStyle={{ ...styles.buttonFont, color: '#fff' }}
                  >
                    ENVIAR
                  </Button>
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <Text style={{ color: '#888' }}>N° de Archivos Cargados: </Text>
                <Text style={{ color: '#888' }}>{photo.length}</Text>
              </View>

            </View>
          )}
        </Formik>
      </View>
      <View style={styles.containerPositionButton}>
        <IconButton
          icon="home"
          iconColor="#ed7d18"
          size={50}
          onPress={() => props.navigation.goBack()}
        />
      </View>
      <ModalInternet
        isModalOpen={isModalIntOpen}
        setIsModalOpen={setIsModalIntOpen}
        iconName="wifi-off"
        title="Sin Internet"
        description="No tiene conexion a internet, sus evidencias quedaran pendiente para su envio"
        section="Menu"
        nav={props.navigation}
      />
      <ModalInternet
        isModalOpen={isModalLocalOpen}
        setIsModalOpen={setIsModalLocalOpen}
        iconName="wifi-off"
        title="Datos Pendientes"
        description="Tiene datos pendientes por enviar porque no tiene conexion a la red"
        section="Menu"
        nav={props.navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  containerTitleText: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: '6%',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 19,
    color: '#888',
  },

  buttonFixed: {
    width: '30%',
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: '3%',
    marginRight: 10,
    backgroundColor: '#ed7d18',
    marginTop: '-21%',
    borderWidth: 1,
    borderColor: '#fff',
    alignSelf: 'flex-end',
  },

  buttonFont: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  containerPositionButton: {
    position: 'absolute',
    width: '30%',
    height: 55,
    bottom: '3%',
    borderTopRightRadius: 40,
    alignItems: 'flex-start',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOptions: {
    width: '80%',
    borderRadius: 5,
    flexDirection: 'column',
    marginTop: '8%',
    backgroundColor: '#fff',
    elevation: 5,
    height: '45%', // Establece la altura a 'auto' para que no se ajuste al teclado.
    marginHorizontal: '4%',
    borderColor: '#000',
    borderWidth: 1,
  },
  containerButtonsModal: {
    width: '33%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerImageModal: {
    width: '100%',
    height: 130,
    paddingTop: 15,
    alignItems: 'center',
    marginTop: -10,
  },
  activityIndicator: { alignSelf: 'center', justifyContent: 'center', marginTop: '10%' },
});