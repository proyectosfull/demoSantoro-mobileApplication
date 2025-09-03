/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';

interface ItemMenuProps {
    name: string;
    iconName: any;
    blocked?: boolean;
}


export default function PreMenuCardOptions2(props: ItemMenuProps) {

    const containerStyle = props.blocked
        ? styles.containerBlocked
        : styles.container;

    return (
        <View style={containerStyle}>
            <Image
                style={{ width: '70%', height: '70%', resizeMode: 'contain', marginBottom: -5 }}
                source={props.iconName}
            />
            <Text style={styles.itemName}>{props.name}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '95%',
        height: '100%',
        borderRadius: 20,
        borderColor: '#c1c1c1',
        borderTopWidth: 1,
        borderLeftWidth: 3,
        borderRightWidth: 1,
        borderBottomWidth: 3,
        flexDirection: 'column',
        alignItems: 'center', // Centra horizontalmente
        justifyContent: 'center', // Centra verticalmente
    },
    containerBlocked: {
        width: '95%',
        height: '100%',
        borderRadius: 20,
        borderColor: '#c1c1c1',
        borderTopWidth: 1,
        borderLeftWidth: 3,
        borderRightWidth: 1,
        borderBottomWidth: 3,
        backgroundColor: '#fafbfd',
        flexDirection: 'column',
        alignItems: 'center', // Centra horizontalmente
        justifyContent: 'center', // Centra verticalmente
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
        fontSize: 20,
        fontWeight: '500',
        fontStyle: 'italic',
    },
});
