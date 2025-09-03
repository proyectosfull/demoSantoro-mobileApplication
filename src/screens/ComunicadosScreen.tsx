/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import Header from '../components/Header';
import ProductMarca from '../components/ProductMarca';
import { IconButton } from 'react-native-paper';
import sqLite from 'react-native-sqlite-storage';
import { useFocusEffect } from '@react-navigation/native';
import TrustValueApi from '../network/TrustValueApi';
import axios from 'axios';
import Snackbar from 'react-native-snackbar';
import NetworkService from '../utils/Conection';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = sqLite.openDatabase(
  { name: 'localTV.db', location: 'default' },
  () => { },
  error => { console.log(error) }
);

interface Comunicados {
  id?: number | undefined,
  title?: string | undefined,
  description?: string | undefined,
  multimedia?: string | undefined,
}

type Props = StackScreenProps<RootStackParamList, 'ComunicadosScreen'>;
export default function ComunicadosScreen(props: Props) {

  const [comunicadosUsuario, setComunicadosUsuario] = useState<[] | null | undefined>([]);
  const [loading, setLoading] = useState(false);

  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS Comunicados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idComunicado INTEGER,
    title TEXT,
    description TEXT,
    multimedia TEXT
  );
`;

  const createTable = () => {
    db.transaction((tx: any) => {
      tx.executeSql(createTableQuery, [], (tx: any, results: any) => {
        // La tabla se ha creado correctamente o ya existe
        console.log('Tabla Comunicados creada o ya existe');
      },
        (error: any) => {
          console.error('Error al crear la tabla Comunicados:', error);
        });
    });
  };

  const insertDataLocally = async (comunicadosArray: Comunicados[] | undefined) => {
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        for (const comunicado of comunicadosArray!) {
          tx.executeSql(
            'INSERT INTO Comunicados (idComunicado, title, description, multimedia) VALUES (?, ?, ?, ?)',
            [
              comunicado.id,
              comunicado.title || '',
              comunicado.description || '',
              comunicado.multimedia || ''
            ],
            (_, results) => {
              console.log('Registro insertado con éxito');
            },
            (_, error) => {
              console.error('Error al insertar el registro:', error);
            }
          );
        }
      });
    });
  };




  const dropTableLocally = async () => {
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql('Delete from Comunicados', [], (tx: any, results: any) => {
          console.log('Datos de la tabla Comunicados eliminados correctamente.');
          resolve();
        },
          (error: any) => {
            console.error('Error al eliminar los datos de la tabla Comunicados:', error);
            reject(error);
          });
      });
    });
  };

  const getDataToTable = async () => {
    return new Promise((resolve, reject) => {
      const comunicadosArray: Comunicados[] = [];
      db.transaction(
        tx => {
          tx.executeSql(
            'SELECT * FROM Comunicados',
            [],
            (tx, results) => {
              if (results.rows.length === 0) {
                // La tabla está vacía, resuelve con un array vacío
                resolve([]);
              } else {
                // La consulta fue exitosa, procesa los resultados y crea un array de Comunicados
                for (let i = 0; i < results.rows.length; i++) {
                  const record = results.rows.item(i);
                  comunicadosArray[i] = {
                    id: record.idComunicado,
                    title: record.title,
                    description: record.description,
                    multimedia: record.multimedia,
                  };
                }
                resolve(comunicadosArray);
              }
            },
            (_, error) => {
              // Error al ejecutar la consulta
              // Aquí puedes manejar el error y comprobar si es un error de "tabla no existe"
              if (error.message.includes("no such table")) {
                // La tabla no existe, puedes resolver con un array vacío
                resolve([]);
              } else {
                // Otro tipo de error
                console.error('Error al recuperar los registros:', error);
                reject(error);
              }
            }
          );
        },
        error => {
          console.error('Error en la transacción:', error);
          reject(error);
        }
      );
    });
  };

  useEffect(() => {
    createTable();
  }, []);

  const fetchData = async () => {
    NetworkService.init();
    if (NetworkService.isConnected === true && NetworkService.isInternetReacheable === true) {
      setLoading(true);
      try {
        const response = await new TrustValueApi().getAnnouncements();
        if (
          (response.status === 200 ||
            response.status === 201) &&
          response.data.status === 1
        ) {
          setLoading(false);
          await dropTableLocally();
          setComunicadosUsuario(response.data.data.data);
          const responseData = response.data.data.data;
          AsyncStorage.setItem('ultimoTamanio',responseData.length + '')
          const comunicadosLocal: Comunicados[] = responseData.map((item: Comunicados) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            multimedia: item.multimedia !== null ? item.multimedia : '',
          }));
          await insertDataLocally(comunicadosLocal);
        } else {
          setLoading(false);
          Snackbar.show({
            text: 'Ocurrió un error interno,cierra sesion e inténtalo más tarde',
            duration: Snackbar.LENGTH_LONG,
          });
        }
      } catch (error) {
        setLoading(false);
        console.log('El error es' + error);
        if (axios.isAxiosError(error)) {
          if (error.response) {
            Snackbar.show({
              text: 'Ocurrió un error interno, inténtalo más tarde',
              duration: Snackbar.LENGTH_LONG,
              textColor: '#ed7d18',
            });
          }
        }
      }
    } else {
      setLoading(false);
      // Si no hay conexión a Internet, obtén los datos de la tabla local
      try {
        const localData = await getDataToTable() as [];
        setComunicadosUsuario(localData);
        // Ahora puedes usar localData como los datos locales recuperados
        // También puedes almacenar localData en un estado si es necesario
      } catch (error) {
        console.error('Error al obtener datos locales:', error);
      }
    }
  };


  // Usa useFocusEffect con la función fetchData
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Header texto="Mensajes" />

        {loading ? ( // Verifica si loading es true
          <View style={styles.containerIndicator}>
            <ActivityIndicator size="large" color="#ed7d18" />
          </View>
        ) : (

          comunicadosUsuario!.length > 0 ? (
            <FlatList
              data={comunicadosUsuario as Comunicados[]}
              keyExtractor={item => item.id?.toString() ?? Math.random().toString()}
              contentContainerStyle={{ padding: 25, paddingBottom: 80 }}
              renderItem={({ item } : { item: Comunicados }) => (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.95}
                  onPress={() => {
                    props.navigation.navigate('ComunicadoDetailScreen', { comunicado: item });
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Icon name="email-outline" size={26} color="#ed7d18" />
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  </View>
                  <Text style={styles.cardDescription} numberOfLines={4}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="hand-peace" size={120} color="#c4c3c4" />
              <Text style={styles.emptyText}>BIEN, NADA PENDIENTE</Text>
            </View>
          )
        )}

      <View style={styles.containerPositionButton}>
        <IconButton
          icon="home"
          iconColor="#ed7d18"
          size={50}
          onPress={() => props.navigation.goBack()}
        />
      </View>
    </View>
  );  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  // 
  card: {
    backgroundColor: '#f7f7f7', 
    borderRadious: 16,
    padding: 18, 
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10, 
    shadowRadius: 6, 
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1, 
    borderColor: '#ed7d18',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ed7d18',
    flex: 1,
    flexWrap: 'wrap',
  },
  cardDescription: {
    fontSize: 15,
    color: '#555',
    marginLeft: 52, 
    marginTop: 2,
  },  
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
    height: 400,
    paddingTop: '20%',
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 12,
  },

  containerPositionButton: {
    position: 'absolute',
    width: '30%',
    height: 55,
    bottom: '3%',
    borderTopRightRadius: 40,
    alignItems: 'flex-start',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  containerArrows: {
    width: '100%',
    paddingBottom: '10%',
    paddingHorizontal: 10,
  },
  containerPositionButtonArrows: {
    position: 'absolute',
    width: '30%',
    height: 55,
    bottom: 0,
    right: 0,
    borderTopLeftRadius: 40,
    backgroundColor: '#ed7d18',
    alignItems: 'center', // Alinea el contenido en el centro
    flexDirection: 'row', // Esto coloca los elementos en una fila horizontal
    justifyContent: 'space-around',
  },
  containerIndicator: {
    flex: 1,
    justifyContent: 'center', 
    width: '100%',
    alignItems: 'center',
  },
});
