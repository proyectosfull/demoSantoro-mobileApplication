/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { StyleSheet, View, Text} from 'react-native';

interface UserDataProps {
    column: string;
    infoColumn: string;
}

export default function UserData(props: UserDataProps) {
    return (
        <View style={styles.rowData}>
            <View style={styles.containerLeft}>
               <Text style={{...styles.styleText,fontWeight: '500'}}> {props.column}: </Text>
            </View>
            <View style={styles.containerRight}>
              <Text style={styles.styleText}> {props.infoColumn} </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rowData: {
       flexDirection:'row',
       width: '90%',
       borderBottomColor:'#ccc',
       borderBottomWidth: 0.5,
       height:'16%',
    },
    styleText: {
        color: '#000',
        fontSize: 17,
    },
    containerLeft: {
       alignItems: 'flex-start',
       flexDirection:'column',
       justifyContent:'center',
       width:'50%',
    },
    containerRight: {
        alignItems: 'flex-end',
        justifyContent:'center',
        width:'50%',
     },
});
