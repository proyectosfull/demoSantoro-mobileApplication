import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  Dimensions,
  View,
  ActivityIndicator,
  Image,
  Platform,
  Keyboard,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import Header from '../components/Header';
import { Button, IconButton } from 'react-native-paper';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import TextInputError from '../components/TextInputError';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Snackbar from 'react-native-snackbar';
import { useFocusEffect } from '@react-navigation/native';
import NetworkService from '../utils/Conection';
import TrustValueApi from '../network/TrustValueApi';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Para las imagenes 
import RNFS from 'react-native-fs'; 
import ImageBase64 from 'react-native-image-base64';
import { create } from 'react-test-renderer';
import { Alert } from 'react-native';


type Props = StackScreenProps<RootStackParamList, 'SimuladorScreen'>;
export default function SimuladorScreen(props: Props) {
  const windowWidth = Dimensions.get('window').width;
  const [sucursalName, setSucursalName] = useState<string | null>('');
  const [totalObjetive, setTotalObjetive] = useState(0);
  const [surNameUser, setSurNameUser] = useState<string | null>('');
  const [nameUser, setNameUser] = useState<string | null>('');
  const [totalPiezaEsEntero, setTotalPiezaEsEntero] = useState<boolean|null>(false);
  const [productos, setProductos] = useState<string[]>([]);
  const [objetivoPieza, setObjetivoPieza] = useState<number[]>([]);
  const [objetivoDinero, setObjetivoDinero] = useState<number[]>([]);
  const [precioUnitario, setPrecioUnitario] = useState<number[]>([]);
  const [expandedItems, setExpandedItems] = useState(objetivoDinero.map(() => false));
  const [ventas, setVentas] = useState<number[]>([]);
  const [alcances, setAlcances] = useState<number[]>([]);
  const [tendencias, setTendencias] = useState<number[]>([]);
  const [faltantePiezas, setFaltantePiezas] = useState<number[]>([]);
  const [faltanteDinero, setFaltanteDinero] = useState<number[]>([]);
  const [connectedWifi, setConnectedWifi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [respuestas, setRespuestas] = useState(
    new Array().fill(null)
  );

  const [formatedRespuestas, setFormatedRespuestas ] = useState(respuestas);


  const [errores, setErrores] = useState(new Array(objetivoDinero.length).fill(null));

  const handleRespuesta = (index: number, value: number | string | null) => {
    const nuevasRespuestas = [...respuestas];
    nuevasRespuestas[index] = value;
    setRespuestas(nuevasRespuestas);
  };

  const handleFormatedRespuestas = (index: number, value: number | string | null) => {
    const nuevasRespuestas = [...formatedRespuestas];
    nuevasRespuestas[index] = value;
    setFormatedRespuestas(nuevasRespuestas);
  };

  const handleErrors = (index: number, value: string | null) => {
    const nuevosErrores = [...errores];
    nuevosErrores[index] = value;
    setErrores(nuevosErrores);
  };

  const toggleExpandItem = (index: number) => {
    const newExpandedItems = [...expandedItems];
    newExpandedItems[index] = !newExpandedItems[index];
    setExpandedItems(newExpandedItems);
  };

  function getCurrentDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.toLocaleString('default', { month: 'long' }); // Obtiene el nombre completo del mes
    const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate(); // Obtiene la cantidad de días en el mes actual
    const daysElapsed = currentDate.getDate(); // Obtiene el día del mes actual
    const daysRemaining = daysInMonth - daysElapsed;

    return {
      year,
      month,
      daysInMonth,
      daysElapsed,
      daysRemaining,
    };
  }

  // Funcion para convertir las imagenes en base64 
  const imageAssets: { [Key: string]: any } = {
    'estrella.jpg': require('../assets/estrella.jpg'),
    'escalera.jpg': require('../assets/escalera.jpg'),
    'dardo.jpg': require('../assets/dardo.jpg'),
    'animando.jpg': require('../assets/animando.jpg'),
    'rayo.jpg': require('../assets/rayo.jpg'),
  }

  useFocusEffect(
    useCallback(() => {
      setCalculando(false); // Oculta el loader siempre que regresas a esta pantalla
      fetchData();
    }, []),
  );

  async function getImageBase64FromAssetsDirect(name: string) {
    try {
      let base64: string;
      if (Platform.OS === 'android') {
        // Lee desde android/app/src/main/assets/recursos/
        base64 = await RNFS.readFileAssets(`recursos/${name}`, 'base64');
      } else {
        // iOS: mete las imágenes en el bundle (ej: en Xcode) y léelas del MainBundle
        const path = `${RNFS.MainBundlePath}/recursos/${name}`;
        base64 = await RNFS.readFile(path, 'base64');
      }
      const ext = (name.split('.').pop() || 'png').toLowerCase();
      return `data:image/${ext};base64,${base64}`;
    } catch (e) {
      console.warn('No pude leer', name, e);
      return '';
    }
  }

  const createPDFWithPiezasEnteras = async () => {

    // Funcion auxiliar para semaforo de Tendencia 
      const getColorForTendencia = (pct: number) => {
        if (pct >= 95)       return '#4caf50'
        if (pct >= 80)       return '#ffeb3b'
        if (pct >= 70)       return '#ff9800'
        return '#ff4d4d'  
      }

    const rowsObjetivo = objetivoDinero.map((value, index) => {
      const concepto = productos[index];
      const objetivo = objetivoPieza[index];
      const objetivoPrice = objetivoDinero[index];

      const alcanceDineroIndividual = objetivoPrice > 0 ? (ventas[index] / objetivoPrice) * 100 : 0; 

      // Calcular tendencia individual 
      const tendencia = tendencias[index] || 0;
      const colorTendencia = getColorForTendencia(tendencia);

      return `
        <tr>
          <td>${concepto}</td>
          <td>${objetivo}</td>
          <td>$${formatMoney(objetivoPrice)}</td>
          <td>${respuestas[index]}</td>
          <td>$${formatMoney(ventas[index])}</td>
          <td>${alcances[index].toFixed(0)}%</td>
          <td>${alcances[index].toFixed(0)}%</td>
          <td style="background-color: ${colorTendencia}; font-weight: bold;">${tendencias[index].toFixed(0)}%</td>
          <td style="background-color: ${colorTendencia}; font-weight: bold;">${tendencias[index].toFixed(0)}%</td>
          <td>${faltantePiezas[index].toFixed(0)}</td>
          <td>$${Math.trunc(faltanteDinero[index]).toLocaleString()}</td>
        </tr>
      `;
    }).join('\n');
    const dateInfo = getCurrentDate();
    // Calcular la suma de valores en la columna "Objetivo Pzas"
    const sumaObjetivoPzas = objetivoPieza.reduce((acc, valor) => acc + valor, 0);
    // Calcular la suma de valores en la columna "Objetivo $$$"
    const sumaObjetivoDinero = objetivoDinero.reduce((acc, valor) => acc + valor, 0);
    const sumaVentaPiezas = respuestas.reduce((acc, valor) => acc + valor, 0);
    const sumaVentaDinero = ventas.reduce((acc, valor) => acc + valor, 0);
    const alcance = (sumaVentaPiezas / sumaObjetivoPzas) * 100;
    const tendenciaTotal = (((sumaVentaPiezas / dateInfo.daysElapsed) * dateInfo.daysInMonth) / sumaObjetivoPzas) * 100;
    const nombreCompleto = nameUser! + surNameUser;
    const titularSinEspacios = nombreCompleto!.replace(/\s/g, "");
    const capitalizedMonth = dateInfo.month.charAt(0).toUpperCase() + dateInfo.month.slice(1);
    const totalFaltanteEnPiezas = (sumaObjetivoPzas - sumaVentaPiezas) / dateInfo.daysRemaining;
    const totalFaltanteEnDinero = (sumaObjetivoDinero - sumaVentaDinero) / dateInfo.daysRemaining;

    // Lógica de color para la fila TOTAL
    let colorTotal = '#ff4d4d'; // Rojo por defecto
    let mensajeSimulador = '';
    let imageFile = ''; 

    if (tendenciaTotal >= 95) {
      colorTotal = '#4caf50';
      mensajeSimulador = "¡Felicidades! Tu esfuerzo y excelencia destacan en cada detalle. ¡Sigue brillando!";
      imageFile = 'estrella.jpg';
    } else if (tendenciaTotal >= 80 ) {
      colorTotal = '#ffeb3b';
      mensajeSimulador = "¡Buen desempeño! Estás muy cerca de la excelencia.";
      imageFile = 'dardo.jpg';
    } else if (tendenciaTotal >= 70 ) {
      colorTotal = '#ff9800';
      mensajeSimulador = "Cada mejora cuenta. Da un paso hoy hacia tu mejor versión.";
      imageFile = 'escalera.jpg';
    } else {
      colorTotal = '#ff4d4d';
      mensajeSimulador = "Cada mejora comienza con una decisión. ¿Empezamos hoy?";
      imageFile = 'rayo.jpg';
    }

    const imagenMotivacional = await getImageBase64FromAssetsDirect(imageFile);
    

    const options = {
      html: `
      <html>
      <head>
        <style>
          /* Estilos CSS si es necesario */
          table {
            width: 100%;
            border-collapse: collapse;
          }
          table, th, td {
            border: 1px solid black;
          }
          th, td {
            padding: 10px;
            text-align: center;
          }
          h1 {
            text-align: center;
            margin-top: 50px;
            color: #333; /* Cambia el color del texto */
          }
          h3 {
            color: #333; /* Color del texto del h3 */
            font-size: 2rem; /* Tamaño de la fuente del h3 */
            text-align: center;
          }
          p {
            font-size: 21px;
            margin: 5px 0; /* Añadida una pequeña separación entre los párrafos */
          }
          th {
            background-color: #f2f2f6;
            width: 9%;
          }
          .container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 50px;
          }
          .prueba {
            align-items: left;
            background-color: yellow;
          }
          .left, .right {
            padding: 10px;
            width: 50%;
          }
          .data {
            color: #333; /* Color del texto */
            align-items: center;
            padding-left: 20%;
          }
          .contenedor {
            width: 100%;
            background-color: #f0f0f0; /* Color de fondo del contenedor */
            padding: 20px; /* Espaciado interno del contenedor */
            box-sizing: border-box; /* Incluye el relleno y el borde en el ancho y alto totales */
          }
          
          .titulo-reporte {
            width: 100%;
            background: #ff8800;
            padding: 18px 0 18px 0;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }

          .titulo-reporte span {
            color: #fff;
            font-size: 2.3rem;
            font-weight: bold;
            letter-spacing: 2px;
            font-family: Arial, Helvetica, sans-serif;
            text-shadow: 1px 1px 2px #b85c00;
          }
        </style>
      </head>
      <body>

        <div class="titulo-reporte">
          <span>REPORTE DE VENTAS</span>
        </div>
        
        <div class="container">
          <div class="left">
            <div class="data"> 
              <p><strong>${capitalizedMonth} ${dateInfo.year}</strong></p>
              <p><strong>Nombre titular:</strong> ${nameUser!} ${surNameUser!}</p>
              <p><strong>Tienda:</strong> ${sucursalName}</p>
            </div>
          </div>
          <div class="right">
            <div class="data">
              <p><strong>Días del mes:</strong> ${dateInfo.daysInMonth}</p>
              <p><strong>Días transcurridos:</strong> ${dateInfo.daysElapsed}</p>
              <p><strong>Faltan días:</strong> ${dateInfo.daysRemaining}</p>
            </div>
          </div>
        </div>
        <table style="width: 100%;">
          <tr>
            <th>Producto</th>
            <th>Objetivo Pzas</th>
            <th>Objetivo $$$</th>
            <th>Ventas Piezas</th>
            <th>Ventas $$$</th>
            <th>Alcance Piezas</th>
            <th>Alcance $$$</th>
            <th>Tendencia Piezas</th>
            <th>Tendencia $$$</th>
            <th>Se debe vender diario en Piezas</th>
            <th>Se debe vender diario en $$$</th>
          </tr>
          ${rowsObjetivo}
          <tr>
            <th>TOTAL</th>
            <th >${sumaObjetivoPzas}</th>
            <th >$${formatMoney(sumaObjetivoDinero)}</th>
            <th >${sumaVentaPiezas}</th>
            <th >$${formatMoney(sumaVentaDinero)}</th>
            <th >${alcance.toFixed(0)}%</th>
            <th >${alcance.toFixed(0)}%</th>
            <th style="background-color: ${colorTotal}; font-weight: bold;">${tendenciaTotal.toFixed(0)}%</th>
            <th style="background-color: ${colorTotal}; font-weight: bold;">${tendenciaTotal.toFixed(0)}%</th>
            <th >${totalFaltanteEnPiezas.toFixed(0)}</th>
            <td >$${formatMoney(totalFaltanteEnDinero)}</td>
          </tr>
        </table>
        <div class="contenedor" style="text-align: center;">
          <img src="${imagenMotivacional}" alt="motivacional" style="width: 140px; height: 140px; background: transparent;"/>
          <h3>
            ${mensajeSimulador}
          </h3>
        </div>
      </body>
      </html>
      `,
      fileName: 'ReporteSimulador' + titularSinEspacios,
      directory: 'Documents',
      width: windowWidth,
    };

    // Llama a la función de generación del PDF con los nuevos valores
    RNHTMLtoPDF.convert(options).then((file) => {
      // Muestra el nuevo PDF en tu aplicación
      props.navigation.navigate('VerReportesSimulador', { urlPdf: file.filePath });
      // Esto dependerá de cómo estás mostrando los PDF en tu aplicación.
    });

    const file = await RNHTMLtoPDF.convert(options);
    return file.filePath;

  };

  const createPDFWithDinero = async () => {

    // Funcion auxiliar para semaforo de Tendencia 
      const getColorForTendencia = (pct: number) => {
        if (pct >= 95)       return '#4caf50'
        if (pct >= 80)       return '#ffeb3b'
        if (pct >= 70)       return '#ff9800'
        return '#ff4d4d'  
      }

    const rowsObjetivo = objetivoDinero.map((value, index) => {
      const concepto = productos[index];
      const objetivo = objetivoPieza[index];
      const objetivoPrice = objetivoDinero[index];

      const venta = respuestas[index] || 0; 
      const alcanceIndividual = objetivoPrice > 0 ? (venta / objetivoPrice) * 100 : 0; 

      // Calcular tendencia individual 
      const tendencia = tendencias[index] || 0;
      const colorTendencia = getColorForTendencia(tendencia);

      return `
        <tr>
          <td>${concepto}</td>
          <td>${objetivo}</td>
          <td>$${formatMoney(objetivoPrice)}</td>
          <td>${ventas[index]}</td>
          <td>$${formatMoney(respuestas[index])}</td>
          <td>${alcances[index].toFixed(0)}%</td>
          <td>${alcances[index].toFixed(0)}%</td>
          <td style="background-color: ${colorTendencia}; font-weight: bold;">${tendencias[index].toFixed(0)}%</td>
          <td style="background-color: ${colorTendencia}; font-weight: bold;">${tendencias[index].toFixed(0)}%</td>
          <td>${faltantePiezas[index].toFixed(0)}</td>
          <td>$${Math.trunc(faltanteDinero[index]).toLocaleString()}</td>
        </tr>
      `;
    }).join('\n');
    const dateInfo = getCurrentDate();
    // Calcular la suma de valores en la columna "Objetivo Pzas"
    const sumaObjetivoPzas = objetivoPieza.reduce((acc, valor) => acc + valor, 0);
    // Calcular la suma de valores en la columna "Objetivo $$$"
    const sumaObjetivoDinero = objetivoDinero.reduce((acc, valor) => acc + valor, 0);
    const sumaVentaDinero = respuestas.reduce((acc, valor) => acc + valor, 0);
    const sumaVentaPiezas = ventas.reduce((acc, valor) => acc + valor, 0);
    const alcance = (sumaVentaPiezas / sumaObjetivoPzas) * 100;
    const tendenciaTotal = (((sumaVentaPiezas / dateInfo.daysElapsed) * dateInfo.daysInMonth) / sumaObjetivoPzas) * 100;
    const nombreCompleto = nameUser! + surNameUser;
    const titularSinEspacios = nombreCompleto!.replace(/\s/g, "");
    const capitalizedMonth = dateInfo.month.charAt(0).toUpperCase() + dateInfo.month.slice(1);
    const totalFaltanteEnPiezas = (sumaObjetivoPzas - sumaVentaPiezas) / dateInfo.daysRemaining;
    const totalFaltanteEnDinero = (sumaObjetivoDinero - sumaVentaDinero) / dateInfo.daysRemaining;

    // Lógica de color para la fila TOTAL
    let colorTotal = '#ff4d4d'; // Rojo por defecto
    let mensajeSimulador = '';
    let imageFile = '';

    if (tendenciaTotal >= 95) {
      colorTotal = '#4caf50';
      mensajeSimulador = "¡Felicidades! Tu esfuerzo y excelencia destacan en cada detalle. ¡Sigue brillando!";
      imageFile = 'estrella.jpg';
    } else if (tendenciaTotal >= 80 ) {
      colorTotal = '#ffeb3b';
      mensajeSimulador = "¡Buen desempeño! Estás muy cerca de la excelencia.";
      imageFile = 'dardo.jpg';
    } else if (tendenciaTotal >= 70 ) {
      colorTotal = '#ff9800';
      mensajeSimulador = "Cada mejora cuenta. Da un paso hoy hacia tu mejor versión.";
      imageFile = 'escalera.jpg';
    } else {
      colorTotal = '#ff4d4d';
      mensajeSimulador = "Cada mejora comienza con una decisión. ¿Empezamos hoy?";
      imageFile = 'rayo.jpg';
    }

    const imagenMotivacional = await getImageBase64FromAssetsDirect(imageFile);

    const options = {
      html: `
      <html>
      <head>
        <style>
          /* Estilos CSS si es necesario */
          table {
            width: 100%;
            border-collapse: collapse;
          }
          table, th, td {
            border: 1px solid black;
          }
          th, td {
            padding: 10px;
            text-align: center;
          }
          h1 {
            text-align: center;
            margin-top: 50px;
            color: #333; /* Cambia el color del texto */
          }
          h3 {
            color: #333; /* Color del texto del h3 */
            font-size: 2rem; /* Tamaño de la fuente del h3 */
            text-align: center;
          }
          p {
            font-size: 21px;
            margin: 5px 0; /* Añadida una pequeña separación entre los párrafos */
          }
          th {
            background-color: #f2f2f6;
            width: 9%;
          }
          .container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 50px;
          }
          .prueba {
            align-items: left;
            background-color: yellow;
          }
          .left, .right {
            padding: 10px;
            width: 50%;
          }
          .data {
            color: #333; /* Color del texto */
            align-items: center;
            padding-left: 20%;
          }
          .contenedor {
            width: 100%;
            background-color: #f0f0f0; /* Color de fondo del contenedor */
            padding: 20px; /* Espaciado interno del contenedor */
            box-sizing: border-box; /* Incluye el relleno y el borde en el ancho y alto totales */
          }

          .titulo-reporte {
            width: 100%;
            background: #ff8800;
            padding: 18px 0 18px 0;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .titulo-reporte span {
            color: #fff;
            font-size: 2.3rem;
            font-weight: bold;
            letter-spacing: 2px;
            font-family: Arial, Helvetica, sans-serif;
            text-shadow: 1px 1px 2px #b85c00;
          }
        </style>
      </head>
      <body>

        <div class="titulo-reporte">
          <span>REPORTE DE VENTAS</span>
        </div>

        <div class="container">
          <div class="left">
            <div class="data"> 
              <p><strong>${capitalizedMonth} ${dateInfo.year}</strong></p>
              <p><strong>Nombre titular:</strong> ${nameUser!} ${surNameUser!}</p>
              <p><strong>Tienda:</strong> ${sucursalName}</p>
            </div>
          </div>
          <div class="right">
            <div class="data">
              <p><strong>Días del mes:</strong> ${dateInfo.daysInMonth}</p>
              <p><strong>Días transcurridos:</strong> ${dateInfo.daysElapsed}</p>
              <p><strong>Faltan días:</strong> ${dateInfo.daysRemaining}</p>
            </div>
          </div>
        </div>
        <table style="width: 100%;">
          <tr>
            <th>Producto</th>
            <th>Objetivo Pzas</th>
            <th>Objetivo $$$</th>
            <th>Ventas Piezas</th>
            <th>Ventas $$$</th>
            <th>Alcance Piezas</th>
            <th>Alcance $$$</th>
            <th>Tendencia Piezas</th>
            <th>Tendencia $$$</th>
            <th>Se debe vender diario en Piezas</th>
            <th>Se debe vender diario en $$$</th>
          </tr>
          ${rowsObjetivo}
          <tr>
            <th>TOTAL</th>
            <th >${sumaObjetivoPzas}</th>
            <th >$${formatMoney(sumaObjetivoDinero)}</th>
            <th >${sumaVentaPiezas}</th>
            <th >$${formatMoney(sumaVentaDinero)}</th>
            <th >${alcance.toFixed(0)}%</th>
            <th >${alcance.toFixed(0)}%</th>
            <th style="background-color: ${colorTotal}; font-weight: bold;">${tendenciaTotal.toFixed(0)}%</th>
            <th style="background-color: ${colorTotal}; font-weight: bold;">${tendenciaTotal.toFixed(0)}%</th>
            <th >${totalFaltanteEnPiezas.toFixed(0)}</th>
            <td >$${formatMoney(totalFaltanteEnDinero)}</td>
          </tr>
        </table>
        <div class="contenedor" style="text-align: center;">
          <img src="${imagenMotivacional}" alt="motivacional" style="width: 140px; height: 140px; background: transparent;"/>
          <h3>
            ${mensajeSimulador}
          </h3>
        </div>
      </body>
      </html>
      `,
      fileName: 'ReporteSimulador' + titularSinEspacios,
      directory: 'Documents',
      width: windowWidth,
    };

    // Llama a la función de generación del PDF con los nuevos valores
    RNHTMLtoPDF.convert(options).then((file) => {
      // Muestra el nuevo PDF en tu aplicación
      props.navigation.navigate('VerReportesSimulador', { urlPdf: file.filePath });
      // Esto dependerá de cómo estás mostrando los PDF en tu aplicación.
    });

    const file = await RNHTMLtoPDF.convert(options);
    return file.filePath;

  };

  const createPDFOnlyTotalAmount = async () => {

    // Funcion auxiliar para semaforo de Tendencia 
      const getColorForTendencia = (pct: number) => {
        if (pct >= 95)       return '#4caf50'
        if (pct >= 80)       return '#ffeb3b'
        if (pct >= 70)       return '#ff9800'
        return '#ff4d4d'  
      }


    const rowsObjetivo = objetivoDinero.map((value, index) => {
      const concepto = productos[index];
      const objetivoPrice = objetivoDinero[index];

      // Calcular tendencia individual 
      const tendencia = tendencias[index] || 0;
      const colorTendencia = getColorForTendencia(tendencia);


      return `
        <tr>
          <td>${concepto}</td>
          <td>$${formatMoney(objetivoPrice)}</td>
          <td>$${formatMoney(respuestas[index])}</td>
          <td>${alcances[index].toFixed(0)}%</td>
          <td style="background-color: ${colorTendencia}; font-weight: bold;">${tendencias[index].toFixed(0)}%</td>
          <td >$${Math.trunc(faltanteDinero[index]).toLocaleString()}</td>
        </tr>
      `;
    }).join('\n');
    const dateInfo = getCurrentDate();
    // Calcular la suma de valores en la columna "Objetivo Pzas"

    // Calcular la suma de valores en la columna "Objetivo $$$"
    const sumaObjetivoDinero = objetivoDinero.reduce((acc, valor) => acc + valor, 0);
    const sumaVentaDinero = respuestas.reduce((acc, valor) => acc + valor, 0);
    const alcance = (sumaVentaDinero / sumaObjetivoDinero) * 100;
    const tendenciaTotal = (((sumaVentaDinero / dateInfo.daysElapsed) * dateInfo.daysInMonth) / sumaObjetivoDinero) * 100;
    const nombreCompleto = nameUser! + surNameUser;
    const titularSinEspacios = nombreCompleto!.replace(/\s/g, "");
    const capitalizedMonth = dateInfo.month.charAt(0).toUpperCase() + dateInfo.month.slice(1);
    const totalFaltanteEnDinero = (sumaObjetivoDinero - sumaVentaDinero) / dateInfo.daysRemaining;

    // Lógica de color para la fila TOTAL
    let colorTotal = '#ff4d4d'; // Rojo por defecto
    let mensajeSimulador = '';
    let imageFile = ''; 

    if (tendenciaTotal >= 95) {
      colorTotal = '#4caf50';
      mensajeSimulador = "¡Felicidades! Tu esfuerzo y excelencia destacan en cada detalle. ¡Sigue brillando!";
      imageFile = 'estrella.jpg';
    } else if (tendenciaTotal >= 80 ) {
      colorTotal = '#ffeb3b';
      mensajeSimulador = "¡Buen desempeño! Estás muy cerca de la excelencia.";
      imageFile = 'dardo.jpg';
    } else if (tendenciaTotal >= 70 ) {
      colorTotal = '#ff9800';
      mensajeSimulador = "Cada mejora cuenta. Da un paso hoy hacia tu mejor versión.";
      imageFile = 'escalera.jpg';
    } else {
      colorTotal = '#ff4d4d';
      mensajeSimulador = "Cada mejora comienza con una decisión. ¿Empezamos hoy?";
      imageFile = 'rayo.jpg';
    }

    const imagenMotivacional = await getImageBase64FromAssetsDirect(imageFile);

    const options = {
      html: `
      <html>
      <head>
        <style>
          /* Estilos CSS si es necesario */
          table {
            width: 100%;
            border-collapse: collapse;
          }
          table, th, td {
            border: 1px solid black;
          }
          th, td {
            padding: 10px;
            text-align: center;
          }
          h1 {
            text-align: center;
            margin-top: 50px;
            color: #333; /* Cambia el color del texto */
          }
          h3 {
            color: #333; /* Color del texto del h3 */
            font-size: 2rem; /* Tamaño de la fuente del h3 */
            text-align: center;
          }
          p {
            font-size: 21px;
            margin: 5px 0; /* Añadida una pequeña separación entre los párrafos */
          }
          th {
            background-color: #f2f2f6;
            width: 9%;
          }
          .container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 50px;
          }
          .prueba {
            align-items: left;
            background-color: yellow;
          }
          .left, .right {
            padding: 10px;
            width: 50%;
          }
          .data {
            color: #333; /* Color del texto */
            align-items: center;
            padding-left: 20%;
          }
          .contenedor {
            width: 100%;
            background-color: #f0f0f0; /* Color de fondo del contenedor */
            padding: 20px; /* Espaciado interno del contenedor */
            box-sizing: border-box; /* Incluye el relleno y el borde en el ancho y alto totales */
          }

          .titulo-reporte {
            width: 100%;
            background: #ff8800;
            padding: 18px 0 18px 0;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .titulo-reporte span {
            color: #fff;
            font-size: 2.3rem;
            font-weight: bold;
            letter-spacing: 2px;
            font-family: Arial, Helvetica, sans-serif;
            text-shadow: 1px 1px 2px #b85c00;
          }
        </style>
      </head>
      <body>

        <div class="titulo-reporte">
          <span>REPORTE DE VENTAS</span>
        </div>
        
        <div class="container">
          <div class="left">
            <div class="data"> 
              <p><strong>${capitalizedMonth} ${dateInfo.year}</strong></p>
              <p><strong>Nombre titular:</strong> ${nameUser!} ${surNameUser!}</p>
              <p><strong>Tienda:</strong> ${sucursalName}</p>
            </div>
          </div>
          <div class="right">
            <div class="data">
              <p><strong>Días del mes:</strong> ${dateInfo.daysInMonth}</p>
              <p><strong>Días transcurridos:</strong> ${dateInfo.daysElapsed}</p>
              <p><strong>Faltan días:</strong> ${dateInfo.daysRemaining}</p>
            </div>
          </div>
        </div>
        <table style="width: 100%;">
          <tr>
            <th>Concepto</th>
            <th>Objetivo $$$</th>
            <th>Ventas $$$</th>
            <th>Alcance $$$</th>
            <th>Tendencia $$$</th>
            <th>Se debe vender diario en $$$</th>
          </tr>
          ${rowsObjetivo}
          <tr>
            <th>TOTAL</th>
            <th >$${formatMoney(sumaObjetivoDinero)}</th>
            <th >$${formatMoney(sumaVentaDinero)}</th>
            <th >${alcance.toFixed(0)}%</th>
            <th style="background-color: ${colorTotal}; font-weight: bold;">${tendenciaTotal.toFixed(0)}%</th>
            <td >$${formatMoney(totalFaltanteEnDinero)}</td>
          </tr>
        </table>
        <div class="contenedor" style="text-align: center;">
          <img src="${imagenMotivacional}" alt="motivacional" style="width: 140px; height: 140px; background: transparent;"/>
          <h3>
            ${mensajeSimulador}
          </h3>
        </div>
      </body>
      </html>
      `,
      fileName: 'ReporteSimulador' + titularSinEspacios,
      directory: 'Documents',
      width: windowWidth,
    };

    // Llama a la función de generación del PDF con los nuevos valores
    RNHTMLtoPDF.convert(options).then((file) => {
      // Muestra el nuevo PDF en tu aplicación
      props.navigation.navigate('VerReportesSimulador', { urlPdf: file.filePath });
      // Esto dependerá de cómo estás mostrando los PDF en tu aplicación.
    });

    const file = await RNHTMLtoPDF.convert(options);
    return file.filePath;

  };



  const calculateSimulator = async () => {
    const hasNullResponses = respuestas.some(respuesta => respuesta === null);
    if (hasNullResponses) {
      Snackbar.show({
        text: 'Hay algun campo vacío, favor de llenar todos',
        duration: Snackbar.LENGTH_LONG,
        textColor: '#ed7d18',
      });
    } else {
      const dateInfo = getCurrentDate();
      let pdfPath = null;

      if (totalObjetive !== 0) {
        respuestas.map((dinero, index) => {
          ventas[index] = dinero;
          alcances[index] = (dinero / objetivoDinero[index]) * 100;
          tendencias[index] = (((respuestas[index] / dateInfo.daysElapsed) * dateInfo.daysInMonth) / objetivoDinero[index]) * 100;
          faltanteDinero[index] = (objetivoDinero[index] - dinero) / dateInfo.daysRemaining;
        });

        pdfPath = await createPDFOnlyTotalAmount();

      } else {
        if (totalPiezaEsEntero) {
          respuestas.map((piezas, index) => {
            ventas[index] = precioUnitario[index] * piezas;
            alcances[index] = (piezas / objetivoPieza[index]) * 100;
            tendencias[index] = (((respuestas[index] / dateInfo.daysElapsed) * dateInfo.daysInMonth) / objetivoPieza[index]) * 100;
            faltantePiezas[index] = (objetivoPieza[index] - piezas) / dateInfo.daysRemaining;
            faltanteDinero[index] = ((objetivoPieza[index] - piezas) / dateInfo.daysRemaining) * precioUnitario[index];
          });

          pdfPath = await createPDFWithPiezasEnteras();

        } else {
          respuestas.map((dinero, index) => {
            ventas[index] = Math.floor(dinero / precioUnitario[index]);
            alcances[index] = (dinero / objetivoDinero[index]) * 100;
            tendencias[index] = (((respuestas[index] / dateInfo.daysElapsed) * dateInfo.daysInMonth) / objetivoDinero[index]) * 100;
            faltanteDinero[index] = (objetivoDinero[index] - dinero) / dateInfo.daysRemaining;
            faltantePiezas[index] = ((objetivoDinero[index] - dinero) / dateInfo.daysRemaining) / precioUnitario[index];
          });

          pdfPath = await createPDFWithDinero();

        }
      }

      setTimeout(() => {
        if (pdfPath) {
          props.navigation.navigate('VerReportesSimulador', { urlPdf: pdfPath });
        }
      }, 3000);

    }
  };

  //cargara los valores iniciales del
  const fetchData = async () => {
    const surNameUserSession = await AsyncStorage.getItem('surname');
    const nameUserSession = await AsyncStorage.getItem('name');
    setNameUser(nameUserSession);
    setSurNameUser(surNameUserSession);
    NetworkService.init();
    if (NetworkService.isConnected === true && NetworkService.isInternetReacheable === true) {
      setConnectedWifi(true);
      setLoading(true);
      try {
        const response = await new TrustValueApi().getSimulator();
        if (
          (response.status === 200 ||
            response.status === 201) &&
          response.data.status === 1
        ) {
          setLoading(false);
          setSucursalName(response.data.data.branch_office.name);
          if (response.data.data.total_pieces === null) {
            setTotalObjetive(Number(response.data.data.total_amount));
            setProductos(['Objetivo Gral de la Tienda']);
            setObjetivoDinero([Number(response.data.data.total_amount)]);
            setRespuestas([null]);
            setFormatedRespuestas([null])
            setTotalPiezaEsEntero(null)
          } else {
            const productsAux: any[] = response.data.data.products;
            //sabremos si los objetivos fueron cargados en dinero o en piezas
            const preciosUnitarios: number[] = [];
            const piezasEnteras: number[] = [];
            const dineroEntero: number[] = [];
            const nombresProductos: string[] = [];
            productsAux.map((producto: any, index) => {
              piezasEnteras[index] = Math.floor(producto.pivot.pieces);
              preciosUnitarios[index] = producto.price;
              nombresProductos[index] = producto.name;
              dineroEntero[index] = Number(producto.pivot.amount);
              respuestas[index] = null;
            });
            setProductos(nombresProductos);
            setPrecioUnitario(preciosUnitarios);
            setObjetivoPieza(piezasEnteras);
            setObjetivoDinero(dineroEntero);
            console.log('total pìezas es ' + response.data.data.total_pieces.toString());
            console.log(response.data.data.total_pieces.toString().match(/\.00$/))
            if (response.data.data.total_pieces.toString().match(/\.00$/)) {
              setTotalPiezaEsEntero(true);
            } 
          }
        } else {
          setLoading(false);
          Snackbar.show({
            text: response.data.errors[0],
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
      setConnectedWifi(false);
      // Si no hay conexión a Internet, obtén los datos de la tabla local
    }
  };

  function formatNumber(numero: string) {

    // Eliminar cualquier carácter que no sea un dígito
    const cleanedNumber = numero.replace(/[^\d]/g, '');
    return cleanedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function setPiezasWithComas(numero: string) {
  const formattedNumber:string = numero.toString().replace(/[^\d]/g, '');
   return formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Función para formatear números de dinero con comas
function formatMoney(number: number): string {
  return Math.round(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

  // Para el boton de clacular 
  const [calculando, setCalculando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );
  return (
    <View style={styles.container}>
      <Header texto="Simulador" />
      {connectedWifi ? (
        // Renderizar cuando connectedWifi es true
        loading ? (
          // Renderizar Activity Indicator si loading es true
          <View style={styles.containerIndicator}>
            <ActivityIndicator size={50} color="#ed7d18" />
          </View>
        ) : (
          // Renderizar contenido original si loading es false
          <>
            <View style={styles.containerTitle}>
              <Text style={styles.title}>{sucursalName}</Text>
              <Text style={styles.subTitle}>Reporte de Ventas</Text>
            </View>
            {totalPiezaEsEntero ? (
              // Renderizar cuando totalPiezaEsEntero es true
              <ScrollView style={{ marginBottom: '15%', marginTop: '5%' }}>

                {productos!.map((item: any, index: number) => (
                  <View key={index} style={styles.containerPregunta}>
                    <View style={styles.containerInnerPregunta}>
                      <View style={styles.containerLeft}>
                        <Text style={{ ...styles.textPregunta, color: '#ed7d18', fontWeight: '500' }}>{item}</Text>
                        <Text style={styles.textPregunta}>Objetivo en Piezas {objetivoPieza[index].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</Text>
                      </View>
                    </View>

                      <View style={{ padding: 10 }}>
                        <View style={{ alignItems: 'stretch', width: '100%' }}>
                        <TextInputError
                            keyboardType="numeric"
                            mode="outlined"
                            textColor="black"
                            label="Objetivo en piezas vendido hasta ahora"
                            placeholder="Objetivo en piezas vendido hasta ahora"
                            outlineColor="#c1c1c1"
                            value={respuestas[index] !== null ? setPiezasWithComas(respuestas[index].toString()): ''}
                            style={{
                              backgroundColor: '#fff',
                              width: '95%',
                            }}
                            onChangeText={text => {
                              const sinComas = text.replace(/[^\d]/g, '');                              
                              if (/^[0-9]+(?:\.[0-9]+)?$/.test(sinComas)) {
                                handleErrors(index, null);
                                handleFormatedRespuestas(index, parseInt(sinComas))
                                handleRespuesta(index,  parseInt(sinComas))
                                // Si tiene un formato numérico válido, llama a handleRespuesta con el valor convertido a número
                              } else {
                                handleErrors(
                                  index,
                                  'El valor ingresado no es un número valido.',
                                );
                                handleRespuesta(index, null);
                                console.log('No es un número válido: ' + text);
                              }
                            }}

                          />

                          {errores[index] && (
                            <Text style={styles.errorText}>{errores[index]}</Text>
                          )}
                        </View>
                      </View>

                  </View>
                ))}

              </ScrollView>
            ) : totalPiezaEsEntero === false ? (
              // Renderizar cuando totalPiezaEsEntero es false
              <ScrollView style={{ marginBottom: '15%', marginTop: '5%' }}>
                {productos!.map((item: any, index: number) => (
                  <View key={index} style={styles.containerPregunta}>
                    <View style={styles.containerInnerPregunta}>
                      <View style={styles.containerLeft}>
                        <Text style={{ ...styles.textPregunta, color: '#ed7d18', fontWeight: '500' }}>{item}</Text>
                        <Text style={styles.textPregunta}>El Objetivo en Ventas($) es {(objetivoDinero[index] + '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.00'}</Text>
                      </View>
                    </View>
                    {expandedItems[index] && (
                      <View style={{ padding: 10 }}>
                        <View style={{ alignItems: 'stretch', width: '100%' }}>
                        <TextInputError
                            keyboardType="numeric"
                            mode="outlined"
                            textColor="black"
                            label="Objetivo en piezas vendido hasta ahora"
                            placeholder="Objetivo en piezas vendido hasta ahora"
                            outlineColor="#c1c1c1"
                            value={formatedRespuestas[index] !== null ? formatNumber(formatedRespuestas[index].toString()): ''}
                            style={{
                              backgroundColor: '#fff',
                              width: '95%',
                            }}
                            onChangeText={text => {
                              if(text === '.'){
                                text = '0'
                              }
                              const sinComas = text.replace(/[^\d]/g, '');                              
                              if (/^[0-9]+(?:\.[0-9]+)?$/.test(sinComas)) {
                                handleErrors(index, null);
                                handleFormatedRespuestas(index, parseInt(sinComas))
                                handleRespuesta(index, parseInt(sinComas.slice(0,sinComas.length - 2)))
                                // Si tiene un formato numérico válido, llama a handleRespuesta con el valor convertido a número
                              } else {
                                handleErrors(
                                  index,
                                  'El valor ingresado no es un número valido.',
                                );
                                handleRespuesta(index, null);
                                console.log('No es un número válido: ' + text);
                              }
                            }}
                          
                          />
                          {errores[index] && (
                            <Text style={styles.errorText}>{errores[index]}</Text>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <ScrollView style={{ marginBottom: '15%', marginTop: '5%' }}>
                {productos!.map((item: any, index: number) => (
                  <View key={index} style={styles.containerPregunta}>
                    <View style={styles.containerInnerPregunta}>
                      <View style={styles.containerLeft}>
                        <Text style={{ ...styles.textPregunta, color: '#ed7d18', fontWeight: '500' }}>{item}</Text>
                        <Text style={styles.textPregunta}>El Objetivo total de la tienda es {objetivoDinero[index].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }</Text>
                      </View>

                    </View>

                      <View style={{ padding: 10 }}>
                        <View style={{ alignItems: 'stretch', width: '100%' }}>
                          <TextInputError
                            keyboardType="numeric"
                            mode="outlined"
                            textColor="black"
                            label={totalPiezaEsEntero ? "Objetivo en piezas vendido hasta ahora" : "Objetivo en $$ vendido hasta ahora"}
                            placeholder={totalPiezaEsEntero ? "Objetivo en piezas vendido hasta ahora" : "Objetivo en $$ vendido hasta ahora"}
                            outlineColor="#c1c1c1"
                            value={
                              totalPiezaEsEntero
                                ? (respuestas[index] !== null ? setPiezasWithComas(respuestas[index].toString()) : '')
                                : (respuestas[index] !== null ? `$${formatNumber(respuestas[index].toString())}` : '')
                            }
                            style={{
                              backgroundColor: '#fff',
                              width: '95%',
                            }}
                            onChangeText={text => {
                              // Elimina el símbolo $ si lo hay
                              let cleanText = text.replace(/\$/g, '');
                              const sinComas = cleanText.replace(/[^\d]/g, '');
                              if (/^[0-9]+(?:\.[0-9]+)?$/.test(sinComas)) {
                                handleErrors(index, null);
                                handleFormatedRespuestas(index, parseInt(sinComas));
                                handleRespuesta(index, parseInt(sinComas));
                              } else {
                                handleErrors(index, 'El valor ingresado no es un número valido.');
                                handleRespuesta(index, null);

                              }
                            }}
                            
                          />
                          {errores[index] && (
                            <Text style={styles.errorText}>{errores[index]}</Text>
                          )}
                        </View>
                      </View>

                  </View>
                ))}
              </ScrollView>
            )}
            {calculando && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255,255,255,0.7)',
                zIndex: 999,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <ActivityIndicator size={60} color="#ed7d18" />
                <Text style={{ marginTop: 20, fontSize: 18, color: '#ed7d18', fontWeight: 'bold' }}>
                  Calculando, por favor espera...
                </Text>
              </View>
            )}
            <View style={styles.buttonFixed}>
              <Button
                mode="text"
                onPress={async () => {
                  Keyboard.dismiss(); // Cierra el teclado al presionar calcular
                  if (calculando) return;
                  setCalculando(true);
                  try {
                    await calculateSimulator();
                    // El loader se ocultará después de navegar (en el setTimeout)
                    setTimeout(() => setCalculando(false), 3000);
                  } catch {
                    setCalculando(false);
                  }
                }}
                disabled={calculando}
                textColor="#fff"
                labelStyle={{ ...styles.buttonFont, color: '#7e2b05' }}>
                CALCULAR
              </Button>
            </View>
            <View style={styles.containerPositionButton}>
              <IconButton
                icon="home"
                iconColor="#ed7d18"
                size={50}
                onPress={() => props.navigation.goBack()}
              />
            </View>

          </>
        )
      ) : (
        // Renderizar cuando connectedWifi es false
        <View style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          paddingBottom: '20%',
        }}>
          <Image
            style={{ width: 140, height: 140 }}
            source={require('../assets/sademoji.gif')}
          />
          <Text style={{ fontSize: 19, fontWeight: '400', marginTop: '3%' }}>
            NO HAY CONEXION A INTERNET
          </Text>
        </View>
      )}
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerTitle: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '5%',
  },
  title: {
    color: '#7e2b05',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subTitle: {
    color: '#837c79',
    fontSize: 20,
    fontStyle: 'italic',
  },
  containerSimulador: {
    flexDirection: 'column',
    marginTop: '1%',
    width: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    backgroundColor: 'blue',
    width: '100%',
    height: 120,
    marginBottom: '2%',
  },
  buttonFont: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonFixed: {
    width: '95%',
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: '20%',
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#7e2b05',
  },
  containerPositionButton: {
    position: 'absolute',
    width: '30%',
    height: 55,
    bottom: '3%',
    borderTopRightRadius: 40,
    alignItems: 'flex-start',
  },
  containerPregunta: {
    flexDirection: 'column',
    width: '96%',
    borderRadius: 10,
    borderColor: '#c1c1c1',
    borderWidth: 1,
    marginVertical: 4,
    marginLeft: 5,
    paddingVertical: 6,
    paddingLeft: 5,
  },
  containerInnerPregunta: {
    flexDirection: 'row',
    width: '100%',
  },
  containerLeft: {
    width: '85%',
    padding: 5,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  containerRight: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textPregunta: {
    fontSize: 16,
    fontWeight: '400',
    color: '#888',
  },
  errorText: {
    color: 'red',
    marginLeft: '1%',
    marginTop: '-3%',
    fontWeight: 'bold',
  },
  containerIndicator: {
    width: '100%',
    alignItems: 'center',
    marginTop: '90%',
  },


});