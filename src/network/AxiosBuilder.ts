import axios, {AxiosInstance, AxiosRequestConfig} from 'axios';
import TrustValueApiUrls from './TrustValueApiUrls';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class AxiosBuilder {

  static getInstance(): AxiosInstance {
    const config: AxiosRequestConfig = {
      baseURL: TrustValueApiUrls.BASEURL,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      timeout: 30000,
    };
    return axios.create(config);
  }

  static clear() {
    AsyncStorage.removeItem('token');
    // AsyncStorage.removeItem('absence');
    // AsyncStorage.removeItem('preMenuCheck');
    AsyncStorage.removeItem('username');
    AsyncStorage.removeItem('password');
    AsyncStorage.removeItem('keyphone');
    AsyncStorage.removeItem('logged');
    AsyncStorage.removeItem('name');
    AsyncStorage.removeItem('limite');
    AsyncStorage.removeItem('surname');
    AsyncStorage.removeItem('userInSession');
  }

  static async getAuthInstance(): Promise<AxiosInstance> {
    const token: string|null = await AsyncStorage.getItem('token');
    const config: AxiosRequestConfig = {
      baseURL: TrustValueApiUrls.BASEURL,
      headers: {Authorization: token ? 'Bearer ' + token : ''},
      timeout: 30000,
    };
    return axios.create(config);
  }
}
