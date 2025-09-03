import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Modal } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Options {
    isModalOpen: boolean;
    setIsModalOpen: any;
    title: string,
    description: string,
    section: string,
    nav: StackNavigationProp<RootStackParamList, any, undefined>,
}
export const ModalEvaOEnc = (props: Options) => {

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
                        <View style={{ width: '100%', backgroundColor: '#ed7d18', flexDirection: 'row', height: 40, borderBottomLeftRadius:10, borderBottomRightRadius:10, }}>
                            <View style={{ width: '50%', paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={{ fontSize: 18, color: '#f2f2f6' }}>{props.section}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleOutsidePress()}
                                style={{
                                    width: '50%',
                                    height: 40,
                                    backgroundColor: '#ed7d18',
                                    justifyContent: 'center',
                                    alignItems: 'flex-end',
                                    paddingRight: 14,
                                    borderBottomRightRadius:10, 
                                }}>
                                <Icon name="close" size={28} color="#f2f2f6" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.containerTitle}>
                            <Text style={styles.tittle}>{props.title}</Text>
                        </View>
                        <View style={styles.containerTitle}>
                            <Text style={styles.textModal}>{props.description}</Text>
                        </View>
                        <View style={styles.containerPositionButton}>
                            <View style={styles.containerButtonModal}>
                                <Button
                                    mode="text"
                                    labelStyle={styles.buttonFont}
                                    textColor="#ed7d18"
                                    onPress={() => {
                                        props.setIsModalOpen(false);
                                    }}>
                                    NO
                                </Button>
                                <Button
                                    mode="text"
                                    labelStyle={styles.buttonFont}
                                    textColor="#ed7d18"
                                    onPress={() => {
                                        if (props.section === 'Evaluacion') {
                                            props.setIsModalOpen(false);
                                            props.nav.navigate('EvaluacionesScreen');
                                        } else {
                                            props.nav.navigate('EncuestasScreen');
                                            props.setIsModalOpen(false);
                                        }
                                    }}>
                                    SI
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
    textContainer: {
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        marginTop: '8%',
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
        width: '100%',
        marginHorizontal: 10,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginVertical: '5%',
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
