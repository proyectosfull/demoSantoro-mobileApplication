/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Image,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import Marcas from '../components/Marcas';
import Header from '../components/Header';
import { IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import NetworkService from '../utils/Conection';
import TrustValueApi from '../network/TrustValueApi';
import Snackbar from 'react-native-snackbar';
import axios from 'axios';
import { ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<
  RootStackParamList,
  'EncuestasScreen'
>;
export default function EncuestasScreen(props: Props) {
  const [loading, setLoading] = useState(false);
  const [encuestasUsuario, setEncuestasUsuario] = useState<
    [] | null | undefined
  >([]);
  const [connectedWifi, setConnectedWifi] = useState(false);

  const fetchData = async () => {
    NetworkService.init();
    if (
      NetworkService.isConnected === true &&
      NetworkService.isInternetReacheable === true
    ) {
      setLoading(true);
      try {
        const response = await new TrustValueApi().getSurveys();
        if (
          (response.status === 200 || response.status === 201) &&
          response.data.status === 1
        ) {
          setConnectedWifi(true);
          setLoading(false);
          const responseData = response.data.data.data;
          setEncuestasUsuario(response.data.data.data);
        } else {
          setLoading(false);
          Snackbar.show({
            text: 'Ocurrió un error interno, inténtalo más tarde',
            duration: Snackbar.LENGTH_LONG,
          });
        }
      } catch (error) {
        setLoading(false);
        console.log('El error es' + error);
        if (axios.isAxiosError(error)) {
          if (error.response) {
            Snackbar.show({
              text: 'Ocurrió un error interno, inténtalo más tarde',
              duration: Snackbar.LENGTH_LONG,
              textColor: '#ed7d18',
            });
          }
        }
      }
    } else {
      setLoading(false);
      setConnectedWifi(false);
      // Si no hay conexión a Internet, obtén los datos de la tabla local
      try {
        // Ahora puedes usar localData como los datos locales recuperados
        // También puedes almacenar localData en un estado si es necesario
      } catch (error) {
        console.error('Error al obtener datos locales:', error);
      }
    }
  };

  // Usa useFocusEffect con la función fetchData
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  return (
    <View style={styles.container}>
      <Header texto="Categoria de preguntas" />
      <ScrollView 
        style={{ marginBottom: '15%' }} 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 28, paddingBottom: 32 }} 
      >
        {loading && (
          <View style={styles.containerIndicator}>
            <ActivityIndicator size={60} color="#ed7d18" />
          </View>
        )}

        {/* Contenido principal */}
        {!loading && (
          <View>
            {encuestasUsuario!.length > 0 ? (
              encuestasUsuario!.map((encuesta: any, index) => (
                
                  <TouchableOpacity
                    key={index}
                    style={styles.encuestaCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      props.navigation.navigate(
                        'EncuestaResolveScreen',
                        { encuesta: encuesta },
                      );
                    }}>
                    <View style={{ flex: 1 }}>
                      <Marcas name={encuesta.name} />
                    </View>
                  </TouchableOpacity>
              ))
            ) : (
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  paddingTop: '50%',
                }}>
                {connectedWifi ? (
                  <>
                    <Icon
                      name="hand-peace"
                      size={180}
                      color="#c4c3c4"
                    />
                    <Text style={{ fontSize: 22, fontWeight: 'bold',color: '#888',}}>
                      BIEN! NADA PENDIENTE
                    </Text>
                  </>
                ) : (
                  <>
                    <Image
                      style={{width:140, height:140}}
                      source={require('../assets/sademoji.gif')}
                    />
                    <Text style={{ fontSize: 19, fontWeight: '400', marginTop:'3%', color: '#888' }}>
                      NO HAY CONEXION A INTERNET
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <View style={styles.containerPositionButton}>
        <IconButton
          icon="home"
          iconColor="#ed7d18"
          size={50}
          onPress={() => props.navigation.goBack()}
        />
      </View>
    </View>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  encuestaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginBottom: 18,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4, // Sombra Android
    shadowColor: '#000', // Sombra iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    position: 'relative',
  },

  containerPositionButton: {
    position: 'absolute',
    width: '30%',
    height: 55,
    bottom: '3%',
    borderTopRightRadius: 40,
    alignItems: 'flex-start',
  },
  containerIndicator: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '60%',
  },
});
