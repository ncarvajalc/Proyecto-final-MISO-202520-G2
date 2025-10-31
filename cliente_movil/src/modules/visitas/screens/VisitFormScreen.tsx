import React, { useState } from "react";
import { View, StyleSheet, Alert, Text, TouchableOpacity } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { VisitForm } from "../components/VisitForm";
import { visitService } from "../../../services/visitService";
import { VisitCreate } from "../../../types/visit";

type VisitFormScreenRouteProp = RouteProp<
  { VisitForm: { clientId: string; clientName: string } },
  "VisitForm"
>;

type VisitFormScreenNavigationProp = StackNavigationProp<{
  VisitList: undefined;
}>;

export const VisitFormScreen: React.FC = () => {
  const route = useRoute<VisitFormScreenRouteProp>();
  const navigation = useNavigation<VisitFormScreenNavigationProp>();
  const { clientId, clientName } = route.params;
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (visit: VisitCreate) => {
    if (!visit.nombre_institucion || !visit.direccion || !visit.estado) {
      Alert.alert("Error", "Por favor complete todos los campos requeridos");
      return;
    }

    setSubmitting(true);
    try {
      await visitService.createVisit(visit);
      Alert.alert("Éxito", "Visita creada correctamente", [
        {
          text: "OK",
          onPress: () => navigation.navigate("VisitList"),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la visita");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#024A77" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visitas</Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>Registro de Visitas</Text>

      <VisitForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        initialClientName={clientName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#024A77",
    textAlign: "center",
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
});
