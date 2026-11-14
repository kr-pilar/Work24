
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { API_URL } from '../config/api';
import { obtenerToken } from '../storageSesion';

export default function ConfirmarSolicitud() {
  const {
    trabajoId,
    profesionalId,
    profesional,
    titulo,
    descripcion,
    ubicacion,
    urgencia,
  } = useLocalSearchParams<{
    trabajoId: string;
    profesionalId: string;
    profesional: string;
    titulo: string;
    descripcion: string;
    ubicacion: string;
    urgencia: string;
  }>();

  const [cargando, setCargando] = useState(false);

  async function confirmarSolicitud() {
    if (!trabajoId || !profesionalId) {
      Alert.alert(
        'Datos incompletos',
        'No se encontró el trabajo o el profesional seleccionado.'
      );
    } else if (!cargando) {
      setCargando(true);

      try {
        const token = await obtenerToken();

        if (!token) {
          Alert.alert(
            'Sesión no encontrada',
            'Iniciá sesión nuevamente para continuar.'
          );
        } else {
          const respuesta = await fetch(`${API_URL}/solicitudes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              trabajoId: Number(trabajoId),
              profesionalId: Number(profesionalId),
            }),
          });

          const datos = await respuesta.json();

          if (respuesta.ok && datos.solicitud?.id) {
            const parametros = {
              solicitudId: String(datos.solicitud.id),
              trabajoId,
              profesionalId,
              profesional: profesional || '',
              titulo: titulo || '',
              descripcion: descripcion || '',
              ubicacion: ubicacion || '',
              urgencia: urgencia || '',
              tipoContacto: datos.tipoContacto || '',
              telefonoWhatsapp: datos.telefonoWhatsapp || '',
            };

            if (
              datos.contactoGratis === true &&
              datos.requierePago === false
            ) {
              router.replace({
                pathname: '/solicitud-enviada',
                params: parametros,
              });
            } else {
              router.push({
                pathname: '/pago-solicitud',
                params: parametros,
              });
            }
          } else {
            Alert.alert(
              'No se pudo crear la solicitud',
              datos.error || 'Ocurrió un error al confirmar.'
            );
          }
        }
      } catch (error) {
        Alert.alert(
          'Error de conexión',
          'No se pudo conectar con el servidor de Work24.'
        );
      } finally {
        setCargando(false);
      }
    }
  }

  return (
    <ScrollView
      contentContainerStyle={estilos.contenedor}
      keyboardShouldPersistTaps="handled"
    >
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
          Identificador: {profesionalId}
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
          Ubicación: {ubicacion}
        </Text>

        <Text style={estilos.dato}>
          Urgencia: {urgencia}
        </Text>

        <Text style={estilos.descripcion}>
          {descripcion}
        </Text>

        <Text style={estilos.dato}>
          Número de trabajo: {trabajoId}
        </Text>
      </View>

      <View style={estilos.pago}>
        <Text style={estilos.pagoTitulo}>
          Beneficios de lanzamiento
        </Text>

        <Text style={estilos.pagoTexto}>
          Tu primer trabajo permite contactar hasta 3 profesionales
          sin costo. También podés acceder a un contacto gratuito
          cuando se trate de un profesional nuevo que cumpla las
          condiciones de Work24.
        </Text>

        <Text style={estilos.pagoAclaracion}>
          El servidor verificará si tu solicitud tiene un beneficio
          gratuito antes de continuar.
        </Text>
      </View>

      <TouchableOpacity
        style={estilos.boton}
        onPress={confirmarSolicitud}
        disabled={cargando}
      >
        <Text style={estilos.textoBoton}>
          {cargando ? 'Confirmando...' : 'Confirmar solicitud'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    paddingBottom: 40,
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

  pagoAclaracion: {
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
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
