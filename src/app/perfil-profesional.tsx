import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PerfilProfesional() {
  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.titulo}>
        Perfil profesional
      </Text>

      <View style={estilos.perfil}>
        <Text style={estilos.nombre}>
          Juan Pérez
        </Text>

        <Text style={estilos.profesion}>
          Electricista
        </Text>

        <Text style={estilos.dato}>
          ⭐ 4.8 / 5
        </Text>

        <Text style={estilos.dato}>
          🟢 Disponible
        </Text>

        <Text style={estilos.dato}>
          📍 1.2 km
        </Text>

        <Text style={estilos.matricula}>
          ✓ Matriculado
        </Text>
      </View>

      <Text style={estilos.subtitulo}>
        Descripción
      </Text>

      <View style={estilos.seccion}>
        <Text style={estilos.descripcion}>
          Electricista especializado en instalaciones
          domiciliarias, reparación de instalaciones
          eléctricas y colocación de luces.
        </Text>
      </View>

      <Text style={estilos.subtitulo}>
        Valoraciones
      </Text>

      <View style={estilos.seccion}>
        <Text style={estilos.valoracion}>
          Calidad del trabajo
        </Text>

        <Text style={estilos.estrellas}>
          ⭐ 4.9 / 5
        </Text>

        <Text style={estilos.valoracion}>
          Precio
        </Text>

        <Text style={estilos.estrellas}>
          ⭐ 4.7 / 5
        </Text>

        <Text style={estilos.valoracion}>
          Trato profesional
        </Text>

        <Text style={estilos.estrellas}>
          ⭐ 4.8 / 5
        </Text>
      </View>

      <Text style={estilos.subtitulo}>
        Trabajos realizados
      </Text>

      <View style={estilos.seccion}>
        <Text style={estilos.descripcion}>
          Próximamente se mostrarán fotos de trabajos
          realizados por este profesional.
        </Text>
      </View>

      <TouchableOpacity style={estilos.boton}>
        <Text style={estilos.textoBoton}>
          Contactar profesional
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

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 25,
  },

  perfil: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 12,
    padding: 18,
    marginBottom: 25,
  },

  nombre: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  profesion: {
    fontSize: 19,
    marginBottom: 12,
  },

  dato: {
    fontSize: 16,
    marginBottom: 7,
  },

  matricula: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },

  subtitulo: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  seccion: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
  },

  descripcion: {
    fontSize: 16,
    lineHeight: 24,
  },

  valoracion: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  estrellas: {
    fontSize: 16,
    marginBottom: 15,
  },

  boton: {
    backgroundColor: '#000000',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
