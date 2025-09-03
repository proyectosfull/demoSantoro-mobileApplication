

/* eslint-disable react-native/no-inline-styles */

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Dimensions, Text, Image, ToastAndroid, Platform, ActivityIndicator, Modal } from 'react-native';
import Header from '../components/Header';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import UserData from '../components/UserData';
import { Button, IconButton } from 'react-native-paper';
import { ModalBadData } from '../components/ModalBadData';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetworkService from '../utils/Conection';
import { useFocusEffect } from '@react-navigation/native';
import { useLocation } from '../hooks/UseLocation';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import Snackbar from 'react-native-snackbar';
import TrustValueApi from '../network/TrustValueApi';
import ImageViewer from 'react-native-image-zoom-viewer';

type Props = StackScreenProps<RootStackParamList, 'UserInfoScreen'>;
const windowWidth = Dimensions.get('window').width;
export default function UserInfoScreen(props: Props) {
  //abre o cierra el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkPreMenu, setCheckPreMenu] = useState<string | null>('false');
  const [checkAbsences, setCheckAbsences] = useState<string | null>('false');
  const [userInSesion, setUserInSesion] = useState<any>();
  const [limiteAsist, setLimiteAsist] = useState<string|null>('false');
  const iconWidth = 0.40 * windowWidth;
  const [loading, setLoading] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  const handleImagePress = () => {
    setIsViewerVisible(true);
  };
  const handleCloseViewer = () => {
    setIsViewerVisible(false);
  };

  const getNameUserSession = async () => {
    try {
      await NetworkService.preMenuChecked();
      const data: any = await AsyncStorage.getItem('userInSession');
      const lim = await AsyncStorage.getItem('limite');
      const preMenuCheck = await AsyncStorage.getItem('preMenuCheck');
      const absenceCheck = await AsyncStorage.getItem('absence');
      setUserInSesion(JSON.parse(data));
      setLimiteAsist(lim);
      setCheckPreMenu(preMenuCheck);
      setCheckAbsences(absenceCheck);
    } catch (error) {
      console.error('Error al obtener idAsist desde AsyncStorage: ', error);
    }
  };

  const selectImageFromGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.5,
        includeBase64: true,
      },
      async (photoResponse: any) => {
        if (photoResponse.didCancel) return;
        if (photoResponse.errorCode) return;
        if (photoResponse.errorMessage) return;
        if (photoResponse.assets[0].uri && typeof photoResponse.assets[0].uri === 'string') {
          const newPhoto = {
            uri: photoResponse.assets[0].uri,
            type: photoResponse.assets[0].type,
            name: photoResponse.assets[0].fileName,
          };
          NetworkService.init();
          if (
            NetworkService.isConnected === true &&
            NetworkService.isInternetReacheable === true
          ) {
            try {
              setLoading(true);
              let response;
              if (userInSesion.brand) {
                response = await new TrustValueApi().updatePictureProfile(newPhoto, userInSesion.id, userInSesion.brand.id);
              } else {
                response = await new TrustValueApi().updatePictureProfile(newPhoto, userInSesion.id);
              }
              
              if ((response.status === 200 || response.status === 201) && response.data.status === 1) {
                setUserInSesion({
                  ...userInSesion, // Copia todas las propiedades existentes
                  profile_picture: response.data.data.profile_picture, // Actualiza la propiedad 'profile_picture'
                });
                AsyncStorage.setItem('userInSession', JSON.stringify(userInSesion));
                setLoading(false);
                if (Platform.OS === 'android') {
                  ToastAndroid.show(
                    'Su foto ha sido actualizada con exito, continue navegando',
                    ToastAndroid.SHORT,
                  );
                } else {
                  Snackbar.show({
                    text: 'Su foto ha sido actualizada con exito, continue navegando',
                    duration: Snackbar.LENGTH_LONG,
                    textColor: '#ed7d18',
                  });
                }
              } else {
                setLoading(false);
                Snackbar.show({
                  text: 'Ocurrió un error interno,cierra sesion e inténtalo más tarde',
                  duration: Snackbar.LENGTH_LONG,
                });
              }

            } catch (error) {
              setLoading(false);
              if (axios.isAxiosError(error)) {
                console.log(error.response);
                if (error.response) {
                  Snackbar.show({
                    text: 'Ocurrió un error interno, inténtalo más tarde',
                    duration: Snackbar.LENGTH_LONG,
                    textColor: '#ed7d18',
                  });
                }
              }
            }
          }
        }

      },
    );
  }

  useFocusEffect(
    useCallback(() => {
      getNameUserSession();
    }, []),
  );

  useEffect(() => {
    const updateUserInSession = async () => {
      try {
        if (userInSesion) {
          await AsyncStorage.setItem('userInSession', JSON.stringify(userInSesion));
        }
      } catch (error) {
        console.error('Error al actualizar el estado en AsyncStorage: ', error);
      }
    };

    updateUserInSession();
  }, [userInSesion]);




  if (userInSesion === null || userInSesion === undefined) {
    return <View />; // No renderizar nada si las coordenadas son nulas
  }
  return (
    <View style={styles.container}>
      <Header texto="Verificación de Información" />
      {loading ? (
        <View style={styles.containerIndicatorAsist}>
          <ActivityIndicator size={50} color="#ed7d18" />
        </View>
      ) : (
        <View style={styles.containerIcon}>
          {userInSesion.profile_picture ? ( // Renderiza si userInSession.profile_picture tiene un valor
            <TouchableOpacity
              onPress={() => {
                handleImagePress();
              }}>
              <Image
                style={{ width: 150, height: 150, borderRadius: 100 }}
                source={{ uri: userInSesion.profile_picture }}
              />
            </TouchableOpacity>

          ) : ( // Renderiza si userInSession.profile_picture es null      
            <View style={styles.largeIcon}>
              <Icon name="account-circle" size={iconWidth} color="#c3c3c3" />
            </View>
          )}
          <View style={styles.editButton}>
            <IconButton
              icon="pencil"
              iconColor={'#fff'}
              size={windowWidth * 0.06}
              onPress={() => selectImageFromGallery()}
            />
          </View>
        </View>
      )}
      <View style={styles.containerData}>
        <UserData column={'Nombre'} infoColumn={userInSesion.name} />
        <UserData column={'Apellidos'} infoColumn={userInSesion.surnames} />
        <UserData column={'Fecha Ingreso'} infoColumn={userInSesion.start_date} />

        {userInSesion.branch_office ? (
          <>
            <UserData column={'Marca'} infoColumn={userInSesion.branch_office.region.brand.name} />
            <UserData column={'Sucursal'} infoColumn={userInSesion.branch_office.name} />
            <UserData column={'Numero Sucursal'} infoColumn={userInSesion.branch_office_number} />
          </>
        ) : userInSesion.brand ? (
          // Renderizar basado en brand si branch_office no existe
          <>
            <UserData column={'Marca'} infoColumn={userInSesion.brand.name} />
            <UserData column={'Sucursal'} infoColumn={'NA'} />
            <UserData column={'Región'} infoColumn={'Varias Regiones'} />
          </>
        ) : (
          // Renderizar si ni branch_office ni brand existen
          <>
            <UserData column={'Marca'} infoColumn={userInSesion.region.brand.name.toUpperCase()} />
            <UserData column={'Sucursal'} infoColumn={'NA'} />
            <UserData column={'Región'} infoColumn={userInSesion.region.name} />
          </>
        )}
      
      </View>
      <View style={styles.containerGralButtons}>
        <View style={styles.containerPositionButton}>
          <Button
            mode="text"
            onPress={() => {
              if (limiteAsist === 'false' ) {
                if(checkAbsences === 'false'){
                  props.navigation.navigate('PreMenuScreen');
                } else {
                  props.navigation.navigate('MenuScreen');
                }
                
              } else {
                if (checkPreMenu === 'true') {
                  props.navigation.navigate('MenuScreen');
                } else {
                  props.navigation.navigate('PreMenuScreen');
                }
              }
            }}
            textColor="#fff"
            labelStyle={styles.buttonFont}>
            CONTINUAR
          </Button>
        </View>
        <View style={styles.containerPositionButton}>
          {/**
          *
          *  <Button
            mode="text"
            onPress={() => {
              console.log(permissions.locationStatus);
              setIsModalOpen(true);
            }}
            textColor="#fff"
            labelStyle={styles.buttonFont}>
            DATOS INCORRECTOS
          </Button>
          */}
        </View>
      </View>
      <ModalBadData
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        nav={props.navigation}
      />
        <Modal
        visible={isViewerVisible}
        transparent={true}
        onRequestClose={handleCloseViewer}>
        <ImageViewer
          imageUrls={[
            {
              url:userInSesion.profile_picture || '',
              props: {
                source: { uri: userInSesion.profile_picture || '' },
              },
            },
          ]}
          enableSwipeDown
          onCancel={handleCloseViewer}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerData: {
    width: '96%',
    height: '40%',
    marginLeft: '2%',
    marginVertical: '5%',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: '#f2f2f6',
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  containerGralButtons: {
    width: '100%',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    marginBottom: '10%',
  },
  containerPositionButton: {
    width: '100%',
    paddingHorizontal: 10,
    borderRadius: 5,
    marginVertical: 10,
    backgroundColor: '#ed7d18',
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
  imageAsist: {
    width: '60%',
    height: 150,
    borderRadius: 50,
  },
  largeIcon: {
    position: 'relative', // Esto es importante
  },
  editButton: {
    position: 'absolute', // Esto posiciona el botón sobre el icono
    top: '60%', // Ajusta la posición vertical si es necesario
    right: '30%', // Ajusta la posición horizontal si es necesario
    backgroundColor: '#ed7d18',
    borderRadius: 50,
  },
  containerIndicatorAsist: {
    width: '100%',
    alignItems: 'center',
    marginTop: '20%',
    marginBottom: '30%',
  },
});