import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function SolicitudEnviada() {
  const {
    profesional,
    titulo,
    descripcion,
    ubicacion,
    urgencia,
  } = useLocalSearchParams<{
    profesional: string;
    titulo: string;
    descripcion: string;
    ubicacion: string;
    urgencia: string;
  }>();

  function volverAlInicio() {
    router.replace('/inicio-cliente');
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.icono}>✅</Text>

      <Text style={estilos.titulo}>
        ¡Solicitud enviada!
      </Text>

      <Text style={estilos.subtitulo}>
        Tu solicitud fue enviada al profesional.
      </Text>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>
          Profesional
        </Text>

        <Text style={estilos.nombre}>
          {profesional}
        </Text>

        <Text style={estilos.dato}>
          🔧 Profesional seleccionado
        </Text>

        <Text style={estilos.dato}>
          📍 {ubicacion}
        </Text>

        <Text style={estilos.dato}>
          🚨 Urgencia: {urgencia}
        </Text>
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>
          Trabajo solicitado
        </Text>

        <Text style={estilos.trabajo}>
          {titulo}
        </Text>

        <Text style={estilos.descripcion}>
          {descripcion}
        </Text>
      </View>

      <View style={estilos.estado}>
        <Text style={estilos.estadoTitulo}>
          Estado de la solicitud
        </Text>

        <Text style={estilos.estadoTexto}>
          🟡 Pendiente de aceptación
        </Text>
      </View>

      <TouchableOpacity
        style={estilos.boton}
        onPress={volverAlInicio}
      >
        <Text style={estilos.textoBoton}>
          Volver al inicio
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },

  icono: {
    fontSize: 55,
    textAlign: 'center',
    marginBottom: 10,
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },

  tarjeta: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
  },

  etiqueta: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  nombre: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  trabajo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  dato: {
    fontSize: 16,
    marginTop: 5,
  },

  descripcion: {
    fontSize: 15,
    lineHeight: 21,
  },

  estado: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },

  estadoTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  estadoTexto: {
    fontSize: 16,
  },

  boton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
