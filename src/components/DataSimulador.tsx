/* eslint-disable jsx-quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import TextInputError from './TextInputError';

interface DataSimuladorProps {
    onInputChange: any,
    tiendaName: string,
    objetivo: number,
}
export default function DataSimulador(props: DataSimuladorProps) {
    const [inputValue, setInputValue] = useState('');

    const handleInputChange = (text: any) => {
        setInputValue(text);
        props.onInputChange(text); // Llamar a la función proporcionada por el padre con el nuevo valor
    };
    return (
        <View style={styles.rowData}>
            <View style={styles.containerLeft}>
                <Text>
                    <Text style={styles.key}>Concepto:</Text> {props.tiendaName}
                </Text>
                <Text>
                    <Text style={styles.key}>Objetivo Vta:</Text> {props.objetivo}
                </Text>
            </View>
            <View style={styles.containerRight}>
                <TextInputError
                    placeholder='Venta Lograda'
                    label='Venta Lograda'
                    keyboardType="numeric"
                    mode="flat"
                    textColor="black"
                    outlineColor='#c1c1c1'
                    style={styles.inputStyle}
                    onChangeText={handleInputChange}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rowData: {
        flexDirection: 'row',
        width: '96%',
        marginLeft: '2%',
        height: 90,
    },
    containerLeft: {
        width: '40%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerRight: {
        width: '60%',
        height: '100%',
        alignItems:'stretch',
        paddingTop:'3.5%',
        paddingLeft:'3%',
    },
    key: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#7e2b05',
    },
    value: {
        fontSize: 14,
        color: 'black',
    },
    inputStyle: {
        backgroundColor: '#fff',
        width: '95%',
    },
    title: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
