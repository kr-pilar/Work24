import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function ConfirmarSolicitud() {
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
  function confirmarSolicitud() {
    router.push({
      pathname: '/pago-solicitud',
      params: {
        profesional: profesional,
        titulo: titulo,
        descripcion: descripcion,
        ubicacion: ubicacion,
        urgencia: urgencia,
      },
    });
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>
        Confirmar solicitud
      </Text>

      <Text style={estilos.subtitulo}>
        Revisá los datos antes de continuar
      </Text>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>
          Profesional seleccionado
        </Text>

        <Text style={estilos.nombre}>
          {profesional}
        </Text>

        <Text style={estilos.dato}>
          🔧 Electricista
        </Text>

        <Text style={estilos.dato}>
          ⭐ 4.8 / 5
        </Text>

        <Text style={estilos.dato}>
          📍 1.2 km
        </Text>

        <Text style={estilos.estado}>
          🟢 Disponible
        </Text>
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>
          Trabajo solicitado
        </Text>

        <Text style={estilos.dato}>
          {titulo}
        </Text>

        <Text style={estilos.dato}>
          📍 {ubicacion}
        </Text>

        <Text style={estilos.dato}>
          🚨 Urgencia: {urgencia}
        </Text>

        <Text style={estilos.descripcion}>
          {descripcion}
        </Text>
      </View>

      <View style={estilos.pago}>
        <Text style={estilos.pagoTitulo}>
          Pago
        </Text>

        <Text style={estilos.pagoTexto}>
          Para contactar al profesional deberás realizar el pago correspondiente.
        </Text>
      </View>

      <TouchableOpacity
        style={estilos.boton}
        onPress={confirmarSolicitud}
      >
        <Text style={estilos.textoBoton}>
          Confirmar y continuar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },

  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },

  tarjeta: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
  },

  etiqueta: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  nombre: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  dato: {
    fontSize: 16,
    marginBottom: 6,
  },

  estado: {
    fontSize: 16,
    marginTop: 5,
  },

  descripcion: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },

  pago: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },

  pagoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  pagoTexto: {
    fontSize: 15,
    lineHeight: 22,
  },

  boton: {
    backgroundColor: '#000000',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
