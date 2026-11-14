
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

export default function InicioCliente() {
  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.logo}>
        WORK24
      </Text>

      <Text style={estilos.titulo}>
        ¿Qué profesional necesitás?
      </Text>

      <TextInput
        style={estilos.busqueda}
        placeholder="Buscar profesional..."
      />

      <Text style={estilos.subtitulo}>
        Categorías
      </Text>

      <View style={estilos.categorias}>
        <TouchableOpacity style={estilos.categoria}>
          <Text style={estilos.icono}>🔧</Text>
          <Text style={estilos.textoCategoria}>
            Plomero
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.categoria}>
          <Text style={estilos.icono}>⚡</Text>
          <Text style={estilos.textoCategoria}>
            Electricista
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.categoria}>
          <Text style={estilos.icono}>🧱</Text>
          <Text style={estilos.textoCategoria}>
            Albañil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.categoria}>
          <Text style={estilos.icono}>🎨</Text>
          <Text style={estilos.textoCategoria}>
            Pintor
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.categoria}>
          <Text style={estilos.icono}>❄️</Text>
          <Text style={estilos.textoCategoria}>
            Refrigeración
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.categoria}>
          <Text style={estilos.icono}>🔨</Text>
          <Text style={estilos.textoCategoria}>
            Carpintero
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={estilos.subtitulo}>
        Profesionales cercanos
      </Text>

      <View style={estilos.profesional}>
        <Text style={estilos.nombre}>
          Juan Pérez
        </Text>

        <Text style={estilos.profesion}>
          Electricista
        </Text>

        <Text style={estilos.datos}>
          ⭐ 4.8
        </Text>

        <Text style={estilos.datos}>
          📍 1.2 km
        </Text>

        <Text style={estilos.disponible}>
          🟢 Disponible
        </Text>

        <TouchableOpacity
          style={estilos.boton}
          onPress={() => router.push('/perfil-profesional')}
        >
          <Text style={estilos.textoBoton}>
            Ver perfil
          </Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.profesional}>
        <Text style={estilos.nombre}>
          Carlos Gómez
        </Text>

        <Text style={estilos.profesion}>
          Plomero
        </Text>

        <Text style={estilos.datos}>
          ⭐ 4.6
        </Text>

        <Text style={estilos.datos}>
          📍 2.5 km
        </Text>

        <Text style={estilos.disponible}>
          🟢 Disponible
        </Text>

        <TouchableOpacity
          style={estilos.boton}
          onPress={() => router.push('/perfil-profesional')}
        >
          <Text style={estilos.textoBoton}>
            Ver perfil
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={estilos.botonTrabajo}
        onPress={() => router.push('/nuevo-trabajo')}
      >
        <Text style={estilos.textoTrabajo}>
          + Nuevo trabajo
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={estilos.botonMisTrabajos}
        onPress={() => router.push('/mis-trabajos')}
      >
        <Text style={estilos.textoMisTrabajos}>
          Mi perfil
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
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  busqueda: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 25,
  },

  subtitulo: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  categorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  categoria: {
    width: '31%',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  icono: {
    fontSize: 28,
    marginBottom: 5,
  },

  textoCategoria: {
    fontSize: 13,
    textAlign: 'center',
  },

  profesional: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },

  nombre: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  profesion: {
    fontSize: 17,
    marginBottom: 10,
  },

  datos: {
    fontSize: 16,
    marginBottom: 5,
  },

  disponible: {
    fontSize: 16,
    marginBottom: 12,
  },

  boton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  botonTrabajo: {
    backgroundColor: '#000000',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },

  textoTrabajo: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  botonMisTrabajos: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0756D8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 25,
  },

  textoMisTrabajos: {
    color: '#0756D8',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
