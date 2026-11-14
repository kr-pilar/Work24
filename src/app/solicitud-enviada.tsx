
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function SolicitudEnviada() {
  const {
    profesional,
    titulo,
    descripcion,
    ubicacion,
    urgencia,
    tipoContacto,
    telefonoWhatsapp,
  } = useLocalSearchParams<{
    profesional: string;
    titulo: string;
    descripcion: string;
    ubicacion: string;
    urgencia: string;
    tipoContacto: string;
    telefonoWhatsapp?: string;
  }>();

  let mensajeBeneficio = 'Tu contacto fue registrado gratuitamente.';

  if (tipoContacto === 'primer_trabajo_gratis') {
    mensajeBeneficio =
      '¡Usaste uno de los 3 contactos gratuitos de tu primer trabajo!';
  } else if (tipoContacto === 'profesional_nuevo_gratis') {
    mensajeBeneficio =
      '¡Este contacto fue gratuito porque el profesional es nuevo en Work24!';
  }

  const telefonoValido = /^549\d{10}$/.test(
    telefonoWhatsapp || ''
  );

  async function abrirWhatsApp() {
    if (!telefonoValido) {
      Alert.alert(
        'Contacto no disponible',
        'Work24 no recibió un teléfono válido para este contacto.'
      );
    } else {
      const mensaje =
        `Hola, te contacto desde Work24 por el trabajo "${titulo}".`;

      const texto = encodeURIComponent(mensaje);

      const enlaceDirecto =
        `whatsapp://send?phone=${telefonoWhatsapp}&text=${texto}`;

      const enlaceAlternativo =
        `https://api.whatsapp.com/send?phone=${telefonoWhatsapp}&text=${texto}`;

      try {
        await Linking.openURL(enlaceDirecto);
      } catch (error) {
        try {
          await Linking.openURL(enlaceAlternativo);
        } catch (errorAlternativo) {
          Alert.alert(
            'No se pudo abrir WhatsApp',
            'Verificá que WhatsApp esté instalado y actualizado en tu teléfono.'
          );
        }
      }
    }
  }
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
        Tu solicitud fue registrada correctamente.
      </Text>

      <View style={estilos.beneficio}>
        <Text style={estilos.beneficioTitulo}>
          Contacto gratuito
        </Text>

        <Text style={estilos.beneficioTexto}>
          {mensajeBeneficio}
        </Text>
      </View>

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
          Estado del contacto
        </Text>

        <Text style={estilos.estadoTexto}>
          Contacto habilitado. Coordiná directamente con el profesional
          por WhatsApp.
        </Text>
      </View>

      {telefonoValido && (
        <TouchableOpacity
          style={estilos.botonWhatsapp}
          onPress={abrirWhatsApp}
        >
          <Text style={estilos.textoBoton}>
            Contactar por WhatsApp
          </Text>
        </TouchableOpacity>
      )}

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
    marginBottom: 20,
  },

  beneficio: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
  },

  beneficioTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  beneficioTexto: {
    fontSize: 15,
    lineHeight: 21,
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

  botonWhatsapp: {
    backgroundColor: '#128c45',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
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
