
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import sqLite from 'react-native-sqlite-storage';
import NetworkService from '../utils/Conection';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';

interface ItemMenuProps {
  name: string;
  iconName: any;
  blocked?: boolean;
  existLocalData?: null | string;
  connectedWifi?: boolean | null;
  internetReacheable?: boolean | null;
  nav?: StackNavigationProp<RootStackParamList, any, undefined>
  pendientes?: number,
}

export default function CardMenu(props: ItemMenuProps) {
  const [openModalLocalData, setOpenModalLocalData] = useState(false);

  //cierra el modal de sesion
  const toggleModal = () => {
    setOpenModalLocalData(!openModalLocalData);
  };

  const handleOutsidePress = () => {
    // Cierra el modal al hacer clic fuera de él
    if (openModalLocalData) {
      toggleModal();
    }
  };

  const renderMenuIcon = () => {
    if (props.connectedWifi === true && props.internetReacheable === true) {
      return (
        <TouchableOpacity
          style={styles.buttonFixed}
          onPress={() => {
            if (props.name === "Evidencias") {
              props.nav?.navigate('SendDataLocalScreen');
            } else {
              if(props.name === 'Comunicados'){
                 props.nav?.navigate('ComunicadosScreen');
              } else if( props.name === 'Encuesta'){
                props.nav?.navigate('EncuestasScreen');
              } else if (props.name === 'Evaluacion') {
                props.nav?.navigate('EvaluacionesScreen');
              }
            }
          }}
        >
          {props.existLocalData !== undefined && props.name !== 'Evidencias' ? (
            <Icon name="bell-alert" size={30} color="#ed7d18" />
          ) : props.name !== "Evidencias" && props.pendientes !== 0 ? (
            // Acción específica si props.name es "Evidencias"
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 12,
              backgroundColor: '#ed7d18',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 'bold',
              }}>{props.pendientes}</Text>
            </View>
          ) : null }
        </TouchableOpacity>
      );
    }
    return null;
  };

  const containerStyle = props.blocked
    ? styles.containerBlocked
    : styles.container;
  return (
    <View style={containerStyle}>
      <Image source={props.iconName} style={{ width: '50%', height: '30%' }} />
      <Text style={styles.itemName}>{props.name}</Text>
      {renderMenuIcon()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '95%',
    height: '95%',
    borderRadius: 20,
    borderColor: '#c1c1c1',
    borderTopWidth: 1,
    borderLeftWidth: 3,
    borderRightWidth:1,
    borderBottomWidth:3,
    flexDirection: 'column',
    alignItems: 'center', // Centra horizontalmente
    justifyContent: 'center', // Centra verticalmente
  },
  containerBlocked: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#fafbfd',
    borderColor: '#c1c1c1',
    borderTopWidth: 1,
    borderLeftWidth: 3,
    borderRightWidth:1,
    borderBottomWidth:3,
    flexDirection: 'column',
    alignItems: 'center', // Centra horizontalmente
    justifyContent: 'center', // Centra verticalmente
  },
  buttonFixed: {
    zIndex: 999,
    height: 50,
    width: 50,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 1,
    right: 1,
  },
  containerImage: {
    width: '25%',
    backgroundColor: '#f2f2f6',
    borderRadius: 100,
    marginVertical: 10,
  },
  containerText: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 10,
    width: '70%',
  },
  itemName: {
    color: '#837c79',
    fontSize: 25,
    fontWeight: '500',
    fontStyle: 'italic',
  },


});
