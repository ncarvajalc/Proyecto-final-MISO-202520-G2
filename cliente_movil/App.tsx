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

const palette = {
  background: '#f3f4f6',
  subtitle: '#4b5563',
  text: '#111827',
} as const;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  subtitle: {
    color: palette.subtitle,
    fontSize: 16,
    marginTop: 12,
  },
  text: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '700',
  },
});
