import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { VisitForm } from "../components/VisitForm";
import { visitService } from "../../../services/visitService";
import { VisitCreate } from "../../../types/visit";

type VisitFormScreenRouteProp = RouteProp<
  { VisitForm: { clientId: string; clientName: string } },
  "VisitForm"
>;

type VisitFormScreenNavigationProp = StackNavigationProp<any>;

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
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la visita");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <VisitForm onSubmit={handleSubmit} initialClientName={clientName} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
