import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function InicioProfesional() {
  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.logo}>
        WORK24
      </Text>

      <Text style={estilos.titulo}>
        Mi espacio
      </Text>

      <View style={estilos.perfil}>
        <Text style={estilos.nombre}>
          Profesional
        </Text>

        <Text style={estilos.dato}>
          ⭐ 4.8
        </Text>

        <Text style={estilos.dato}>
          🔧 Electricista
        </Text>
      </View>

      <View style={estilos.estado}>
        <Text style={estilos.estadoTitulo}>
          Estado
        </Text>

        <Text style={estilos.disponible}>
          🟢 Disponible
        </Text>

        <TouchableOpacity style={estilos.botonEstado}>
          <Text style={estilos.textoBoton}>
            Cambiar estado
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={estilos.subtitulo}>
        Trabajos recibidos
      </Text>

      <View style={estilos.trabajo}>
        <Text style={estilos.nombreTrabajo}>
          Reparación eléctrica
        </Text>

        <Text style={estilos.dato}>
          📍 2.1 km
        </Text>

        <Text style={estilos.dato}>
          🕐 Hace 10 minutos
        </Text>

        <TouchableOpacity style={estilos.boton}>
          <Text style={estilos.textoBoton}>
            Ver trabajo
          </Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.trabajo}>
        <Text style={estilos.nombreTrabajo}>
          Instalación de luces
        </Text>

        <Text style={estilos.dato}>
          📍 3.4 km
        </Text>

        <Text style={estilos.dato}>
          🕐 Hace 25 minutos
        </Text>

        <TouchableOpacity style={estilos.boton}>
          <Text style={estilos.textoBoton}>
            Ver trabajo
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={estilos.boton}
        onPress={() => router.push('/solicitudes-recibidas')}
      >
        <Text style={estilos.textoBoton}>
          Solicitudes recibidas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={estilos.botonPerfil}>
        <Text style={estilos.textoBoton}>
          Ver mi perfil
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    padding: 20,
    backgroundColor: '#ffffff',
  },

  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },

  titulo: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  perfil: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },

  nombre: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  dato: {
    fontSize: 16,
    marginBottom: 5,
  },

  estado: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
  },

  estadoTitulo: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  disponible: {
    fontSize: 17,
    marginBottom: 12,
  },

  subtitulo: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  trabajo: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },

  nombreTrabajo: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  boton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },

  botonEstado: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  botonPerfil: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 20,
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
