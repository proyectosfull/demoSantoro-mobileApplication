import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './ParamList';
import LoginScreen from '../screens/LoginScreen';
import UserInfoScreen from '../screens/UserInfoScreen';
import PreMenuScreen from '../screens/PreMenuScreen';
import MenuScreen from '../screens/MenuScreen';
import FichasScreen from '../screens/FichasScreen';
import MarcasDataScreen from '../screens/MarcasDataScreen';
import ProductMarcaDataScreen from '../screens/ProductMarcaDataScreen';
import EvaluacionesScreen from '../screens/EvaluacionesScreen';
import ComunicadosScreen from '../screens/ComunicadosScreen';
import ComunicadoDetailScreen from '../screens/ComunicadoDetailScreen';
import SimuladorScreen from '../screens/SimuladorScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import EvidenciasScreen from '../screens/EvidenciasScreen';
import { SplashScreen } from '../screens/SplashScreen';
import SendDataLocalScreen from '../screens/SendDataLocalScreen';
import ViewPdf from '../screens/ViewPdf';
import EncuestasScreen from '../screens/EncuestasScreen';
import EncuestaResolveScreen from '../screens/EncuestaResolveScreen';
import EvaluacionResolveScreen from '../screens/EvaluacionesResolveScreen';
import VerReportesSimulador from '../screens/VerReportesSimulador';
import SeleccionarTiendaScreen from '../screens/SeleccionarTiendaScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const Navigator = () =>  {
  return (
    <Stack.Navigator
    screenOptions={{
      headerShown:false,
    }}
    initialRouteName="SplashScreen"
    >
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="UserInfoScreen" component={UserInfoScreen} />
      <Stack.Screen name="PreMenuScreen" component={PreMenuScreen} />
      <Stack.Screen name="SeleccionarTiendaScreen" component={SeleccionarTiendaScreen}/>
      <Stack.Screen name="MenuScreen" component={MenuScreen} />
      <Stack.Screen name="FichasScreen" component={FichasScreen} />
      <Stack.Screen name="MarcasDataScreen" component={MarcasDataScreen} />
      <Stack.Screen name="ProductMarcaDataScreen" component={ProductMarcaDataScreen} />
      <Stack.Screen name="EvaluacionesScreen" component={EvaluacionesScreen} />
      <Stack.Screen name="ComunicadosScreen" component={ComunicadosScreen} />
      <Stack.Screen name="ComunicadoDetailScreen" component={ComunicadoDetailScreen} />
      <Stack.Screen name="SimuladorScreen" component={SimuladorScreen} />
      <Stack.Screen name="PermissionsScreen" component={PermissionsScreen} />
      <Stack.Screen name="EvidenciasScreen" component={EvidenciasScreen} />
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="SendDataLocalScreen" component={SendDataLocalScreen} />
      <Stack.Screen name="ViewPdf" component={ViewPdf} />
      <Stack.Screen name="EncuestasScreen" component={EncuestasScreen} />
      <Stack.Screen name="EncuestaResolveScreen" component={EncuestaResolveScreen} />
      <Stack.Screen name="EvaluacionResolveScreen" component={EvaluacionResolveScreen} />
      <Stack.Screen name="VerReportesSimulador" component={VerReportesSimulador} />
    </Stack.Navigator>
  );
};
