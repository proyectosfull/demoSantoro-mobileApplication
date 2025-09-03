/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  ToastAndroid,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { Modal } from 'react-native';
import { Button } from 'react-native-paper';
import * as yup from 'yup';
import { Formik } from 'formik';
import TextInputError from '../components/TextInputError';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import Snackbar from 'react-native-snackbar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Options {
  isModalOpen: boolean;
  setIsModalOpen: any;
  nav: StackNavigationProp<RootStackParamList, 'UserInfoScreen', undefined>;
}
const motivoSchema = yup.object().shape({
  motivo: yup.string().required('El motivo es obligatorio'),
});
const windowWidth = Dimensions.get('window').width;
export const ModalBadData = (props: Options) => {
  const iconWidth = 0.07 * windowWidth;

  return (
    <Formik
      initialValues={{
        motivo: '',
      }}
      validationSchema={motivoSchema}
      onSubmit={values => {
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            '¡Se envió el motivo de los datos incorrectos con éxito!',
            ToastAndroid.SHORT
          );
          props.setIsModalOpen(false);
          props.nav.replace('PreMenuScreen');
        } else {
          props.setIsModalOpen(false);
          Snackbar.show({
            text: 'Se envió el motivo de los datos incorrectos con éxito',
            duration: Snackbar.LENGTH_LONG,
            textColor: '#ed7d18',
          });
          props.nav.replace('PreMenuScreen');
        }
      }}>
      {({ handleChange, handleBlur, handleSubmit, values, touched, errors }) => (
        <Modal
          visible={props.isModalOpen}
          transparent={true}
          animationType={'slide'}>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalCancel}>
              <View style={styles.titleContainer}>
                <View style={{ width: '20%', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name="close-circle-outline" size={iconWidth} color="#fff" />
                </View>
                <View style={{ width: '80%' }}>
                  <Text style={styles.titleStyle}>
                    DATOS INCORRECTOS
                  </Text>
                </View>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.textStyle}>
                  Escriba el motivo por el cual sus datos están incorrectos
                </Text>
              </View>
              <View style={styles.contenedorInputMotivo}>
                <TextInputError
                  mode="outlined"
                  label="Motivo"
                  textColor="black"
                  placeholder="Escribe el Motivo..."
                  style={styles.inputMotivo}
                  onChangeText={handleChange('motivo')}
                  onBlur={handleBlur('motivo')}
                  value={values.motivo}
                  touched={touched.motivo}
                  errorMessage={errors.motivo}
                />
              </View>
              <View style={styles.containerPositionButton}>
                <Button
                  mode="text"
                  onPress={() => {
                    handleSubmit();
                  }}
                  textColor="#fff"
                  labelStyle={styles.buttonFont}>
                  ENVIAR
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </Formik>
  );
};

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCancel: {
    width: '90%',
    borderRadius: 5,
    paddingHorizontal: 15,
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: '8%',
    backgroundColor: '#fff',
    elevation: 5,
    height: 'auto', // Establece la altura a 'auto' para que no se ajuste al teclado.
    marginHorizontal: '4%',
    borderColor: '#000',
    borderWidth: 1,
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
    color: '#f2f2f6',
    fontSize: 17,
    fontWeight: '500',
  },
  textContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginVertical: '3%',
  },
  textStyle: {
    color: '#888',
    fontSize: 16,
  },
  contenedorInputMotivo: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: '2%',
  },
  inputMotivo: {
    width: '100%',
    backgroundColor: '#fff',
    borderColor:'#c1c1c1',
  },
  containerPositionButton: {
    width: '100%',
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginTop: '1%',
    marginBottom:'12%',
    borderWidth:2,
    borderColor:'#ed7d18',
  },
  buttonFont: {
    fontWeight: 'bold',
    fontSize: 16,
    color:'#ed7d18',
  },
});
