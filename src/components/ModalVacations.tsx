
import React, { useState } from 'react';
import { View, StyleSheet, Text, Platform, ToastAndroid, TouchableOpacity } from 'react-native';
import { Modal } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import { Button } from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import { add, format } from 'date-fns';
import Snackbar from 'react-native-snackbar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetworkService from '../utils/Conection';
import axios from 'axios';
import TrustValueApi from '../network/TrustValueApi';
import LaboralAbsences from '../models/LaboralAbsences';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Options {
  isModalOpen: boolean;
  setIsModalOpen: any;
  nav: StackNavigationProp<RootStackParamList, 'PreMenuScreen', undefined>;
}

export const ModalVacations = (props: Options) => {
  const [firstDate, setFirstDate] = useState('');
  const [secondDate, setSecondDate] = useState('');
  const [openSecondDate, setOpenSecondDate] = useState(false);
  const [openFirstDate, setOpenFirstDate] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendLaboralAbsence = async () => {
    NetworkService.init();
    if (
      NetworkService.isConnected === true &&
      NetworkService.isInternetReacheable === true
    ) {
      try {
          setLoading(true);
          const auxObjectLaboralAbsence: LaboralAbsences = {
            razon: 'vacaciones',
            descripcion: '',
            evidencia: {
              name:'',
              type:'',
              uri:'',
            },
            inicioVacaciones: firstDate,
            finVacaciones: secondDate,
          };
          console.log(auxObjectLaboralAbsence);
          const response = await new TrustValueApi().sendLaboralAbsences(
            auxObjectLaboralAbsence,
          );
          if ((response.status === 200 || response.status === 201) && response.data.status === 1) {
            AsyncStorage.setItem('preMenuCheck', 'true');
            AsyncStorage.setItem('absence', 'true');
            setFirstDate('');
            setSecondDate('');
            setLoading(false);
            if (Platform.OS === 'android') {
              ToastAndroid.show(
                'Su solicitud de vacaciones es ha sido enviada, continue navegando',
                ToastAndroid.SHORT,
              );
              props.setIsModalOpen(false);
              props.nav.navigate('MenuScreen');
              console.log(response.data);
              console.log(response.data.errors);
            } else {
              Snackbar.show({
                text: 'Su solicitud de vacaccio es ha sido enviada, continue navegando',
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
              text: response.data.errors[0],
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
    <View>
      <Modal
        visible={props.isModalOpen}
        transparent={true}
        animationType={'slide'}>
        <View style={styles.fondo}>
          <View style={styles.modalCancel}>
            <View style={styles.titleContainer}>
              <View style={{ width: '20%', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="calendar" size={30} color="#fff" />
              </View>
              <View style={{ width: '80%', flexDirection:'row', justifyContent:'space-around', alignItems:'center' }}>
                <Text style={styles.titleStyle}>
                  VACACIONES
                </Text>
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
            <View style={styles.containerTitle}>
              <Text style={styles.tittle}>
                Pulsa los botones Fecha (Inicio y Final) para seleccionar la
                fecha de tus vacaciones
              </Text>
            </View>
            <View style={styles.containerDates}>
              <View style={styles.buttonContainerDate}>
                <Button
                  mode="text"
                  icon="calendar"
                  onPress={() => setOpenFirstDate(true)}
                  textColor="#ed7d18"
                  labelStyle={styles.buttonFont}>
                  FECHA INICIO: {firstDate}
                </Button>
              </View>
              <DatePicker
                modal
                open={openFirstDate}
                date={new Date()}
                minimumDate={new Date()}
                mode="date"
                locale="es"
                onConfirm={fecha => {
                  const dateFormat = format(
                    add(fecha, { days: 0 }),
                    'yyyy-MM-dd',
                  );
                  setFirstDate(dateFormat);
                  setOpenFirstDate(false);
                }}
                onCancel={() => {
                  setOpenFirstDate(false);
                }}
              />
              <View style={styles.containerRight}>
                <View style={styles.containerTextDate}>
                  <Text style={styles.textModal}>{firstDate}</Text>
                </View>
              </View>
            </View>
            <View style={styles.containerTitle}>
              <Text style={{ ...styles.textModal, alignSelf: 'center' }}>
                Primer dia que gozas de Vacaciones
              </Text>
            </View>
            <View style={styles.containerDates}>
              <View style={styles.buttonContainerDate}>
                <Button
                  mode="text"
                  icon="calendar"
                  onPress={() => setOpenSecondDate(true)}
                  textColor="#ed7d18"
                  labelStyle={styles.buttonFont}>
                  FECHA FINAL: {secondDate}
                </Button>
              </View>
              <DatePicker
                modal
                open={openSecondDate}
                date={new Date()}
                mode="date"
                locale="es"
                onConfirm={fecha => {
                  const dateFormat = format(
                    add(fecha, { days: 0 }),
                    'yyyy-MM-dd',
                  );
                  setSecondDate(dateFormat);
                  setOpenSecondDate(false);
                }}
                onCancel={() => {
                  setOpenSecondDate(false);
                }}
              />
            </View>
            <View style={styles.containerTitle}>
              <Text style={{ ...styles.textModal, alignSelf: 'center' }}>
                Dia que te presentas en tienda
              </Text>
            </View>
            <View style={styles.containerPositionButton}>
              <Button
                mode="text"
                loading={loading}
                onPress={() => {
                  if (firstDate === '' || secondDate === '') {
                    Snackbar.show({
                      text: 'Debe seleccionar ambas fechas',
                      duration: Snackbar.LENGTH_LONG,
                      textColor: '#fff',
                    });
                  } else {
                    sendLaboralAbsence();
                  }
                }}
                textColor="#fff"
                labelStyle={styles.buttonFont}>
                ENVIAR
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const styles = StyleSheet.create({
  fondo: {
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCancel: {
    width: '90%',
    paddingHorizontal: 20,
    flexDirection: 'column',
    backgroundColor: '#fff',
    elevation: 5,
    justifyContent: 'space-around',
    height: '50%',
    marginHorizontal: '5%',
    borderRadius: 10,
  },
  containerTitle: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginVertical: '5%',
  },
  tittle: {
    color: '#888',
    fontSize: 16,
    fontWeight: '400',
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
  titleStyle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  containerDates: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  containerLeft: {
    alignItems: 'center',
    width: '50%',
  },
  containerRight: {
    alignItems: 'center',
    width: '50%',
  },
  containerTextDate: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  textModal: {
    color: '#888',
    fontSize: 16,
    fontWeight: '400',
  },
  containerPositionButton: {
    marginTop: 'auto',
    width: '100%',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: '7%',
    borderWidth: 2,
    borderColor: '#ed7d18',
    borderRadius: 20,
  },
  buttonContainerDate: {
    width: '100%',
    borderColor: '#ed7d18',
    borderWidth: 1.4,
    borderRadius: 10,
  },
  buttonFont: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#ed7d18',
  },
});
