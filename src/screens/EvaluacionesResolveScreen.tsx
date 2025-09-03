/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, {useCallback, useState} from 'react';
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
import Marcas from '../components/Marcas';
import Header from '../components/Header';
import {
  Button,
  IconButton,
  RadioButton,
  Dialog,
  Portal,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Snackbar from 'react-native-snackbar';
import axios from 'axios';
import TrustValueApi from '../network/TrustValueApi';
import AnswerEvaluation from '../models/AnswerEvaluation';
import NetworkService from '../utils/Conection';

type Props = StackScreenProps<RootStackParamList, 'EvaluacionResolveScreen'>;
export default function EvaluacionResolveScreen(props: Props) {
  const evaluation = props.route.params.evaluacion.evaluation_questions;
  const evaluationResponse = props.route.params.evaluacion;
  const [isEvaluationResponded, setIsEvaluationResponded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState(
    evaluation.map(() => false),
  );
  const [respuestas, setRespuestas] = useState(
    new Array(evaluation.length).fill(null),
  );
  const [correctResponses, setCorrectResponses] = useState(
    new Array(evaluation.length).fill(null),
  );
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [calification, setCalification] = useState(0);
  const [visible, setVisible] = React.useState(false);

  const showDialog = () => setVisible(true);

  const hideDialog = () => setVisible(false);

  const handleRespuesta = (index: number, value: number | string | null) => {
    if (!isEvaluationResponded) { // Verifica si la evaluación no ha sido respondida
      const nuevasRespuestas = [...respuestas];
      nuevasRespuestas[index] = value;
      setRespuestas(nuevasRespuestas);
    }
  };

  const toggleExpandItem = (index: number) => {
    const newExpandedItems = [...expandedItems];
    newExpandedItems[index] = !newExpandedItems[index];
    setExpandedItems(newExpandedItems);
  };

  const verificarRespuestas = async () => {
    let cont = 0;
    const arrayRespuestasCorrectas = [];
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
          const answerSurveys: AnswerEvaluation = {
            evaluation_id: evaluationResponse.id,
            answer: respuestas,
          };
          const response = await new TrustValueApi().answerEvaluation(
            answerSurveys,
          );
          if (
            (response.status === 200 || response.status === 201) &&
            response.data.status === 1
          ) {
            setLoading(false);
            for (let i = 0; i < evaluation.length; i++) {
              const pregunta = evaluation[i];
              const respuestaSeleccionada = respuestas[i];
              // Compara la respuesta seleccionada con la respuesta correcta
              if (respuestaSeleccionada === pregunta.correct_answer) {
                // Si son iguales, incrementa el contador de respuestas correctas y actualiza el estado a true
                cont++;
                arrayRespuestasCorrectas[i] = true;
              } else {
                // Actualiza el estado a false
                arrayRespuestasCorrectas[i] = false;
              }
            }
            setCorrectResponses(arrayRespuestasCorrectas);
            setCorrectAnswers(cont);
            const result = ((cont / respuestas.length) * 10).toFixed(2);
            setCalification(parseFloat(result));
            showDialog();
            setIsEvaluationResponded(true);
          } else {
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
        {evaluation!.map((item: any, index: number) => (
          <View key={index} style={styles.containerPregunta}>
            <View style={styles.containerInnerPregunta}>
              <View style={styles.containerLeft}>
                <Text style={styles.textPregunta}>{item.question}</Text>
              </View>
              {/* <View style={styles.containerRight}>
                <Icon
                  name={expandedItems[index] ? 'chevron-up' : 'chevron-down'}
                  size={26}
                  color="#888"
                  onPress={() => {
                    toggleExpandItem(index); // Solo cambia el estado si es boolean
                  }}
                />
              </View> */}
            </View>

              <View style={{padding: 10}}>
                <View
                  style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <RadioButton.Android
                      value="a"
                      status={
                        respuestas[index] === 'a' ? 'checked' : 'unchecked'
                      }
                      onPress={() => {
                        handleRespuesta(index, 'a');
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        color: '#888',
                        fontStyle: 'italic',
                      }}>
                      a) {item.answer_a}
                    </Text>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <RadioButton.Android
                      value="b"
                      status={
                        respuestas[index] === 'b' ? 'checked' : 'unchecked'
                      }
                      onPress={() => {
                        handleRespuesta(index, 'b');
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        color: '#888',
                        fontStyle: 'italic',
                      }}>
                      b) {item.answer_b}
                    </Text>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <RadioButton.Android
                      value="c"
                      status={
                        respuestas[index] === 'c' ? 'checked' : 'unchecked'
                      }
                      onPress={() => {
                        handleRespuesta(index, 'c');
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        color: '#888',
                        fontStyle: 'italic',
                      }}>
                      c) {item.answer_c}
                    </Text>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <RadioButton.Android
                      value="d"
                      status={
                        respuestas[index] === 'd' ? 'checked' : 'unchecked'
                      }
                      onPress={() => {
                        handleRespuesta(index, 'd');
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        color: '#888',
                        fontStyle: 'italic',
                      }}>
                      d) {item.answer_d}
                    </Text>
                  </View>

                  {isEvaluationResponded && (
                    <View
                      style={{
                        width: '100%',
                        flexDirection: 'column',
                        marginTop: '1%',
                      }}>
                      <View
                        style={{
                          width: '100%',
                          padding: 10,
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                          backgroundColor:
                            correctResponses[index] === true
                              ? '#C8E6C9'
                              : '#FFCDD2',
                          borderLeftWidth: 3,
                          borderLeftColor:
                            correctResponses[index] === true ? 'green' : 'red',
                        }}>
                        <Text style={{color: '#888'}}>Respuesta Correcta: ({item.correct_answer})</Text>
                      </View>
                      <Text>Comentario: {item.comment}</Text>
                    </View>
                  )}
                </View>
              </View>

          </View>
        ))}
      </ScrollView>
      {isEvaluationResponded === false ? (
        <View style={styles.containerPositionRightButton}>
          <Button
            mode="text"
            loading={loading}
            disabled={loading}
            onPress={() => verificarRespuestas()}
            textColor="#f2f2f6"
            labelStyle={{
              fontWeight: 'bold',
              fontSize: 19,
            }}>
            ENVIAR
          </Button>
        </View>
      ) : (
        <View style={styles.containerPositionButton}>
          <IconButton
            icon="arrow-left-thick"
            iconColor="#fff"
            size={30}
            onPress={() => props.navigation.goBack()}
          />
        </View>
      )}
      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title>Calificacion: {calification}</Dialog.Title>
          <Dialog.Content>
            <Text style={{fontSize: 18, color:'#888'}}>
              Respuestas correctas: {correctAnswers}/{respuestas.length}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    width: '30%',
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
    paddingVertical: 6,
    paddingLeft: 5,
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
    fontWeight: '500',
  },
});
