/* eslint-disable react-native/no-inline-styles */
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Modal } from 'react-native';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../routes/ParamList';

interface Options {
    isModalOpen: boolean;
    title: string,
    description: string,
    setIsModalOpen: any;
    iconName: string;
    section?: string;
    nav?: StackNavigationProp<RootStackParamList, any, undefined>
}

export const ModalInternet = (props: Options) => {

    const toggleModal = () => {
        props.setIsModalOpen(!props.isModalOpen);
      };

      const handleOutsidePress = () => {
        // Cierra el modal al hacer clic fuera de él
        if (props.isModalOpen) {
          toggleModal();
        }
      };

    return (
        <View>
            <Modal visible={props.isModalOpen} transparent={true} animationType={'slide'}>
                <View style={styles.fondo}>
                    <View style={styles.modalCancel}>
                        <View style={{ width: '100%', backgroundColor: '#ed7d18', flexDirection: 'row', height: 40, borderBottomLeftRadius:10,  borderBottomRightRadius:10,}}>
                            <View style={{ width: '50%', paddingHorizontal: 10, justifyContent: 'flex-start',alignItems:'center', flexDirection:'row'}}>
                                <Text style={{ fontSize: 18, color: '#f2f2f6' }}>{props.title}</Text>
                                <View style={{justifyContent:'center', alignItems:'center',marginLeft:10}}>
                                   <Icon name={props.iconName} size={22} color="#f2f2f6" />
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() =>handleOutsidePress()}
                                style={{
                                    width: '50%',
                                    height: 40,
                                    backgroundColor: '#ed7d18',
                                    justifyContent: 'center',
                                    alignItems: 'flex-end',
                                    paddingRight: 14,
                                    borderBottomRightRadius:10, 
                                }}>
                                <Icon name="close" size={22} color="#f2f2f6" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.containerTitle}>
                            <Text style={styles.textModal}>{props.description}</Text>
                        </View>
                        <View style={styles.containerPositionButton}>
                            <View style={styles.containerButtonModal}>
                                <Button
                                    mode="text"
                                    textColor="#ed7d18"
                                    labelStyle={styles.buttonFont}
                                    onPress={() => {
                                        if (props.section === 'Menu') {
                                            props.setIsModalOpen(false);
                                            props.nav?.navigate('MenuScreen');
                                        } else {
                                            props.setIsModalOpen(false);
                                        }
                                    }}>
                                    OK
                                </Button>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export const styles = StyleSheet.create({
    fondo: {
        justifyContent: 'center',
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalCancel: {
        width: '85%',
        flexDirection: 'column',
        alignItems: 'stretch',
        backgroundColor: '#fff',
        elevation: 5,
        height: '30%',
        marginHorizontal: '7%',
        borderRadius:10,
        paddingHorizontal:15,
    },
    textStyle: {
        color: '#888',
        fontSize: 18,
    },
    containerPositionButton: {
        marginTop: 'auto', // Empujar hacia la parte inferior
        width: '100%',
        paddingHorizontal: 10,
        paddingBottom: '5%',
    },
    containerButtonModal: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    containerTitle: {
        width: '90%',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginVertical: '5%',
        marginHorizontal:5,
    },
    tittle: {
        color: '#888',
        fontSize: 22,
        fontWeight: '700',
    },
    textModal: {
        color: '#888',
        fontSize: 18,
        fontWeight: '400',
    },
    buttonFont: {
        fontWeight: 'bold',
        fontSize: 20,
    },
});
