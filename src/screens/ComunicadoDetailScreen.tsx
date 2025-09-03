
import React, { useState,useEffect } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/ParamList';
import Header from '../components/Header';
import { IconButton } from 'react-native-paper';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


type Props = StackScreenProps<RootStackParamList, 'ComunicadoDetailScreen'>;
export default function ComunicadoDetailScreen(props: Props) {

  const { comunicado } = props.route.params;
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  // Navega automaticameente si hay multimedia y no es imagen 
  useEffect(() => {
      // Si es PDF, DOCX, TXT etc. navegar a la pantalla de visualizacion 
      if (comunicado.multimedia && /\.(pdf|docx?|txt)$/i.test(comunicado.multimedia)) {
        props.navigation.replace('ViewPdf', { multimedia: comunicado.multimedia });
      }
  }, [comunicado.multimedia, props.navigation]); 

  if (comunicado.multimedia && /\.(pdf|docx?|txt)$/i.test(comunicado.multimedia)) {
    return null;
  }

  const handleImagePress = () => {
    setIsViewerVisible(true);
  };
  const handleCloseViewer = () => {
    setIsViewerVisible(false);
  };

  return (
    <View style={styles.container}>
      <Header texto="Detalle del mensaje" />
      <View style={styles.detailsContainer}>
        {/* <View style={{ width: '100%', backgroundColor: '#fff3e0', flexDirection: 'column', borderRadius: 10, paddingBottom:10, }}>
          <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', paddingVertical:5, }}>
            <Image
              style={styles.icono}
              source={require('../assets/document.gif')}
            />
            <Text style={styles.titleStyle}>{comunicado.title}</Text>
          </View>
          <View style={{ width: '95%', marginLeft: '3%', height: 0.5, backgroundColor: '#ed7d18', borderWidth: 0.5, borderColor: '#ed7d18' }}></View>
          <View style={{ width: '100%', paddingHorizontal:'4.5%', marginTop:'2%' }}>
            <Text style={{fontWeight:'500', fontSize:18, color:'#888'}}>Descripción del comunicado: </Text>
            <Text style={styles.descriptionStyle}>
              {comunicado.description}
            </Text>
          </View>
        </View> */}
        {/* <View style={{ width: '100%', borderRadius: 10, padding:15, marginTop:'3%', justifyContent:'center', marginBottom:'2%' }}>
           <Text style={{fontWeight:'400', fontSize:20, color:'#888'}}>Multimedia adjunta al comunicado: </Text>
        </View> */}
        {/* {!new RegExp("pdf", "i").test(comunicado.multimedia) ? (
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleImagePress}>
            {comunicado.multimedia ? (
              <Image
                source={{ uri: comunicado.multimedia }}
                style={styles.imageAsist}
              />
            ) : (
              <Icon name="image-off" size={240} color="#c4c3c4" />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.pdfContainer}
            onPress={() => {
              props.navigation.navigate('ViewPdf',{multimedia: comunicado.multimedia});
            }}>
            <Image
              style={styles.pdfImage}
              source={require('../assets/pdf.gif')}
            />
            <Text style={styles.pdfText}>
              Clic en la imagen para ver el archivo PDF
            </Text>
          </TouchableOpacity>
        )} */}

        {comunicado.multimedia && (
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => setIsViewerVisible(true)}>
            <Image
              source={{ uri: comunicado.multimedia }}
              style={styles.imageAsist}
            />
          </TouchableOpacity>
        )}

      </View>
      <View style={styles.backButtonContainer}>
        <IconButton
          icon="arrow-left-thick"
          iconColor="#fff"
          size={30}
          onPress={() => props.navigation.goBack()}
        />
      </View>
      <Modal
        visible={isViewerVisible}
        transparent={true}
        onRequestClose={handleCloseViewer}>
        <ImageViewer
          imageUrls={[
            {
              url: comunicado.multimedia || '',
              props: {
                source: { uri: comunicado.multimedia || '' },
              },
            },
          ]}
          enableSwipeDown
          onCancel={handleCloseViewer}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  detailsContainer: {
    flex: 1,
  },
  titleStyle: {
    fontSize: 24,
    color: '#837c79',
    fontWeight: 'bold',
    marginLeft: 15,
    marginTop: 5,
  },
  descriptionStyle: {
    color: '#888',
    fontSize: 15,
    marginTop: 10,
  },
  imageContainer: {
    width: '100%',
    height: '55%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomColor: '#fff',
    borderBottomWidth: 2,
    marginTop: '-5%',
  },
  imageAsist: {
    width: '80%',
    height: '80%',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#f2f2f6',
  },
  pdfContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60%',
    marginTop:'-10%',
  },
  pdfImage: {
    width: 260,
    height: 260,
  },
  icono: {
    width: 70,
    height: 70,
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: '#ed7d18'
  },
  backButtonContainer: {
    position: 'absolute',
    width: '30%',
    height: 55,
    bottom: 0,
    borderTopRightRadius: 40,
    backgroundColor: '#ed7d18',
    alignItems: 'center',
  },
  pdfText: {
    fontSize: 18,
    marginTop: 10,
    color: '#888',
    textAlign: 'center',
  },
});
