/* eslint-disable quotes */
import { AxiosResponse } from "axios";
import AxiosBuilder from "./AxiosBuilder";
import TrustValueApiUrls from "./TrustValueApiUrls";
import AsyncStorage from "@react-native-async-storage/async-storage";
import UserLogin from "../models/UserLogin";
import LocationCoords from "../models/LocationCoords";
import Evidences from "../models/Evidences";
import AnswerSurvey from "../models/AnswerSurvey";
import AnswerEvaluation from "../models/AnswerEvaluation";
import LaboralAbsences from "../models/LaboralAbsences";


export default class TrustValueApi {
    async login(user: UserLogin): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        try {
            console.log(TrustValueApiUrls.LOGIN)
            return await instanceAxios.post(TrustValueApiUrls.LOGIN, user);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async logout(): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
            },
        };
        try {
            return await instanceAxios.get(TrustValueApiUrls.LOGOUT, tokenAuth);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async checkAsistencia(coords: LocationCoords, horaActual: string): Promise<AxiosResponse> {
        console.log('coordenadas que llegan para la asist')
        console.log(coords)
        const instanceAxios = AxiosBuilder.getInstance();
        const objectSendAsist = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            end_work_day: horaActual === '' || horaActual === undefined || horaActual === null ? null : horaActual,
        }
        const token: string | null = await AsyncStorage.getItem('token');
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
        try {
            console.log('Datos enviados a checkAsistencia:', coords, horaActual.replace('T', ' ').substring(0, 19)); /// Agregacion 
            return await instanceAxios.post(TrustValueApiUrls.CHECKASIST, objectSendAsist, tokenAuth);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async endDay(coords: LocationCoords, idAsist: number,horaActual:string,piezas:number, onboards:number): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        console.log(coords)
        const objectSendAsist = {
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
            end_work_day: horaActual === '' || horaActual === undefined || horaActual === null ? null : horaActual,
            sold_pieces: piezas,
            onboards: onboards, 
        }

        try {
            console.log('la url es ' + TrustValueApiUrls.ENDDAY + idAsist);
            return await instanceAxios.put(TrustValueApiUrls.ENDDAY + idAsist, objectSendAsist, tokenAuth);
        } catch (error) {
            console.log(idAsist, 'Asistencia')
            return Promise.reject(error);
        }
    }

    async sendEvidences(evidences: Evidences, horaActual: string): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const formData = new FormData();
        formData.append('subject', evidences.asunto);
        formData.append('message', evidences.mensaje);
        console.log(evidences.multimedia!.photos[0])
        if (evidences.multimedia!.photos.length > 0) {
            formData.append('image_one', evidences.multimedia!.photos[0]);
            if (evidences.multimedia!.photos.length > 1) {
                formData.append('image_two', evidences.multimedia!.photos[1]);
                if (evidences.multimedia!.photos.length > 2) {
                    formData.append('image_three', evidences.multimedia!.photos[2]);
                }
            }
        }

        if (evidences.multimedia!.videos!.length > 0) {
            formData.append('video', evidences.multimedia!.videos[0]);
        }

        formData.append('date', horaActual);

        console.log('El form data es');
        console.log(formData)

        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
                'Content-Type': 'multipart/form-data',
            },
        };

        const timeout = 10000; // Establece el tiempo de espera en milisegundos 

        try {
            return await instanceAxios.post(TrustValueApiUrls.SENDEVIDENCE, formData, {
                ...tokenAuth,
                timeout: timeout, 
            });
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async getAnnouncements(): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
            },
        };
        try {
            return await instanceAxios.get(TrustValueApiUrls.GETANNOUNCEMENTS, tokenAuth);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async getProducts(): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
            },
        };
        try {
            return await instanceAxios.get(TrustValueApiUrls.GETPRODUCTS, tokenAuth);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async getMoreProducts(page: number): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
            },
            params: { page: page },
        };
        try {
            return await instanceAxios.get(TrustValueApiUrls.GETPRODUCTS, tokenAuth);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async getSurveys(): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
            },
        };
        try {
            return await instanceAxios.get(TrustValueApiUrls.GETSURVEYS, tokenAuth);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async answerSurvey(answer: AnswerSurvey): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
        try {
            return await instanceAxios.post(TrustValueApiUrls.ANSWERSURVEY, answer, tokenAuth);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async getEvaluations(): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
            },
        };
        try {
            return await instanceAxios.get(TrustValueApiUrls.GETEVALUATIONS, tokenAuth);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async answerEvaluation(answer: AnswerEvaluation): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
        try {
            return await instanceAxios.post(TrustValueApiUrls.ANSWEREVALUATION, answer, tokenAuth);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async sendLaboralAbsences(objectFormatLaboralAbsences: LaboralAbsences): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const formData = new FormData();
        formData.append('reason', objectFormatLaboralAbsences.razon);
        if (objectFormatLaboralAbsences.razon === 'incapacidad') {
            formData.append('description', objectFormatLaboralAbsences.descripcion);
            formData.append('evidence', objectFormatLaboralAbsences.evidencia);
        } else if (objectFormatLaboralAbsences.razon === 'vacaciones'){
            formData.append('start_vacation_date', objectFormatLaboralAbsences.inicioVacaciones);
            formData.append('end_vacation_date', objectFormatLaboralAbsences.finVacaciones);
        }

        console.log('lo que se va a mandar: ');
        console.log(formData);
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
                'Content-Type': 'multipart/form-data',
            },
        };
        const timeout = 10000; // Establece el tiempo de espera en milisegundos 
        try {
            return await instanceAxios.post(TrustValueApiUrls.LABORALABSENCES, formData, {
                ...tokenAuth,
                timeout: timeout, 
            });
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async updatePictureProfile(imageDataProfile: {}, id:number, brandId?: any): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const formData = new FormData();
        formData.append('profile_picture',imageDataProfile);
        if (typeof brandId !== 'undefined' && brandId !== null) {
            formData.append('brand_id',brandId);
        } 
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
                'Content-Type': 'multipart/form-data',
            },
        };
        const timeout = 10000; // Establece el tiempo de espera en milisegundos 
        try {
            return await instanceAxios.post(TrustValueApiUrls.EDITIMAGEPROFILE + id, formData, {
                ...tokenAuth,
                timeout: timeout, 
            });
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async getSimulator(): Promise<AxiosResponse> {
        const instanceAxios = AxiosBuilder.getInstance();
        const token: string | null = await AsyncStorage.getItem('token');
        const tokenAuth = {
            headers: {
                Authorization: token ? token : '',
            },
        };
        try {
            return await instanceAxios.get(TrustValueApiUrls.GETSIMULATOR, tokenAuth);
        } catch (error) {
            return Promise.reject(error);
        }
    }


}
