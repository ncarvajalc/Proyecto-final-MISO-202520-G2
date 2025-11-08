import React, { useState } from "react";
import { View, StyleSheet, Alert, Text, KeyboardAvoidingView, Platform, } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { InstitutionForm } from "../components/InstitutionForm";
import { institutionalClientService } from "../../../services/institutionalClientService";
import { InstitutionalClientCreate } from "../../../types/institutionalClient";
import { RootStackParamList } from "../../../navigation/RootNavigator";
import { colors } from "../../../constants/colors";

type InstitutionRegistrationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "InstitutionRegistration"
>;

export const InstitutionRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<InstitutionRegistrationScreenNavigationProp>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (institution: InstitutionalClientCreate) => {
    setSubmitting(true);
    try {
      await institutionalClientService.createInstitutionalClient(institution);
      Alert.alert(
        "Éxito",
        "La institución ha sido registrada exitosamente",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (error) {
      console.error("Error registering institution:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al registrar la institución";
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Registro de Institución</Text>
      </View>

      <InstitutionForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    flex: 1,
    ...(Platform.OS === 'web' ? {
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
    } : {}),
  },
  header: {
    backgroundColor: colors.white,
    borderBottomColor: colors.slate200,
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    ...(Platform.OS === 'web' ? {
      position: 'relative',
      top: 0,
      zIndex: 1,
    } : {}),
  },
  title: {
    color: colors.slate900,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
  },
});
