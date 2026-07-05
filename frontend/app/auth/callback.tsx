import { useEffect } from 'react';
import { Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export default function AuthCallback() {
  useEffect(() => {
    // This closes the popup and sends the data back to the login screen
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Completing login...</Text>
    </View>
  );
}