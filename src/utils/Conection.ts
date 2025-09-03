/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-shadow */
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NetworkService = {
  isConnected: false as boolean | null,
  isInternetReacheable: false as boolean | null,
  async init() {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected;
    NetInfo.addEventListener((state) => {
      this.isConnected = state.isConnected;
      this.isInternetReacheable = state.isInternetReachable;
    });
  },

  async initAsistencia() {
    try {
      const asistencia = await AsyncStorage.getItem('asistencia');
      const todayDate = await AsyncStorage.getItem('fechaHoy');
      const fechaHoy = new Date();
      if (asistencia === null || todayDate === null) {
  
        // Si "asistencia" no existe, establecerlo en false como valor predeterminado
        await AsyncStorage.setItem('asistencia', 'false');
        await AsyncStorage.setItem('finishDay', 'true');
        await AsyncStorage.setItem('fechaHoy', fechaHoy.toDateString());
      }
    } catch (error) {
      console.error('Error al inicializar "asistencia":', error);
    }
  },

  async isCheckAsist() {
    const fechaHoy = new Date();
    if (fechaHoy.toDateString() === await AsyncStorage.getItem('fechaHoy')) {
      if (await AsyncStorage.getItem('asistencia') === 'true') {
        await AsyncStorage.setItem('asistencia', 'true');
      }
    } else {
      await AsyncStorage.setItem('asistencia', 'false');
      await AsyncStorage.setItem('finishDay', 'true');
      await AsyncStorage.setItem('fechaHoy', fechaHoy.toDateString());
    }
  },

  async preMenuChecked() {
    const fechaHoy = new Date();
    const preMenuCheck = await AsyncStorage.getItem('preMenuCheck');
    const absenceCheck = await AsyncStorage.getItem('absence');
    const cond = await AsyncStorage.getItem('fechaHoyPreMenuChecked');
    if (preMenuCheck === null) {
      // Si "asistencia" no existe, establecerlo en false como valor predeterminado
      await AsyncStorage.setItem('preMenuCheck', 'false');
    }

    if(absenceCheck === null) {
      await AsyncStorage.setItem('absence','false');
    }

    if (fechaHoy.toDateString() !== await AsyncStorage.getItem('fechaHoyPreMenuChecked')) {
      await AsyncStorage.setItem('preMenuCheck', 'false');
      await AsyncStorage.setItem('absence','false');
      await AsyncStorage.setItem('fechaHoyPreMenuChecked', fechaHoy.toDateString());
    } 
  },

  async saveDataLocally(key: any, data: any) {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  },

  async getDataLocally(key: any) {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
};

export default NetworkService;
