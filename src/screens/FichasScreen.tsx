import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Text, Image, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import Header from '../components/Header';
import { Button, IconButton } from 'react-native-paper';
import CardMarcas from '../components/CardMarcas';
import sqLite from 'react-native-sqlite-storage';
import Fichas from '../models/Fichas';
import Snackbar from 'react-native-snackbar';
import axios from 'axios';
import NetworkService from '../utils/Conection';
import TrustValueApi from '../network/TrustValueApi';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const db = sqLite.openDatabase(
  { name: 'localTV.db', location: 'default' },
  () => { },
  error => { console.log(error) }
);

type Props = StackScreenProps<RootStackParamList, 'FichasScreen'>;
export default function FichasScreen(props: Props) {

  const [fichasUsurio, setFichasUsurio] = useState<[] | null | undefined>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [actualPage, setActualPage] = useState(0);
  const [existNextPage, setExistNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);



  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Fichas(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idFicha INTEGER,
      name TEXT,
      image TEXT,
      price TEXT,
      concept TEXT,
      ingredients TEXT,
      keywords TEXT,
      last_message TEXT,
      subbrand TEXT,
      brandName TEXT,
      company TEXT
    );
  `;

  const createTable = () => {
    db.transaction((tx: any) => {
      tx.executeSql(createTableQuery, [], (tx: any, results: any) => {
        // La tabla se ha creado correctamente o ya existe
        console.log('Tabla Fichas creada o ya existe');
      },
        (error: any) => {
          console.error('Error al crear la tabla Fichas:', error);
        });
    });
  };

  const insertDataLocally = async (fichasArray: Fichas[] | undefined) => {
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx) => {
        for (const ficha of fichasArray!) {
          // Primero, verifica si el registro con el mismo idFicha ya existe
          tx.executeSql(
            'SELECT idFicha FROM Fichas WHERE idFicha = ?',
            [ficha.id],
            (_, results) => {
              if (results.rows.length === 0) {
                // Si no se encontró un registro con el mismo idFicha, inserta el nuevo registro
                tx.executeSql(
                  'INSERT INTO Fichas (idFicha, name, image, price, concept, ingredients, keywords, last_message, subbrand, brandName, company) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  [
                    ficha.id,
                    ficha.name || '',
                    ficha.image || '',
                    ficha.price || '',
                    ficha.concept || '',
                    ficha.ingredients || '',
                    ficha.keywords || '',
                    ficha.last_message || '',
                    ficha.subbrand || '',
                    ficha.brand?.name || '',
                    ficha.brand?.company?.name || '',
                  ],
                  (_, insertResults) => {
                    console.log('Registro insertado con éxito');
                  },
                  (_, error) => {
                    console.error('Error al insertar el registro:', error);
                  }
                );
              } else {
                console.log('El registro con idFicha', ficha.id, 'ya existe.');
              }
            },
            (_, error) => {
              console.error('Error al verificar si el registro existe:', error);
            }
          );
        }
      });
    });
  };
  

  const dropTableLocally = async () => {
    return new Promise<void>((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql('Delete from Fichas', [], (tx: any, results: any) => {
          console.log('Datos de la tabla Fichas eliminados correctamente.');
          resolve();
        },
          (error: any) => {
            console.error('Error al eliminar los datos de la tabla Fichas:', error);
            reject(error);
          });
      });
    });
  };

  const getDataToTable = async () => {
    return new Promise((resolve, reject) => {
      const fichasArray: Fichas[] = [];
      db.transaction(
        tx => {
          tx.executeSql(
            'SELECT * FROM Fichas',
            [],
            (tx, results) => {
              if (results.rows.length === 0) {
                // La tabla está vacía, resuelve con un array vacío
                resolve([]);
              } else {
                // La consulta fue exitosa, procesa los resultados y crea un array de Comunicados
                for (let i = 0; i < results.rows.length; i++) {
                  const record = results.rows.item(i);
                  const ficha: Fichas = {
                    id: record.idComunicado,
                    name: record.name,
                    image: record.image,
                    price: record.price,
                    concept: record.concept,
                    ingredients: record.ingredients,
                    keywords: record.keywords,
                    last_message: record.last_message,
                    subbrand: record.subbrand,
                    brand: {
                      name: record.brandName, // Asegúrate de usar el nombre correcto de la columna en tu tabla
                      company: {
                        name: record.company,
                      }
                    },
                  };
                  fichasArray.push(ficha);
                }
                console.log(fichasArray.length);
                resolve(fichasArray);
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
        const response = await new TrustValueApi().getProducts();
        if (
          (response.status === 200 ||
            response.status === 201) &&
          response.data.status === 1
        ) {
          await dropTableLocally();
          setExistNextPage(response.data.data.next_page_url);
          setFichasUsurio(response.data.data.data);
          setTotalPages(response.data.data.last_page);
          setActualPage(response.data.data.current_page);
          setLoading(false);
          const responseData = response.data.data.data;
          const comunicadosLocal: Fichas[] = responseData.map((item: Fichas) => ({
            id: item.id,
            name: item.name,
            image: item.image,
            price: item.price,
            concept: item.concept,
            ingredients: item.ingredients,
            keywords: item.keywords,
            last_message: item.last_message,
            subbrand: item.subbrand,
            brand: {
              name: item.brand?.name,
              company: {
                name: item.brand?.company?.name,
              }
            }
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
        setFichasUsurio(localData);
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
      <Header texto="Productos" />

      <ScrollView style={{ paddingVertical: '3%',marginBottom:'15%'}}>
        {/* Indicador de carga */}
        {loading && (
          <View style={styles.containerIndicator}>
            <ActivityIndicator size={50} color="#ed7d18" />
          </View>
        )}

        {/* Contenido principal */}
        {!loading && (
          <View>
            {fichasUsurio!.length > 0 ? (
              fichasUsurio!.map((ficha: any, index) => (
                <View key={index}>
                  <TouchableOpacity
                    onPress={() => {
                      props.navigation.navigate('ProductMarcaDataScreen', { ficha: ficha });
                    }}
                  >
                    <CardMarcas
                      name={ficha.name}
                      marca={ficha.brand.name}
                      empresa={ficha.brand.company.name}
                      imageProduct={ficha.image}
                    />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', width: '100%', height: '100%', paddingTop: '50%' }}>
                <Icon name="emoticon-sad-outline" size={180} color="#c4c3c4" />
                <Text style={{ fontSize: 22, fontWeight: 'bold' }}>NO HAY PRODUCTOS</Text>
              </View>
            )}
          </View>
        )}
  
      </ScrollView>
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
  containerPositionButton: {
    position: 'absolute',
    width: '30%',
    height: 55,
    bottom: '3%',
    borderTopRightRadius: 40,
    alignItems: 'flex-start',
  },
  containerArrows: {
    width: '100%',
    paddingBottom: '10%',
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: '5%',
  },
  containerIndicator: {
    width: '100%',
    alignItems: 'center',
    marginTop: '90%',

  },
});