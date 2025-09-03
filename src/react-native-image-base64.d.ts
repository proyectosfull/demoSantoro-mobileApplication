declare module 'react-native-image-base64' {
    const ImageBase64: {
      getBase64String: (uri: string) => Promise<string>;
    };
    export default ImageBase64;
  }
