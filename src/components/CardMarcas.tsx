import React from 'react';
import {View, StyleSheet, Text, Image} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ItemMenuProps {
  name: string;
  marca: string;
  empresa: string;
  pronuntiation?: string;
  imageProduct: any;
}

export default function CardMarcas(props: ItemMenuProps) {
  return (
    <View style={styles.container}>
      <View style={styles.containerLeft}>
        <Image source={{uri: props.imageProduct}} style={styles.image} />
      </View>
      <View style={styles.containerCenter}>
        <Text style={{color: '#888'}}>
          <Text style={styles.cardTextStyles}>Nombre:</Text > {props.name}
        </Text>
        <Text style={{color: '#888'}}>
          <Text style={styles.cardTextStyles}>Marca:</Text > {props.marca}
        </Text>
        <Text style={{color: '#888'}}>
          <Text style={styles.cardTextStyles}>Empresa:</Text > {props.empresa}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 100,
    width: '96%',
    marginLeft: 5,
    marginVertical: 3,
    borderColor: '#c1c1c1',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  containerLeft: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '25%',
    paddingHorizontal:'3%',
  },
  containerCenter:{
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '50%',
    marginLeft:15,

  },
  containerRight: {
    flexDirection:'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '25%',
  },
  cardTextStyles: {
    fontWeight: 'bold',
    color: '#888',
  },
  image: {
    width: '100%',
    height: 80,
    borderRadius: 10,
  },
});
