/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { View,StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
interface Props {
    inconName: string,
    onPress: () => void,
    style?: StyleProp<ViewStyle>


}
export default function FabButton(props: Props) {
   return (
    <View style={{...props.style as any}}>
       <TouchableOpacity
          activeOpacity={0.8}
          onPress={props.onPress}
          style={styles.blackButton}>
          <Icon
          name={props.inconName}
          size={35} color="#fff" />
       </TouchableOpacity>
    </View>
   );
}

const styles = StyleSheet.create({
    blackButton: {
        zIndex: 999,
        height: 50,
        width: 50,
        backgroundColor: 'black',
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6,
    },
});
