/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    ActivityIndicator,
    Platform,
    ToastAndroid,
    Alert
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import Pdf from 'react-native-pdf';
import { Button, IconButton } from 'react-native-paper';
import NetworkService from '../utils/Conection';
import Snackbar from 'react-native-snackbar';
import axios from 'axios';
import TrustValueApi from '../network/TrustValueApi';
import Evidences from '../models/Evidences';
import RNFS from 'react-native-fs';



type Props = StackScreenProps<RootStackParamList, 'VerReportesSimulador'>;
export default function VerReportesSimulador(props: Props) {
    const { urlPdf } = props.route.params;
    const partes = urlPdf!.split('/');
    const [horaActual, setHoraActual] = useState('');
    // Obtiene el último valor (después de la última diagonal)
    const ultimoValor = partes[partes.length - 1];
    const tempFilePath = Platform.OS === 'android' ? `file:///data/user/0/com.impaktoapp/cache/${ultimoValor}` : urlPdf;
    // Configura la orientación en modo horizontal
    const source = {
        uri: urlPdf,
        cache: true,
        method: 'GET',
        strictSSL: true, // Ajusta strictSSL a false para deshabilitar la verificación SSL
    };
    const [loading, setLoading] = useState(false);
    const [asist, setAsist] = useState(false);

    const getAsistenciaValue = async () => {
        try {
            NetworkService.init();
            const finishDay = await NetworkService.getDataLocally('finishDay');
            console.log('FinishDay es = ' + finishDay)
            const valueAsist = finishDay === 'true' ? true : false;
            setAsist(valueAsist);
            await NetworkService.init();
        } catch (error) {
            console.error('Error al obtener el valor de AsyncStorage:', error);
        }
    };


const obtenerFechaHoraUTC = async () => {
    try {
      const respuesta = await fetch('https://worldtimeapi.org/api/ip');
      const datos = await respuesta.json();
      setHoraActual(datos.datetime);
    } catch (error) {
      console.error('Error al obtener la fecha y hora UTC:', error);
      return null;
    }
  };

    const sendEvidencePdf = async () => {
        NetworkService.init();
        if (
            NetworkService.isConnected === true &&
            NetworkService.isInternetReacheable === true
        ) {
            if (Platform.OS === 'android') {
                await RNFS.copyFile(urlPdf!, tempFilePath!);
            }
            console.log('entre aqui');
            console.log(tempFilePath);
            setLoading(true);
            const objectEvidencePdf: Evidences = {
                asunto: 'Reporte Simulador' + ultimoValor,
                mensaje: 'Reporte del Simulador de ventas del mes',
                multimedia: {
                    photos: [
                        {
                            uri: tempFilePath,
                            type: 'application/pdf',
                            name: ultimoValor,
                        },
                    ],
                    videos: [],
                }
            }
            console.log('forme el objeto');
            console.log(objectEvidencePdf.multimedia?.photos);
            try {
                const response = await new TrustValueApi().sendEvidences(
                    objectEvidencePdf,
                    horaActual.replace('T', ' ').substring(0, 19)
                );
                console.log(response);
                if (
                    response.status === 200 || response.status === 201
                ) {
                    setLoading(false);
                    if (Platform.OS === 'android') {
                        ToastAndroid.show(
                            'Se envió su evidencia correctamente',
                            ToastAndroid.SHORT,
                        );
                        props.navigation.navigate('MenuScreen');
                    } else {
                        Snackbar.show({
                            text: 'Se envió su evidencia correctamente',
                            duration: Snackbar.LENGTH_LONG,
                            textColor: '#ed7d18',
                        });
                        props.navigation.navigate('MenuScreen');
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
                props.navigation.navigate('MenuScreen');
            } else {
                Snackbar.show({
                    text: 'No tiene conexion a una red, intente mas tarde',
                    duration: Snackbar.LENGTH_LONG,
                    textColor: '#ed7d18',
                });
                props.navigation.navigate('MenuScreen');
            }
        }
    };

    useEffect(() => {
        getAsistenciaValue();
        obtenerFechaHoraUTC();
    }, []);

    return (
        <View style={styles.container}>
            <Pdf
                trustAllCerts={false}
                spacing={10}
                source={source}
                renderActivityIndicator={() => <ActivityIndicator color="black" size="large" />}
                onLoadComplete={(numberOfPages, filePath) => {
                    console.log(`Number of pages: ${numberOfPages}`);
                }}
                onPageChanged={(page, numberOfPages) => {
                    console.log(`Current page: ${page}`);
                }}
                onError={(error) => {
                    console.log(error);
                }}
                onPressLink={(uri) => {
                    console.log(`Link pressed: ${uri}`);
                }}
                style={styles.pdf} />

            <View style={{ ...styles.sendEvidence, backgroundColor: '#ed7d18' }}>
                <Button
                    mode="text"
                    loading={loading}
                    icon="send"
                    onPress={() => {
                        if( asist === false) { 
                            sendEvidencePdf();
                          } else {
                            Alert.alert(
                              'No hay asistencia',
                              'Para poder enviar evidencias, es necesario enviar asistencia antes.',
                              [
                                {
                                  text: 'OK',
                                },
                              ],
                              { cancelable: false }
                            );
                          }
                    }  }
                    textColor="#f2f2f6"
                    labelStyle={{
                        fontWeight: 'bold',
                        fontSize: 19,
                    }}>
                    ENVIAR EVIDENCIA
                </Button>
            </View>

            <View style={styles.containerPositionButton}>
                <IconButton
                    icon="arrow-left-thick"
                    iconColor="#fff"
                    size={30}
                    onPress={() => {
                        props.navigation.goBack()
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        flexDirection: 'column',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    containerPositionButton: {
        position: 'absolute',
        width: '30%',
        height: 55,
        bottom: 0,
        borderTopRightRadius: 40,
        backgroundColor: '#ed7d18',
        alignItems: 'center',
    },
    buttonFont: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    sendEvidence: {
        zIndex: 999,
        height: 50,
        width: 250,
        backgroundColor: '#ed7d18',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        top: '-25%',
        left: '20%',
    },

});