/* eslint-disable @typescript-eslint/no-unused-vars */
import { StackScreenProps } from '@react-navigation/stack';
import React from 'react';
import {StyleSheet, View } from 'react-native';
import { RootStackParamList } from '../routes/ParamList';
import Map from '../components/Map';


type Props = StackScreenProps<RootStackParamList, 'PermissionsScreen'>;
export default function PermissionsScreen(props: Props) {

    return (
        <View style={styles.container}>
           <Map />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    buttonContainer: {
        width: '100%',
        borderColor: '#00e400',
        borderWidth: 5,
        marginTop: '15%',
        borderRadius: 10,
    },
    buttonFont: {
        fontWeight: 'bold',
        fontSize: 20,
    },

});
