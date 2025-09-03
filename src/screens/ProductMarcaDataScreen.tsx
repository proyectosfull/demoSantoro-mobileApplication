/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import { Button, IconButton } from 'react-native-paper';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';



type Props = StackScreenProps<RootStackParamList, 'ProductMarcaDataScreen'>;
export default function ProductMarcaDataScreen(props: Props) {
  const { ficha } = props.route.params;
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [showFullIngredients, setShowFullIngredients] = useState(false);
  const [showFullConcept, setShowFullConcept] = useState(false);
  
  const handleImagePress = () => {
    setIsViewerVisible(true);
  };
  const handleCloseViewer = () => {
    setIsViewerVisible(false);
  };

  //ficha.ingredients = "Fragancia fresca, aromática y salvaje al principio, con una chispa fresca y un sutil matiz de contraste cálido y picante. En el fondo maderas exóticas y notas ligeramente balsámicas."

  const checkIngredients = () => {
    if (ficha.ingredients.length <= 120 || showFullIngredients) {
      return (
        <Text style={{ fontSize: 16, color: '#888' }}>{ficha.ingredients}</Text>
      );
    } else {
      return (
        <View>
          <Text style={{ fontSize: 16, color: '#888' }}>
            {ficha.ingredients.substring(0, 121)}{"... "}
          </Text>
          <Text
            style={{ color: '#ed7d18', fontSize: 16, textDecorationLine: 'underline' }}
            onPress={() => {
              setShowFullIngredients(true);
            }}
          >
            (Ver más...)
          </Text>
        </View>
      );
    }
  };
  
  const checkConcept = () => {
    if (ficha.concept.length <= 120 || showFullConcept) {
      return (
        <Text style={{ fontSize: 16, color: '#888' }}>{ficha.concept}</Text>
      );
    } else {
      return (
        <View>
          <Text style={{ fontSize: 16, color: '#888' }}>
            {ficha.concept.substring(0, 121)}{"... "}
          </Text>
          <Text
            style={{ color: '#ed7d18', fontSize: 16, textDecorationLine: 'underline' }}
            onPress={() => {
              setShowFullConcept(true);
            }}
          >
            (Ver más...)
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.containerImage}
        onPress={() => {
          handleImagePress();
        }}>
        <Image
          source={{uri: ficha.image}}
          style={styles.imageAsist}
        />
      </TouchableOpacity>
      <ScrollView style={{marginBottom:'15%'}}>
        <View style={styles.containerDataProduct}>
          <View style={styles.rowDataProduct}>
            <Text style={{ fontWeight: 'bold', fontSize: 26, color: '#ed7d18' }}>{ficha.name}</Text>
            <Text>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#837c79' }}>Detalles: </Text>
              <Text style={{ fontSize: 16, color: '#888' }}>{ficha.keywords}</Text>
            </Text>
          </View>

          <View style={{ ...styles.rowDataProduct, marginTop: '3%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 26, color: '#ed7d18' }}>{ficha.brand.company.name}</Text>
            <Text>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#837c79' }}>Marca: </Text>
              <Text style={{ fontSize: 16, color: '#888' }}>{ficha.brand.name}</Text>
            </Text>
          </View>

          <View style={{ ...styles.rowDataProduct, marginTop: '3%' }}>
            <View style={{ flexDirection: 'column', width: '100%' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#888' }}>Características e Ingredientes</Text>
              {checkIngredients()}
            </View>
          </View>

          <View style={{ ...styles.rowDataProduct, marginTop: '3%' }}>
            <View style={{ flexDirection: 'column', width: '100%' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#888' }}>Concepto:  </Text>
              {checkConcept()}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.containerPositionButton}>
        <IconButton
          icon="arrow-left-thick"
          iconColor="#ed7d18"
          size={40}
          onPress={() => props.navigation.goBack()}
        />
      </View>
      <Modal
        visible={isViewerVisible}
        transparent={true}
        onRequestClose={handleCloseViewer}>
        <ImageViewer
          imageUrls={[
            {
              url:ficha.image || '',
              props: {
                source: { uri: ficha.image || '' },
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
    flexDirection: 'column',
  },
  containerImage: {
    width: '100%',
    height: '45%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e4e4e4',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderBottomColor: '#e4e4e4',
    borderBottomWidth: 2,
  },
  imageAsist: {
    width: '80%',
    height: '90%',
  },
  containerDataProduct: {
    width: '100%',
    flexDirection: 'column',
    marginTop:'5%',
  },
  rowDataProduct: {
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: '5%',
  },
  containerInfo: {
    width: '100%',
  },
  containerDescription: {
    width: '100%',
  },
  containerRight: {
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: '10%',
  },
  containerPositionButton: {
    position: 'absolute',
    width: '30%',
    height: 55,
    bottom: 0,
    alignItems: 'flex-start',
    paddingLeft:5,
    marginBottom:'2%'
  },
  buttonFont: {
    fontWeight: 'bold',
    fontSize: 16,
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
    height: '55%', // Establece la altura a 'auto' para que no se ajuste al teclado.
    marginHorizontal: '4%',
    borderColor: '#000',
    borderWidth: 1,
  },
});
