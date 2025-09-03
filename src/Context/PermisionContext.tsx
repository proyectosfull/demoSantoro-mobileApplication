/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {createContext, useEffect, useState} from 'react';
import {Platform, AppState, Alert} from 'react-native';
import {
  PERMISSIONS,
  PermissionStatus,
  check,
  request,
  openSettings,
} from 'react-native-permissions';

export interface PermisonState {
  locationStatus: PermissionStatus;
  microphone: PermissionStatus;
}

export const permissionInitState: PermisonState = {
  locationStatus: 'unavailable',
  microphone: 'unavailable',
};

type PermissionContextProps = {
  permissions: PermisonState;
  askLocationPermissions: () => void;
  checkLocationPermissions: () => void;
  askMicrophonePermissions: () => void;
  checkMicrophonePermissions: () => void;
};
export const PermissionsContext = createContext({} as PermissionContextProps);

export const PermissionsProvider = ({children}: any) => {
  const [permissions, setPermissions] = useState(permissionInitState);

  useEffect(() => {
    checkLocationPermissions();
    AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      checkLocationPermissions();
    });
  }, []);

  const askLocationPermissions = async () => {
    let permissionsStatus: PermissionStatus;
    Alert.alert(
      'Acceso a la ubicacion',
      'Para poder acceder a todas las funciones de esta aplicacion, tendrás que activar permisos de ubicacion.',
      [
        {
          text: 'OK',
        },
      ],
      { cancelable: false }
    );
    if (Platform.OS === 'ios') {
      permissionsStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    } else {
      permissionsStatus = await request(
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      );
    }
    if (permissionsStatus === 'blocked') {
      Alert.alert(
        'Alerta, Permisos bloqueados',
        'Para poder enviar tu asistencia y usar todas las funciones de la aplicacion, es necesario que tengas activados tus permisos de ubicacion, tendrás que activarlos manualmente.',
        [
          {
            text: 'OK',
          },
        ],
        { cancelable: false }
      );
    }
    
    setPermissions({
      ...permissions,
      locationStatus: permissionsStatus,
    });
  };

  const checkLocationPermissions = async () => {
    let permissionsStatus: PermissionStatus;
    
    if (Platform.OS === 'ios') {
      permissionsStatus = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    } else {
      permissionsStatus = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    }
    if (permissionsStatus !== 'granted') {
         await askLocationPermissions();
    }
    setPermissions({
      ...permissions,
      locationStatus: permissionsStatus,
    });
  };

  const askMicrophonePermissions = async () => {
    let permissionsStatus: PermissionStatus;
    if (Platform.OS === 'ios') {
      permissionsStatus = await request(PERMISSIONS.IOS.MICROPHONE);
    } else {
      permissionsStatus = await request(
        PERMISSIONS.ANDROID.RECORD_AUDIO,
      );
    }
    setPermissions({
      ...permissions,
      microphone: permissionsStatus,
    });
  };

  const checkMicrophonePermissions = async () => {
    let permissionsStatus: PermissionStatus;
    if (Platform.OS === 'ios') {
      permissionsStatus = await check(PERMISSIONS.IOS.MICROPHONE);
    } else {
      permissionsStatus = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
    }
    if (permissionsStatus !== 'granted') {
         await askMicrophonePermissions();
    }
    setPermissions({
      ...permissions,
      microphone: permissionsStatus,
    });
  };


  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        askLocationPermissions,
        checkLocationPermissions,
        checkMicrophonePermissions,
        askMicrophonePermissions() {},
      }}>
      {children}
    </PermissionsContext.Provider>
  );
};
