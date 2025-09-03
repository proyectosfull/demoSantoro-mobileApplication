/* eslint-disable semi */

import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  Provider as PaperProvider,
  MD3LightTheme as DefaultTheme,
} from 'react-native-paper';
import { Navigator } from './src/routes/Navigator';
import { PermissionsProvider } from './src/Context/PermisionContext';
import { LogBox } from 'react-native';
import NetworkService from './src/utils/Conection';
import NetInfo from '@react-native-community/netinfo';
import { ModalInternet } from './src/components/ModalInternet';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { Platform } from 'react-native';
import Echo from 'laravel-echo/dist/echo';
import Socketio from 'socket.io-client';

const theme = {
  ...DefaultTheme,
  // Specify custom property
  myOwnProperty: true,
  // Specify custom property in nested object
  colors: {
    ...DefaultTheme.colors,
    primary: '#ed7d18',
    accent: '#c3c3c3',
    text: 'black',
    background: 'white',
  },
};

const AppState = ({ children }: any) => {
  LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
  LogBox.ignoreAllLogs(); //Ignore all log notifications
  return <PermissionsProvider>
    {children}
  </PermissionsProvider>
};


export default function App() {

  async function onDisplayNotification() {
    // Request permissions (required for iOS)
    const settings = await notifee.requestPermission();

    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });

    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      await notifee.displayNotification({
        title: 'Probando Notificacion',
        body: 'Lo que dice la notificacion',
        android: {
          channelId,
          smallIcon: 'ic_launcher', // optional, defaults to 'ic_launcher'.
          // pressAction is needed if you want the notification to open the app when pressed
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          attachments: [
            {
              // React Native asset.
              url: require('./src/assets/logo.png'),
            },
          ],
          sound: 'default',
        },
      });
    } else {
      console.log('User declined permissions');
    }

    // Display a notification
  }


  //onDisplayNotification();
  const [connect, setConnect] = React.useState<boolean|null>(false);
  const [reacheable, setReacheable] = React.useState<boolean|null>(false);
  const [isModalInternetOpen, setIsModalInternetOpen] = React.useState(false);
  const [modalTitle, setModalTitle] = React.useState("Sin Internet");
  const [modalDescription, setModalDescription] = React.useState(
    "Ha perdido la conexion de internet"
  );

  {/**
      React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // Aquí puedes tomar acciones según el estado de la conexión
      setConnect(state.isConnected);
      setReacheable(state.isInternetReachable);
      NetworkService.isConnected = state.isConnected;
      NetworkService.isInternetReacheable = state.isInternetReachable;

      // Verificar si la conexión se ha perdido o recuperado
      if (!state.isConnected && connect) {
        // La conexión se ha perdido después de estar conectado previamente
        setIsModalInternetOpen(true);
        setModalTitle("Sin Internet");
        setModalDescription(
          "Ha perdido la conexión de internet"
        );
      } else if (state.isConnected && !connect) {
        // La conexión se ha recuperado después de estar desconectado previamente
        setIsModalInternetOpen(true);
        setModalTitle("Con Internet");
        setModalDescription("La conexión a Internet se ha restablecido.");
      }
    });

    // No olvides desuscribirte cuando el componente se desmonte
    return () => {
      unsubscribe();
    };
  }, [connect]);
 */}


  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <AppState>
          <Navigator />
        </AppState>
      </NavigationContainer>
    </PaperProvider>
  );
}
