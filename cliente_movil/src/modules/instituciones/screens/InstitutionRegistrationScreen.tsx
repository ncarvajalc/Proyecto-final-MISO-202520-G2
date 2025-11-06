import React, { useState } from "react";
import { View, StyleSheet, Alert, Text, KeyboardAvoidingView, Platform, } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { InstitutionForm } from "../components/InstitutionForm";
import { institutionalClientService } from "../../../services/institutionalClientService";
import { InstitutionalClientCreate } from "../../../types/institutionalClient";
import { RootStackParamList } from "../../../navigation/RootNavigator";

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
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "left",
  },
});
