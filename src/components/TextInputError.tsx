import React from 'react';
import {View, TextInput as RNTextInput} from 'react-native';
import {HelperText, TextInput, TextInputProps} from 'react-native-paper';



type Props = Omit<TextInputProps, 'theme'> & {
  errorMessage?: String | undefined;
  touched?: boolean | undefined;
};

const TextInputError = React.forwardRef<RNTextInput, Props>((props, ref) => {
  var hasErrorResult = hasError(props.errorMessage, props.touched);
  return (
    <View>
      <TextInput
        ref={ref}
        {...props}
        error={hasErrorResult}
        autoCapitalize="none"
      />
      <HelperText type="error" visible={hasErrorResult}>
        {props.errorMessage}
      </HelperText>
    </View>
  );
});

function hasError(
  message: String | undefined,
  touched: boolean | undefined,
): boolean {
  return message !== undefined && touched !== undefined && touched;
}


export default TextInputError;
