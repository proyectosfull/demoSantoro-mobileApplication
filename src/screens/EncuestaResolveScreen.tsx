
/* eslint-disable radix */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Platform,
  ToastAndroid,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../routes/ParamList';
import Header from '../components/Header';
import {Button, IconButton} from 'react-native-paper';
import {ModalEvaOEnc} from '../components/ModalEvaOEnc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 
import {RadioButton} from 'react-native-paper';
import TextInputError from '../components/TextInputError';
import Snackbar from 'react-native-snackbar';
import NetworkService from '../utils/Conection';
import TrustValueApi from '../network/TrustValueApi';
import axios from 'axios';
import AnswerSurvey from '../models/AnswerSurvey';

type Props = StackScreenProps<
  RootStackParamList,
  'EncuestaResolveScreen'
>;
export default function EncuestaResolveScreen(props: Props) {
  const encuesta = props.route.params.encuesta.questions;
  const encuestaResponse = props.route.params.encuesta;
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState(encuesta.map(() => false));
  const [respuestas, setRespuestas] = useState(
    new Array(encuesta.length).fill(null),
  );
  const [errores, setErrores] = useState(new Array(encuesta.length).fill(null));
  
  const handleRespuesta = (index: number, value: number | string | null) => {
    const nuevasRespuestas = [...respuestas];
    nuevasRespuestas[index] = value;
    setRespuestas(nuevasRespuestas);
  };

  const handleErrors = (index: number, value: string | null) => {
    const nuevosErrores = [...errores];
    nuevosErrores[index] = value;
    setErrores(nuevosErrores);
  };

  const toggleExpandItem = (index: number) => {
    const newExpandedItems = [...expandedItems];
    newExpandedItems[index] = !newExpandedItems[index];
    setExpandedItems(newExpandedItems);
  };

  const sendSurveysToServer = async () => {
    const hasNullResponses = respuestas.some(respuesta => respuesta === null);
    if (hasNullResponses) {
      Snackbar.show({
        text: 'Hay alguna pregunta sin responder, favor de responder todas',
        duration: Snackbar.LENGTH_LONG,
        textColor: '#ed7d18',
      });
    } else {
      NetworkService.init();
      if (
        NetworkService.isConnected === true &&
        NetworkService.isInternetReacheable === true
      ) {
        setLoading(true);
        try {
          const answerSurveys: AnswerSurvey = {
            survey_id: encuestaResponse.id,
            answer: respuestas,
          };
          console.log(answerSurveys);
          const response = await new TrustValueApi().answerSurvey(
            answerSurveys,
          );
          if (
            (response.status === 200 || response.status === 201) &&
            response.data.status === 1
          ) {
            setLoading(false);
            if (Platform.OS === 'android') {
              console.log('las respuestas son: ');
              console.log(respuestas);
              ToastAndroid.show(
                'Se enviaron sus respuestas exitosamente',
                ToastAndroid.SHORT,
              );
              props.navigation.navigate('MenuScreen');
            } else {
              console.log('las respuestas son: ');
              console.log(respuestas);
              Snackbar.show({
                text: 'Se enviaron sus respuestas exitosamente',
                duration: Snackbar.LENGTH_LONG,
                textColor: '#ed7d18',
              });
              props.navigation.navigate('EncuestasScreen');
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
    }
  };

  return (
    <View style={styles.container}>
      <Header texto="Categoria de preguntas" />
      <ScrollView style={{marginBottom: '15%'}}>
        {encuesta!.map((item: any, index: number) => (
          <View key={index} style={styles.containerPregunta}>
            <View style={styles.containerInnerPregunta}>
              <View style={styles.containerLeft}>
                <Text style={styles.textPregunta}>{item.name}</Text>
              </View>
            </View>

              <View style={{padding: 10}}>
                {item.is_boolean ? ( // Verifica si isBoolean es true
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <RadioButton.Android
                      value="Si"
                      status={respuestas[index] === 1 ? 'checked' : 'unchecked'}
                      onPress={() => {
                        handleRespuesta(index, 1);
                      }}
                    />
                    <Text style={{fontSize: 18, color: '#888'}}>Si</Text>
                    <RadioButton.Android
                      value="No"
                      status={respuestas[index] === 0 ? 'checked' : 'unchecked'}
                      onPress={() => {
                        handleRespuesta(index, 0);
                      }}
                    />
                    <Text style={{fontSize: 18, color: '#888'}}>No</Text>
                  </View>
                ) : (
                  // Si isBoolean no es true, muestra el TextInput
                  <View style={{alignItems: 'stretch', width: '100%'}}>
                    <TextInputError
                      keyboardType="numeric"
                      mode="outlined"
                      textColor="black"
                      label="Ingresa la cantidad (número entero)"
                      placeholder="Ingresa la cantidad (número entero)"
                      outlineColor="#c1c1c1"
                      style={{
                        backgroundColor: '#fff',
                        width: '95%',
                      }}
                      value={respuestas[index] !== null ? respuestas[index].toString() : ''}
                      onChangeText={text => {
                        if (/^[0-9]+$/.test(text)) {
                          console.log('Numero valido: ' + text);
                          handleErrors(index, null);
                          // Si tiene un formato numérico válido, llama a handleRespuesta con el valor convertido a número
                          handleRespuesta(index, parseInt(text));
                        } else {
                          handleErrors(
                            index,
                            'El valor ingresado no es un número entero.',
                          );
                          handleRespuesta(index, null);
                          console.log('No es un número válido: ' + text);
                        }
                      }}
                    />
                    {errores[index] && (
                      <Text style={styles.errorText}>{errores[index]}</Text>
                    )}
                  </View>
                )}
              </View>

          </View>
        ))}
      </ScrollView>
      <View style={styles.containerPositionButton}>
        <IconButton
          icon="arrow-left-thick"
          iconColor="#fff"
          size={30}
          onPress={() => props.navigation.goBack()}
        />
      </View>
      <View style={styles.containerPositionRightButton}>
        <Button
          mode="text"
          loading={loading}
          disabled={loading}
          onPress={() => sendSurveysToServer()}
          textColor="#f2f2f6"
          labelStyle={{
            fontWeight: 'bold',
            fontSize: 19,
          }}>
          ENVIAR
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  containerPositionButton: {
    position: 'absolute',
    width: '25%',
    height: 55,
    bottom: 0,
    borderTopRightRadius: 40,
    backgroundColor: '#ed7d18',
    alignItems: 'center',
  },
  containerPositionRightButton: {
    position: 'absolute',
    width: '35%',
    height: 55,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 40,
    backgroundColor: '#ed7d18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerPregunta: {
    flexDirection: 'column',
    width: '96%',
    borderRadius: 10,
    borderColor: '#c1c1c1',
    borderWidth: 1,
    marginVertical: 4,
    marginLeft: 5,
    paddingVertical:6,
    paddingLeft:5,
  },
  containerInnerPregunta: {
    flexDirection: 'row',
    width: '100%',
  },
  containerLeft: {
    width: '85%',
    padding: 5,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  containerRight: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textPregunta: {
    color: '#888',
    fontSize: 16,
    fontWeight: '400',
  },
  errorText: {
    color: 'red',
    marginLeft: '1%',
    marginTop: '-3%',
    fontWeight: 'bold',
  },
});
