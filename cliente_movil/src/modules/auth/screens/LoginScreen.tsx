import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Logo } from "../components/Logo";
import { RootStackParamList } from "../../../navigation/RootNavigator";
import { useAuth } from "../../../contexts/auth-hooks";
import { login } from "../../../services/auth.service";

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "Login">;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // Reset errors
    setEmailError("");
    setPasswordError("");

    // Validate
    if (!email) {
      setEmailError("Escribe tu dirección de correo");
      return;
    }
    if (!password) {
      setPasswordError("Escribe tu contraseña");
      return;
    }

    setIsLoading(true);
    try {
      // Call real authentication API
      const data = await login({ email, password });

      // Pass token, user info, and permissions to auth context
      await authLogin(data.token, data.user, data.permissions || []);

      // After successful login, navigate to main app
      navigation.replace("Main");
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Credenciales inválidas";
      setPasswordError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Logo width={176} height={96} />
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.cardContent}>
              {/* Email Field */}
              <View style={styles.field}>
                <Text style={styles.label}>Correo</Text>
                <TextInput
                  style={[
                    styles.input,
                    emailError ? styles.inputError : null,
                  ]}
                  placeholder="Correo"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
              </View>

              {/* Password Field */}
              <View style={styles.field}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={[
                    styles.input,
                    passwordError ? styles.inputError : null,
                  ]}
                  placeholder="Contraseña"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Text>
              </TouchableOpacity>

              {/* Register Institution Button */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate("InstitutionRegistration")}
              >
                <Text style={styles.secondaryButtonText}>
                  Registrar Institución
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  formContainer: {
    width: "100%",
    maxWidth: 448, // max-w-md
    alignSelf: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 8, // gap-2 = 8px
  },
  card: {
    backgroundColor: "#ffffff",
    // No border and no shadow like in web
  },
  cardContent: {
    paddingHorizontal: 24, // px-6
    paddingVertical: 24,
  },
  field: {
    marginBottom: 28, // gap-7 = 28px between fields
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a", // slate-900
    marginBottom: 8,
  },
  input: {
    height: 36, // h-9
    borderWidth: 1,
    borderColor: "#e2e8f0", // slate-200
    borderRadius: 6, // rounded-md
    paddingHorizontal: 12, // px-3
    paddingVertical: 8, // py-1
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "transparent",
  },
  inputError: {
    borderColor: "#ef4444", // red-500
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444", // red-500
    marginTop: 4,
  },
  button: {
    backgroundColor: "#0369A1", // brand-700 primary
    height: 36, // h-9
    borderRadius: 6, // rounded-md
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28, // gap-7 from last field
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#0369A1",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#0369A1",
    fontSize: 14,
    fontWeight: "500",
  },
});
