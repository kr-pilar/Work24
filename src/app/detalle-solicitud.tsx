import { useLocalSearchParams, router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DetalleSolicitud() {
  const parametros = useLocalSearchParams<{
    cliente?: string;
    titulo?: string;
    descripcion?: string;
    ubicacion?: string;
    urgencia?: string;
  }>();

  const cliente = parametros.cliente || 'Sin especificar';
  const titulo = parametros.titulo || 'Trabajo sin título';
  const descripcion = parametros.descripcion || 'Sin descripción';
  const ubicacion = parametros.ubicacion || 'Sin especificar';
  const urgencia = parametros.urgencia || 'Sin especificar';

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.titulo}>Detalle de solicitud</Text>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>Trabajo solicitado</Text>
        <Text style={estilos.trabajo}>{titulo}</Text>

        <View style={estilos.separador} />

        <Text style={estilos.etiqueta}>Cliente</Text>
        <Text style={estilos.dato}>{cliente}</Text>

        <Text style={estilos.etiqueta}>Descripción del trabajo</Text>
        <Text style={estilos.dato}>{descripcion}</Text>

        <Text style={estilos.etiqueta}>Ubicación</Text>
        <Text style={estilos.dato}>📍 {ubicacion}</Text>

        <Text style={estilos.etiqueta}>Nivel de urgencia</Text>
        <Text style={estilos.dato}>🚨 {urgencia}</Text>
      </View>

      <TouchableOpacity
        style={estilos.boton}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={estilos.textoBoton}>Volver a solicitudes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 20,
  },

  tarjeta: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dddddd',
  },

  etiqueta: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555555',
    marginTop: 18,
    marginBottom: 6,
  },

  trabajo: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#111111',
  },

  dato: {
    fontSize: 16,
    color: '#222222',
    lineHeight: 24,
  },

  separador: {
    height: 1,
    backgroundColor: '#dddddd',
    marginTop: 18,
  },

  boton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
