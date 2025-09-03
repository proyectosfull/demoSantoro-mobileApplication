/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';

interface ItemMenuProps {
  name: string;
  iconName: any;
  blocked?: boolean;
}


export default function PreMenuCardOptions(props: ItemMenuProps) {

  const containerStyle = props.blocked
    ? styles.containerBlocked
    : styles.container;

  return (
    <View style={containerStyle}>
      <View style={styles.containerLeft}>
        <Image
          style={{ width: '70%', height: '70%' }}
          source={props.iconName}
        />
      </View>
      <View style={styles.containerCenter}>
        <Text style={styles.itemName}>{props.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 100,
    width: '95%',
    marginLeft: 10,
    marginVertical: 11,
    borderColor: '#c1c1c1',
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderRadius: 10,
  },
  containerBlocked: {
    flexDirection: 'row',
    height: 100,
    width: '95%',
    marginLeft: 10,
    marginVertical: 11,
    borderColor: '#fafbfd',
    backgroundColor: '#fafbfd', // Cambia el color de fondo a gris cuando blocked es true
    borderWidth: 0.5,
    borderRadius: 10,
  },
  containerLeft: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: '5%',
    width: '35%',
  },
  containerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
    marginLeft: -15,
  },
  containerRight: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '25%',
  },
  itemName: {
    color: '#837c79',
    fontSize: 23,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});
