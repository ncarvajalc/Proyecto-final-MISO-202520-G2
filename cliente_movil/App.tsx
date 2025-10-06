import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export type GreetingProps = {
  name?: string;
};

export const Greeting = ({ name = 'Explorador' }: GreetingProps) => (
  <Text testID="greeting-text" style={styles.text}>
    Hola, {name}
  </Text>
);

export default function App() {
  return (
    <View style={styles.container} testID="app-container">
      <Greeting name="MISO" />
      <Text style={styles.subtitle}>Bienvenido al cliente móvil</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: '#4b5563',
  },
});
