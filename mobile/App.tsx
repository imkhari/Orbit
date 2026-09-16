import React from 'react';
import { StatusBar } from 'react-native';
import { BoardScreen } from './src/screens/BoardScreen';

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <BoardScreen />
    </>
  );
}
