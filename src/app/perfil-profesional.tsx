
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_URL } from '../config/api';

type Profesion = {
  nombre: string;
  tiene_matricula: boolean;
  matricula: string | null;
};

type Calificacion = {
  calidad: number;
  precio: number;
  trato: number;
  comentario: string | null;
  fecha_creacion: string;
};

type Perfil = {
  profesional_id: number;
  nombre: string;
  apellido: string;
  descripcion: string | null;
  estado_disponibilidad: boolean;
  profesiones: Profesion[];
  trabajos_completados: number;
  promedio_calificacion: string | null;
  cantidad_valoraciones: number;
  calificaciones: Calificacion[];
};

export default function PerfilProfesionalScreen() {
  const { profesionalId } = useLocalSearchParams<{
    profesionalId: string;
  }>();

  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarPerfil() {
      try {
        setCargando(true);
        setError('');

        const id = Array.isArray(profesionalId)
          ? profesionalId[0]
          : profesionalId;

        if (!id || !/^[1-9]\d*$/.test(id)) {
          setError('Identificador de profesional inválido.');
        } else {
          const respuesta = await fetch(
            `${API_URL}/profesionales/${id}`
          );

          const datos = await respuesta.json();

          if (!respuesta.ok) {
            setError(datos.error || 'No se pudo cargar el perfil.');
          } else {
            setPerfil(datos);
          }
        }
      } catch (e) {
        setError('No se pudo conectar con el servidor de Work24.');
      } finally {
        setCargando(false);
      }
    }

    cargarPerfil();
  }, [profesionalId]);

  if (cargando) {
    return (
      <View style={estilos.centrado}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={estilos.textoCargando}>
          Cargando perfil...
        </Text>
      </View>
    );
  }

  if (error || !perfil) {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.error}>{error}</Text>

        <Pressable
          style={estilos.boton}
          onPress={() => router.back()}
        >
          <Text style={estilos.textoBoton}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={estilos.contenedor}>
      <Pressable
        style={estilos.volver}
        onPress={() => router.back()}
      >
        <Text style={estilos.textoVolver}>← Volver</Text>
      </Pressable>

      <View style={estilos.encabezado}>
        <Text style={estilos.nombre}>
          {perfil.nombre} {perfil.apellido}
        </Text>

        <Text style={estilos.disponibilidad}>
          {perfil.estado_disponibilidad
            ? 'Disponible'
            : 'No disponible'}
        </Text>
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>Profesiones</Text>

        {perfil.profesiones.map((profesion, indice) => (
          <View key={`${profesion.nombre}-${indice}`}>
            <Text style={estilos.texto}>
              • {profesion.nombre}
            </Text>

            {profesion.tiene_matricula && (
              <Text style={estilos.matricula}>
                Matriculado · {profesion.matricula}
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>Descripción</Text>
        <Text style={estilos.texto}>
          {perfil.descripcion || 'Sin descripción disponible.'}
        </Text>
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>Experiencia en Work24</Text>

        <Text style={estilos.texto}>
          Trabajos finalizados: {perfil.trabajos_completados}
        </Text>

        <Text style={estilos.puntuacion}>
          {perfil.promedio_calificacion
            ? `${perfil.promedio_calificacion} / 5 estrellas`
            : 'Sin valoraciones'}
        </Text>

        <Text style={estilos.texto}>
          Cantidad de valoraciones: {perfil.cantidad_valoraciones}
        </Text>
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>Opiniones de clientes</Text>

        {perfil.calificaciones.length === 0 ? (
          <Text style={estilos.texto}>
            Todavía no tiene opiniones.
          </Text>
        ) : (
          perfil.calificaciones.map((calificacion, indice) => (
            <View
              key={`${calificacion.fecha_creacion}-${indice}`}
              style={estilos.opinion}
            >
              <Text style={estilos.texto}>
                Calidad: {calificacion.calidad}/5
              </Text>

              <Text style={estilos.texto}>
                Precio: {calificacion.precio}/5
              </Text>

              <Text style={estilos.texto}>
                Trato: {calificacion.trato}/5
              </Text>

              {calificacion.comentario ? (
                <Text style={estilos.comentario}>
                  "{calificacion.comentario}"
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F2F5F9',
    padding: 18
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F5F9'
  },
  textoCargando: {
    marginTop: 12,
    fontSize: 16
  },
  volver: {
    marginBottom: 20
  },
  textoVolver: {
    color: '#1565C0',
    fontSize: 17,
    fontWeight: 'bold'
  },
  encabezado: {
    backgroundColor: '#1565C0',
    padding: 22,
    borderRadius: 12,
    marginBottom: 15
  },
  nombre: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold'
  },
  disponibilidad: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 8
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15
  },
  titulo: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 12
  },
  texto: {
    fontSize: 16,
    color: '#222222',
    marginBottom: 7
  },
  matricula: {
    color: '#16713A',
    fontSize: 14,
    marginLeft: 16,
    marginBottom: 8
  },
  puntuacion: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#D97706',
    marginVertical: 8
  },
  opinion: {
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
    paddingTop: 12,
    marginTop: 8
  },
  comentario: {
    fontSize: 15,
    color: '#444444',
    fontStyle: 'italic',
    marginTop: 8
  },
  error: {
    color: '#C00000',
    fontSize: 17,
    marginBottom: 20
  },
  boton: {
    backgroundColor: '#1565C0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
