
import { useEffect, useRef, useState } from 'react';

import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Location {
    latitude: number,
    longitude: number
}

export const useLocation = () => {
    const [position, setPosition] = useState<Location | null>(null);
    const [hasLocation, setHasLocation] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
       isMounted.current = true;
       return () => {
        isMounted.current = false;
       }
    }, []);

    useEffect(() => {
        getCurrentLocation().
        then(location => {
            if (!isMounted.current) return;
            if (location.latitude !== 0 && location.longitude !== 0) {
                setPosition(location);
                setHasLocation(true);
                console.log(location);
            }
        });
    }, []);

    const getCurrentLocation = (): Promise<Location> => {
        return new Promise((resolve,reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    if (position.coords.latitude !== 0 && position.coords.longitude !== 0) {
                        AsyncStorage.setItem('latitude', JSON.stringify(position.coords.latitude));
                        AsyncStorage.setItem('longitude', JSON.stringify(position.coords.longitude));
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    }
                },
                (error) => {
                  // See error code charts below.
                  console.log(error.code, error.message);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        })
    }
    return {
        hasLocation,
        position,
        getCurrentLocation

    };
};