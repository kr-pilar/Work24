
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL } from '../config/api';
import { obtenerToken } from '../storageSesion';

type Profesional = {
  profesional_id: number;
  nombre: string;
  apellido: string;
  descripcion: string | null;
  estado_disponibilidad: boolean;
  tiene_matricula: boolean | null;
  trabajos_completados: number;
  promedio_calificacion: string | number | null;
  cantidad_valoraciones: number;
  distancia_km: string | number | null;
  profesiones: string[];
};

type ProfesionalAPI = Omit<Profesional, 'profesiones'> & {
  profesiones?: string[];
  profesion?: string | null;
};

export default function ProfesionalesDisponibles() {
  const {
    trabajoId,
    titulo,
    descripcion,
    ubicacion,
    urgencia,
  } = useLocalSearchParams<{
    trabajoId: string;
    titulo: string;
    descripcion: string;
    ubicacion: string;
    urgencia: string;
  }>();

  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [nuevos, setNuevos] = useState<Profesional[]>([]);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  function agruparProfesionales(datos: ProfesionalAPI[]) {
    const agrupados = new Map<number, Profesional>();

    datos.forEach((item) => {
      let profesional = agrupados.get(item.profesional_id);

      if (!profesional) {
        profesional = {
          ...item,
          profesiones: [],
        };

        agrupados.set(item.profesional_id, profesional);
      }

      const oficios = Array.isArray(item.profesiones)
        ? item.profesiones
        : item.profesion
          ? [item.profesion]
          : [];

      oficios.forEach((oficio) => {
        if (
          oficio &&
          !profesional.profesiones.includes(oficio)
        ) {
          profesional.profesiones.push(oficio);
        }
      });

      if (item.tiene_matricula === true) {
        profesional.tiene_matricula = true;
      }
    });

    return Array.from(agrupados.values());
  }

  async function cargarProfesionales() {
    setCargando(true);
    setError('');

    try {
      if (!trabajoId) {
        throw new Error('No se identificó el trabajo publicado.');
      }

      const token = await obtenerToken();

      if (!token) {
        throw new Error('Tu sesión no está disponible. Iniciá sesión nuevamente.');
      }

      const respuesta = await fetch(
        `${API_URL}/profesionales?trabajoId=${encodeURIComponent(trabajoId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || 'No se pudieron obtener los profesionales.'
        );
      }

      setProfesionales(
        agruparProfesionales(datos.profesionales || [])
      );

      setNuevos(
        agruparProfesionales(datos.nuevos || [])
      );

      setSeleccionado(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los profesionales. Verificá la conexión con Work24.'
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarProfesionales();
  }, [trabajoId]);

  function seleccionarProfesional(id: number) {
    setSeleccionado(id);
  }

  function continuar() {
    if (!trabajoId) {
      Alert.alert(
        'Trabajo no identificado',
        'No se encontró el identificador del trabajo.'
      );
      return;
    }

    if (seleccionado === null) {
      Alert.alert(
        'Seleccioná un profesional',
        'Elegí un profesional para continuar.'
      );
      return;
    }

    const profesional = [...profesionales, ...nuevos].find(
      (item) => item.profesional_id === seleccionado
    );

    if (profesional) {
      router.push({
        pathname: '/confirmar-solicitud',
        params: {
          trabajoId,
          profesionalId: String(profesional.profesional_id),
          profesional: `${profesional.nombre} ${profesional.apellido}`,
          titulo: titulo || '',
          descripcion: descripcion || '',
          ubicacion: ubicacion || '',
          urgencia: urgencia || '',
        },
      });
    }
  }

  function renderProfesional(
    profesional: Profesional,
    esNuevo: boolean
  ) {
    const distancia = profesional.distancia_km;

    return (
      <View
        key={profesional.profesional_id}
        style={estilos.profesional}
      >
        {esNuevo && (
          <Text style={estilos.etiquetaNuevo}>
            NUEVO EN WORK24
          </Text>
        )}

        <Text style={estilos.nombre}>
          {profesional.nombre} {profesional.apellido}
        </Text>

        <Text style={estilos.profesion}>
          {profesional.profesiones.length > 0
            ? profesional.profesiones.join(' · ')
            : 'Sin oficio registrado'}
        </Text>

        <Text
          style={
            profesional.estado_disponibilidad
              ? estilos.disponible
              : estilos.noDisponible
          }
        >
          {profesional.estado_disponibilidad
            ? '🟢 Disponible'
            : '🔴 No disponible'}
        </Text>

        <View style={estilos.filaDato}>
          <Text style={estilos.etiqueta}>
            Distancia
          </Text>

          <Text style={estilos.valor}>
            {distancia !== null && distancia !== undefined
              ? `${Number(distancia).toFixed(1)} km`
              : 'No disponible'}
          </Text>
        </View>

        <View style={estilos.filaDato}>
          <Text style={estilos.etiqueta}>
            Trabajos completados
          </Text>

          <Text style={estilos.valor}>
            {profesional.trabajos_completados}
          </Text>
        </View>

        <View style={estilos.filaDato}>
          <Text style={estilos.etiqueta}>
            Valoración promedio
          </Text>

          <Text style={estilos.valor}>
            {profesional.promedio_calificacion !== null
              ? `${Number(profesional.promedio_calificacion).toFixed(1)} / 5 ★`
              : 'Sin valoraciones'}
          </Text>
        </View>

        {profesional.tiene_matricula && (
          <Text style={estilos.matriculado}>
            ✓ Profesional con matrícula registrada
          </Text>
        )}

        <TouchableOpacity
          style={estilos.botonPerfil}
          onPress={() =>
            router.push({
              pathname: '/perfil-profesional',
              params: {
                profesionalId: String(profesional.profesional_id),
              },
            })
          }
        >
          <Text style={estilos.textoBotonPerfil}>
            Ver perfil completo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            seleccionado === profesional.profesional_id
              ? estilos.botonSeleccionado
              : estilos.boton
          }
          onPress={() =>
            seleccionarProfesional(profesional.profesional_id)
          }
        >
          <Text
            style={
              seleccionado === profesional.profesional_id
                ? estilos.textoBotonSeleccionado
                : estilos.textoBoton
            }
          >
            {seleccionado === profesional.profesional_id
              ? 'Seleccionado'
              : 'Seleccionar'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalProfesionales = profesionales.length + nuevos.length;

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.titulo}>
        Profesionales disponibles
      </Text>

      <Text style={estilos.subtitulo}>
        Conocé los profesionales y elegí a quién consultar.
        Los resultados se ordenan por cercanía cuando hay GPS disponible.
      </Text>

      {cargando && (
        <Text style={estilos.mensaje}>
          Buscando profesionales cercanos...
        </Text>
      )}

      {!cargando && error !== '' && (
        <View style={estilos.mensajeError}>
          <Text style={estilos.textoError}>
            {error}
          </Text>

          <TouchableOpacity
            style={estilos.boton}
            onPress={cargarProfesionales}
          >
            <Text style={estilos.textoBoton}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!cargando && error === '' && totalProfesionales === 0 && (
        <Text style={estilos.mensaje}>
          No encontramos profesionales para esta búsqueda.
          Podés intentarlo nuevamente más tarde.
        </Text>
      )}

      {!cargando && error === '' && profesionales.length > 0 && (
        <>
          <Text style={estilos.seccion}>
            Profesionales con experiencia
          </Text>

          {profesionales.map((profesional) =>
            renderProfesional(profesional, false)
          )}
        </>
      )}

      {!cargando && error === '' && nuevos.length > 0 && (
        <>
          <Text style={estilos.seccion}>
            Profesionales nuevos
          </Text>

          <Text style={estilos.descripcionSeccion}>
            Todavía no tienen trabajos completados ni valoraciones
            registradas en Work24.
          </Text>

          {nuevos.map((profesional) =>
            renderProfesional(profesional, true)
          )}
        </>
      )}

      <TouchableOpacity
        style={estilos.botonContinuar}
        onPress={continuar}
        disabled={
          cargando ||
          error !== '' ||
          totalProfesionales === 0 ||
          seleccionado === null
        }
      >
        <Text style={estilos.textoBoton}>
          Continuar
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
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: '#111111',
  },

  subtitulo: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 25,
    color: '#333333',
    lineHeight: 23,
  },

  seccion: {
    fontSize: 21,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 15,
    color: '#111111',
  },

  descripcionSeccion: {
    fontSize: 14,
    color: '#444444',
    marginBottom: 15,
    lineHeight: 20,
  },

  mensaje: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#333333',
    lineHeight: 23,
  },

  mensajeError: {
    marginVertical: 20,
  },

  textoError: {
    color: '#cc0000',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },

  profesional: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },

  etiquetaNuevo: {
    color: '#174ea6',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  nombre: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 7,
    color: '#111111',
  },

  profesion: {
    fontSize: 17,
    marginBottom: 12,
    color: '#174ea6',
    fontWeight: '600',
  },

  disponible: {
    color: '#008000',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 12,
  },

  noDisponible: {
    color: '#cc0000',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 12,
  },

  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  etiqueta: {
    fontSize: 15,
    color: '#333333',
  },

  valor: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111111',
  },

  matriculado: {
    fontSize: 14,
    color: '#006600',
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 8,
  },

  botonPerfil: {
    backgroundColor: '#e8f0fe',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },

  textoBotonPerfil: {
    color: '#174ea6',
    fontSize: 16,
    fontWeight: 'bold',
  },

  boton: {
    backgroundColor: '#000000',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
  },

  botonSeleccionado: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 11,
    borderRadius: 8,
    alignItems: 'center',
  },

  textoBoton: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  textoBotonSeleccionado: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },

  botonContinuar: {
    backgroundColor: '#000000',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
});
