import React from 'react';
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {RootStackParamList} from '../routes/ParamList';
import Header from '../components/Header';
import CardMarcas from '../components/CardMarcas';
import {IconButton} from 'react-native-paper';

type Props = StackScreenProps<RootStackParamList, 'MarcasDataScreen'>;
export default function MarcasDataScreen(props: Props) {
  return (
    <View style={styles.container}>
      <Header texto="Carolina Herrera" />
      <ScrollView>
        <TouchableOpacity
          onPress={() => props.navigation.navigate('ProductMarcaDataScreen')}>
          <CardMarcas
            name="212"
            age="1997"
            gender="F"
            pronuntiation="tu guan tu"
            imageProduct={require('../assets/producto.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => props.navigation.navigate('ProductMarcaDataScreen')}>
          <CardMarcas
            name="212"
            age="1997"
            gender="F"
            pronuntiation="tu guan tu"
            imageProduct={require('../assets/producto.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => props.navigation.navigate('ProductMarcaDataScreen')}>
          <CardMarcas
            name="212"
            age="1997"
            gender="F"
            pronuntiation="tu guan tu"
            imageProduct={require('../assets/producto.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => props.navigation.navigate('ProductMarcaDataScreen')}>
          <CardMarcas
            name="212"
            age="1997"
            gender="F"
            pronuntiation="tu guan tu"
            imageProduct={require('../assets/producto.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => props.navigation.navigate('ProductMarcaDataScreen')}>
          <CardMarcas
            name="212"
            age="1997"
            gender="F"
            pronuntiation="tu guan tu"
            imageProduct={require('../assets/producto.png')}
          />
        </TouchableOpacity>
        
      </ScrollView>
      <View style={styles.containerPositionButton}>
        <IconButton
          icon="home"
          iconColor="#fff"
          size={30}
          onPress={() => props.navigation.goBack()}
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
});
