import React from 'react';
import { View,StyleSheet, Text } from 'react-native';

interface ProductsProps {
   title: string,
   description: string,
}
export default function ProductMarca(props: ProductsProps) {
   return (
    <View style={styles.containerMarca}>
        <Text style={styles.titleMarca}>{props.title}</Text>
        <Text style={styles.descriptionMarca}>{props.description}</Text>
    </View>
   );
}

const styles = StyleSheet.create({
    containerMarca: {
      width: '96%',
      flexDirection: 'column',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      borderColor: '#c1c1c1',
      borderWidth: 1,
      borderRadius:10,
      marginVertical:2,
      marginLeft:5,
    },
    titleMarca: {
       color: '#837c79',
       fontSize: 18,
       fontWeight: 'bold',
    },
    descriptionMarca: {
        color: '#888',
        fontSize: 16,
        marginVertical: 10,
     },
});
