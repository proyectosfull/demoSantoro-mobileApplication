/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, StyleSheet, Text} from 'react-native';

interface MarcasProps {
  name: string;
  content?: string;
}
export default function Marcas(props: MarcasProps) {
  return (
    <View style={styles.containerMarca}>
      <Text>
        <Text style={styles.textMarca}> {props.name}</Text>
        <Text style={{color:'#000', fontSize:16}}>{props.content}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  containerMarca: {
    width: '96%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 20,
    borderColor: '#c1c1c1',
    borderWidth: 1,
    marginVertical: 4,
    marginLeft: 5,
  },
  textMarca: {
    color: '#888',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
