import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform, StyleSheet, ActivityIndicator, Alert, Modal, ToastAndroid } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import Header from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrustValueApiUrls from '../network/TrustValueApiUrls';
import AxiosBuilder from '../network/AxiosBuilder';
import { parse, set } from 'date-fns';
import { stat } from 'react-native-fs';

type Props = StackScreenProps<RootStackParamList, 'SeleccionarTiendaScreen'>;

interface BranchOffice {
    id: number;
    latitude: string;
    longitude: string;
    full_address: string;
    name: string;
    region: string | null;
    status: number; // 1: sin asistencia, 2: pendiente, 3: finalizado
    asistenciaIdPendiente?: number; 
    attendanceId: number; 
}

export default function SeleccionarTiendaScreen(props: Props) {

    const { latitude, longitude } = props.route.params;
    const [tiendasState, setTiendasState] = useState<BranchOffice[]>([]);
    const [selected, setSelected] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [tiendaParaConfirmar, setTiendaParaConfirmar] = useState<BranchOffice | null>(null);

    const [limitedAttendance, setLimitedAttendance] = useState<number>(1); 

    // Añadir estado para la hora UTC
    const [horaUTC, setHoraUTC] = useState<string>('');


    // Cargar sucursales cercanas al montar el componente o al cambiar ubicación
    const fetchTiendas = async () => {
        setLoading(true);
        setFetchError(false);
        try {
            const axiosInstance = await AxiosBuilder.getAuthInstance();
            const response = await axiosInstance.post(
                TrustValueApiUrls.BRANCH_OFFICES_BY_GEOLOCATION,
                {
                    latitude: String(latitude),
                    longitude: String(longitude),
                }
            );
            console.log('Respuesta sucursales:', response.data);
            if (response.data && Array.isArray(response.data.data)) {

                const finishDay = await AsyncStorage.getItem('finishDay');
                const pendingIdRaw = await AsyncStorage.getItem('idAsistencia');
                const pendingId = pendingIdRaw ? Number(pendingIdRaw) : null;
                console.log('finishDay:', finishDay, 'pendingId:', pendingId);

                const tiendas = response.data.data.map((item: any) => {
                    const attendanceId = item.attendance_id ?? item.asistenciaPendiente ?? null;
                    console.log(`branch ${item.id} → attendanceId: ${attendanceId}, pendingId: ${pendingId}`);

                    let status = item.status;
                        // attendanceId && finishDay === 'false'
                        //     ? 2 // Asistencia pendiente
                        if (
                        attendanceId !== null &&
                        finishDay === 'false' &&
                        attendanceId === pendingId
                        ) {
                        status = 2;
                        }
                            
                    return {
                        ...item,
                        attendanceId,
                        status,
                    }
                }); 
                setTiendasState(tiendas);
            } else {
                setTiendasState([]);
            }
        } catch (error) {
            setFetchError(true);
            setTiendasState([]);
            Alert.alert('Error', 'No se pudieron cargar las sucursales');
        }
        setLoading(false);
    };

    // Limite de asistencias 
    useEffect(() => {
        AsyncStorage.getItem('userInSession').then(raw => {
            const user = raw ? JSON.parse(raw) : {};
            // limited_attendance
            const laRaw = 
                user.limited_attendance
                ?? user.data?.limited_attendance
                ?? user.usuario?.limited_attendance;
            // Convertir a numero de forma confiable 
            const laNum = Number(laRaw);
            //console.log('from raw:', laRaw);
            setLimitedAttendance(Number.isNaN(laNum) ? 1 : laNum); // Si no hay valor, por defecto 1
        }) 
    }, []); 

    useEffect(() => {
        fetchTiendas();
    }, [latitude, longitude]);

    useEffect(() => {
        if(tiendasState.length === 1 && tiendasState[0].status === 1) {
            handleRegistrarAsistencia(tiendasState[0]); 
        }
    }, [tiendasState]); 


    const obtenerFechaHoraUTC = async (
        maxRetries = 3,
        delayMs = 5000
    ): Promise<String | null> => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const respuesta = await fetch('https://worldtimeapi.org/api/ip');
                const datos = await respuesta.json();
                setHoraUTC(datos.datetime);
                return datos.datetime;
            } catch (error) {
                console.error('Error al obtener la fecha y hora UTC:', error);
                if (attempt < maxRetries - 1) {
                    await new Promise(res => setTimeout(res, delayMs)); 
                }
            }
        }
        return null;
        
    };


    const handleRegistrarAsistencia = async (tienda: BranchOffice) => {
        setSelected(tienda.id);
        setLoading(true);
        try {
            // Obtener la hora UTC antes de registrar asistencia
            const horaActualUTC = await obtenerFechaHoraUTC();
            if (!horaActualUTC) {
                setLoading(false);
                setSelected(null);
                // Si no se pudo obtener la hora, regresamos al PreMenu para reintentar 
                if ((props.route.params.tiendas as any[]).length === 1) {
                    props.navigation.goBack();
                }
                return;
            }
            const start_work_day = horaActualUTC.replace('T', ' ').substring(0, 19);
            const axiosInstance = await AxiosBuilder.getAuthInstance();
            const response = await axiosInstance.post(
                TrustValueApiUrls.CHECKASIST,
                {
                    latitude: String(latitude),
                    longitude: String(longitude),
                    start_work_day,
                    branch_office_id: tienda.id,
                }
            );

            if (response.data.status === 1) {
                await AsyncStorage.setItem('finishDay', 'false');
                await AsyncStorage.setItem('asistencia', 'true');

                if (response.data.data && response.data.data.id) {
                    await AsyncStorage.setItem('idAsistencia', response.data.data.id.toString());
                }
                await fetchTiendas();
                props.navigation.replace('MenuScreen', { tiendaId: tienda.id, justRegistered: true });
            } else {
                Alert.alert('Error', response.data.msg || 'No se pudo registrar la asistencia');
            }
        } catch (error: any) {
            if (error.response && error.response.data) {
                Alert.alert('Error', error.response.data.msg || 'No se pudo registrar la asistencia');
            } else {
                Alert.alert('Error', 'No se pudo registrar la asistencia');
            }
        }
        setLoading(false);
        setSelected(null);
    };

    // Función para mostrar modal de confirmación
    const handleSeleccionarTienda = async (tienda: BranchOffice) => {

        const unlimited = limitedAttendance === 0;
        if (tienda.status === 1 || (tienda.status === 3 && unlimited)) {
            // registro inicial de asistencia
            setTiendaParaConfirmar(tienda);
            setShowConfirmModal(true);
            return;
        }

        if (tienda.status === 2 && tienda.attendanceId) {
            // Finalizar asistencia pendiente (status 2) siempre 
            if (tienda.status === 2 && tienda.attendanceId) {
                await AsyncStorage.setItem('asistencia', 'true');
                await AsyncStorage.setItem('finishDay', 'false');
                await AsyncStorage.setItem('idAsistencia', tienda.attendanceId.toString());
                props.navigation.replace('MenuScreen', { tiendaId: tienda.id, pending: true });
            }
        }
    };

    // Función para confirmar asistencia
    const handleConfirmarAsistencia = () => {
        if (tiendaParaConfirmar) {
            setShowConfirmModal(false);
            handleRegistrarAsistencia(tiendaParaConfirmar);
        }
    };

    // Función para cancelar confirmación
    const handleCancelarConfirmacion = () => {
        setShowConfirmModal(false);
        setTiendaParaConfirmar(null);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Header texto="Selecciona la tienda" />
                <ActivityIndicator size="large" color="#ed7d18" style={{ marginTop: 40 }} />
            </View>
        );
    }

    if (fetchError) {
        return (
            <View style={styles.container}>
                <Header texto="Selecciona la tienda" />
                <Text style={styles.subtitle}>
                    Selecciona la tienda en la que te encuentras para registrar tu asistencia.
                </Text>
                <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>
                    Error al obtener sucursales
                </Text>
            </View>
        );
    }

    // Si no existen tiendas o está vacío, muestra error
    if (tiendasState.length === 0) {
        return (
            <View style={styles.container}>
                <Header texto="Selecciona la tienda" />
                <Text style={styles.subtitle}>
                    Selecciona la tienda en la que te encuentras para registrar tu asistencia.
                </Text>
                <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>
                    Error al obtener sucursales
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header texto="Selecciona la tienda" />
            <Text style={styles.subtitle}>
                Selecciona la tienda en la que te encuentras para registrar tu asistencia.
            </Text>

            <FlatList
                data={tiendasState}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    let cardStyle = [styles.tiendaCard];
                    let textStyle = [styles.tiendaNombre];
                    let direccionStyle = [styles.tiendaDireccion];
                    let warningIcon = null;
                    let checkIcon = null;
                    let isDisabled = false;

                    if (item.status === 2) {
                        cardStyle.push(styles.tiendaCardWarning);
                        warningIcon = (
                            <Icon
                                name="alert-circle-outline"
                                size={32}
                                color="#ffb300"
                                style={styles.warningIcon}
                            />
                        );
                    }

                    const unlimited = limitedAttendance === 0; 
                    if (item.status === 3 && !unlimited) {
                        cardStyle.push(styles.tiendaCardFinalizada);
                        textStyle.push(styles.tiendaNombreFinalizada);
                        direccionStyle.push(styles.tiendaDireccionFinalizada);
                        checkIcon = (
                            <Icon
                                name="check-circle-outline"
                                size={32}
                                color="#43a047"
                                style={styles.warningIcon}
                            />
                        );
                        isDisabled = true;
                    } 

                    return (
                        <TouchableOpacity
                            style={cardStyle}
                            disabled={selected !== null || loading || (item.status === 3 && limitedAttendance === 1)}
                            onPress={() => {
                                handleSeleccionarTienda(item); 
                            }}
                            activeOpacity={limitedAttendance === 1 && item.status === 3 ? 1 : 0.7}
                        >
                            <View style={styles.iconContainer}>
                                <Icon name="store" size={32} color="#ed7d18" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={textStyle}>{item.name}</Text>
                                <Text style={direccionStyle}>
                                    Dirección: {item.full_address}
                                </Text>
                            </View>

                            {warningIcon}
                            {checkIcon}
                        </TouchableOpacity>
                    );
                }}
                contentContainerStyle={{ padding: 20 }}
            />

            {loading && (
                <ActivityIndicator size="large" color="#ed7d18" style={{ marginTop: 20 }} />
            )}

            {/* Modal de confirmación para asistencia */}
            <Modal
                visible={showConfirmModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCancelarConfirmacion}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModal}>
                        <View style={styles.confirmModalHeader}>
                            <Text style={styles.confirmModalTitle}>Confirmar Asistencia</Text>
                        </View>
                        <View style={styles.confirmModalBody}>
                            <Icon name="store" size={50} color="#ed7d18" style={styles.confirmModalIcon} />
                            <Text style={styles.confirmModalText}>
                                ¿Estás seguro de que quieres registrar tu asistencia en la sucursal:
                            </Text>
                            <Text style={styles.confirmModalStoreName}>
                                {tiendaParaConfirmar?.name}
                            </Text>
                            <Text style={styles.confirmModalAddress}>
                                {tiendaParaConfirmar?.full_address}
                            </Text>
                        </View>
                        <View style={styles.confirmModalButtons}>
                            <TouchableOpacity
                                style={[styles.confirmModalButton, styles.cancelButton]}
                                onPress={handleCancelarConfirmacion}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmModalButton, styles.confirmButton]}
                                onPress={handleConfirmarAsistencia}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Confirmar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    tiendaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
        borderRadius: 12,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ed7d18',
        elevation: 2,
    },
    tiendaCardWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff7cc',
        borderColor: '#ffb300',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        elevation: 2,
    },
    tiendaCardFinalizada: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#bdbdbd',
        elevation: 2,
        opacity: 0.7,
    },
    iconContainer: {
        marginRight: 18,
        backgroundColor: '#fff7f0',
        borderRadius: 30,
        padding: 8,
    },
    tiendaNombre: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ed7d18',
    },
    tiendaNombreFinalizada: {
        color: '#bdbdbd',
        fontSize: 16,
        fontWeight: 'bold',
    },
    tiendaDireccion: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    tiendaDireccionFinalizada: {
        color: '#bdbdbd',
        fontSize: 16,
        marginTop: 8,
    },
    warningIcon: {
        marginLeft: 12,
        alignSelf: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    confirmModal: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 25,
        width: '80%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    confirmModalHeader: {
        marginBottom: 20,
    },
    confirmModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ed7d18',
        textAlign: 'center',
    },
    confirmModalBody: {
        alignItems: 'center',
        marginBottom: 25,
    },
    confirmModalIcon: {
        marginBottom: 15,
    },
    confirmModalText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    confirmModalStoreName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ed7d18',
        textAlign: 'center',
        marginBottom: 5,
    },
    confirmModalAddress: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
    },
    confirmModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        gap: 35,
    },
    confirmModalButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        width: '50%',
    },
    confirmButton: {
        backgroundColor: '#ed7d18',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    cancelButton: {
        backgroundColor: '#e0e0e0',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});