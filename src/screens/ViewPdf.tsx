/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import Pdf from 'react-native-pdf';
import { IconButton } from 'react-native-paper';


type Props = StackScreenProps<RootStackParamList, 'ViewPdf'>;
export default function ViewPdf(props: Props) {
    const { multimedia } = props.route.params;
    console.log(multimedia)
    const source = {
        uri: encodeURI(multimedia),
        cache: true,
        method: 'GET',
        strictSSL: false, // Ajusta strictSSL a false para deshabilitar la verificación SSL
    };

    return (
        <View style={styles.container}>
            <Pdf
                trustAllCerts={false}
                spacing={10}
                source={source}
                renderActivityIndicator={() => <ActivityIndicator color="black" size="large" />}
                onLoadComplete={(numberOfPages, filePath) => {
                    console.log(`Number of pages: ${numberOfPages}`);
                }}
                onPageChanged={(page, numberOfPages) => {
                    console.log(`Current page: ${page}`);
                }}
                onError={(error) => {
                    console.log(error);
                }}
                onPressLink={(uri) => {
                    console.log(`Link pressed: ${uri}`);
                }}
                style={styles.pdf} />
            <View style={styles.containerPositionButton}>
                <IconButton
                    icon="arrow-left-thick"
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
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
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
      buttonFont: {
        fontWeight: 'bold',
        fontSize: 16,
      },

});
