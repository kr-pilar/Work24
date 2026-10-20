import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function PagoSolicitud() {
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

  function realizarPago() {
    Alert.alert(
      'Pago de prueba',
      'El pago fue realizado correctamente.',
      [
        {
          text: 'Continuar',
          onPress: () =>
            router.push({
              pathname: '/solicitud-enviada',
              params: {
                profesional: profesional,
                titulo: titulo,
                descripcion: descripcion,
                ubicacion: ubicacion,
                urgencia: urgencia,
              },
            }),
        },
      ]
    );
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Pago de solicitud</Text>

      <Text style={estilos.subtitulo}>
        Revisá la información antes de realizar el pago.
      </Text>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>Profesional</Text>
        <Text style={estilos.nombre}>{profesional}</Text>

        <Text style={estilos.dato}>🔧 Profesional seleccionado</Text>
        <Text style={estilos.dato}>📍 {ubicacion}</Text>
        <Text style={estilos.dato}>🚨 Urgencia: {urgencia}</Text>
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>Trabajo</Text>
        <Text style={estilos.trabajo}>{titulo}</Text>
        <Text style={estilos.descripcion}>{descripcion}</Text>
      </View>

      <View style={estilos.pago}>
        <Text style={estilos.pagoTitulo}>Importe</Text>
        <Text style={estilos.precio}>$5.000</Text>
        <Text style={estilos.pagoTexto}>
          Este importe es solamente de prueba para el frontend.
        </Text>
      </View>

      <TouchableOpacity
        style={estilos.boton}
        onPress={realizarPago}
      >
        <Text style={estilos.textoBoton}>
          Pagar y enviar solicitud
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

  pago: {
    backgroundColor: '#e8f4ff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
  },

  pagoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  precio: {
    fontSize: 30,
    fontWeight: 'bold',
    marginVertical: 5,
  },

  pagoTexto: {
    fontSize: 14,
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
