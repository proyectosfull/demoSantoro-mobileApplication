/* eslint-disable jsx-quotes */
/* eslint-disable no-return-assign */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocation } from '../hooks/UseLocation';
import FabButton from './FabButton';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import { useNavigation } from '@react-navigation/native';


type NavigationProps = StackNavigationProp<RootStackParamList, 'PreMenuScreen'>;
export default function Map() {
    const { hasLocation, position, getCurrentLocation } = useLocation();
    const mapViewRef = useRef<MapView>();
    const { navigate } = useNavigation<NavigationProps>();
    const handleViewPress = () => {
        navigate('UserInfoScreen');
    };

    console.log('coordenadas usadas :');
    console.log(position?.latitude + ' ' + position?.longitude)
    const centerPosition = async () => {
        const { latitude, longitude } = await getCurrentLocation();
        mapViewRef.current?.animateCamera({
            center: {
                latitude: latitude,
                longitude: longitude,
            },
        });
    };

    if (position === null) {
        return <View />; // No renderizar nada si las coordenadas son nulas
    }
    return (
        <>
            <MapView
                ref={(el) => mapViewRef.current = el!}
                showsUserLocation
                style={{ flex: 1 }}
                initialRegion={{
                    latitude: position.latitude,
                    longitude: position.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
               {/**
                * 
                 <Marker
                    coordinate={{
                        latitude: position.latitude,
                        longitude: position.longitude,
                    }}
                    title={'aqui'}
                    description={'aqui x2'}
                />
                */}
            </MapView>
            <FabButton
                inconName='map-marker'
                onPress={() => centerPosition()}
                style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                }}
            />
            <FabButton
                inconName='keyboard-backspace'
                onPress={() => handleViewPress()}
                style={{
                    position: 'absolute',
                    bottom: 65,
                    right: 10,
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

});
