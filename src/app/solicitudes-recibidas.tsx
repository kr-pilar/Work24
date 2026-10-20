import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { router } from 'expo-router';

export default function SolicitudesRecibidas() {
  function verSolicitud() {
    router.push({
      pathname: '/detalle-solicitud',
      params: {
        cliente: 'Ángel',
        titulo: 'Instalación de aire acondicionado',
        descripcion: 'Necesito instalar un aire en una habitación.',
        ubicacion: 'José C. Paz',
        urgencia: 'Media',
      },
    });
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.titulo}>Solicitudes recibidas</Text>

      <Text style={estilos.subtitulo}>
        Trabajos que los clientes solicitaron
      </Text>

      <View style={estilos.tarjeta}>
        <View style={estilos.encabezado}>
          <Text style={estilos.estado}>🟡 Nueva solicitud</Text>
        </View>

        <Text style={estilos.trabajo}>
          Instalación de aire acondicionado
        </Text>

        <Text style={estilos.dato}>
          👤 Cliente: Ángel
        </Text>

        <Text style={estilos.dato}>
          📍 José C. Paz
        </Text>

        <Text style={estilos.dato}>
          🚨 Urgencia: Media
        </Text>

        <TouchableOpacity
          style={estilos.boton}
          onPress={verSolicitud}
        >
          <Text style={estilos.textoBoton}>
            Ver solicitud
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 16,
    marginBottom: 20,
  },

  tarjeta: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
  },

  encabezado: {
    marginBottom: 10,
  },

  estado: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  trabajo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  dato: {
    fontSize: 16,
    marginTop: 6,
  },

  boton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
