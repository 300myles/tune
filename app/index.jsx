import { Text, Alert } from 'react-native'
import React, { useEffect } from 'react'
import * as Permissions from "expo-permissions";
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const index = () => {
  const requestPermissions = async () => {
    const { status } = await Permissions.askAsync(
      Permissions.AUDIO_RECORDING,
      Permissions.CAMERA
    );
    if (status !== "granted") {
      Alert.alert("Permission for camera and microphone is required!");
    }
    router.push("/call-screen");
  };
  
  useEffect(() => {
    requestPermissions();
  }, []);
  return (
    <SafeAreaView>
      <Text>index</Text>
    </SafeAreaView>
  )
}

export default index