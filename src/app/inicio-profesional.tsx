
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { API_URL } from '../config/api';
import { obtenerToken } from '../storageSesion';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function InicioProfesional() {
  const [autorizaContactoWhatsapp, setAutorizaContactoWhatsapp] =
    useState<boolean | null>(null);
  const [actualizandoAutorizacion, setActualizandoAutorizacion] =
    useState(false);

  const [estadoDisponibilidad, setEstadoDisponibilidad] =
    useState<boolean | null>(null);
  const [actualizandoDisponibilidad, setActualizandoDisponibilidad] =
    useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarPerfil() {
      try {
        const token = await obtenerToken();

        if (!token) {
          throw new Error('No se encontró la sesión');
        }

        const respuesta = await fetch(`${API_URL}/auth/perfil`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.error || 'No se pudo obtener el perfil');
        }

        if (activo) {
          setAutorizaContactoWhatsapp(
            datos.usuario?.autoriza_contacto_whatsapp === true
          );

          setEstadoDisponibilidad(
            datos.usuario?.estado_disponibilidad === true
          );
        }
      } catch (error) {
        if (activo) {
          Alert.alert(
            'No se pudo consultar el perfil',
            'Verificá tu conexión e intentá actualizar la pantalla.'
          );
        }
      }
    }

    cargarPerfil();

    return () => {
      activo = false;
    };
  }, []);

  async function cambiarDisponibilidad() {
    if (
      estadoDisponibilidad === null ||
      actualizandoDisponibilidad
    ) {
      return;
    }

    setActualizandoDisponibilidad(true);

    try {
      const token = await obtenerToken();

      if (!token) {
        throw new Error('No se encontró la sesión');
      }

      let nuevaLatitud: number | null = null;
      let nuevaLongitud: number | null = null;

      if (!estadoDisponibilidad) {
        const permiso =
          await Location.requestForegroundPermissionsAsync();

        if (!permiso.granted) {
          Alert.alert(
            'Ubicación necesaria',
            'Para aparecer como disponible y recibir consultas cercanas, necesitás permitir el acceso a tu ubicación mientras usás Work24.'
          );
          return;
        }

        const posicion = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        nuevaLatitud = posicion.coords.latitude;
        nuevaLongitud = posicion.coords.longitude;
      }

      const respuesta = await fetch(
        `${API_URL}/profesionales/disponibilidad`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            estadoDisponibilidad: !estadoDisponibilidad,
            latitud: nuevaLatitud,
            longitud: nuevaLongitud,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || 'No se pudo modificar la disponibilidad'
        );
      }

      setEstadoDisponibilidad(
        datos.estado_disponibilidad === true
      );

      Alert.alert(
        'Disponibilidad actualizada',
        datos.mensaje ||
          'Se actualizó tu estado de disponibilidad correctamente.'
      );
    } catch (error) {
      Alert.alert(
        'No se pudo actualizar',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al actualizar tu disponibilidad.'
      );
    } finally {
      setActualizandoDisponibilidad(false);
    }
  }

  function cambiarAutorizacion() {
    if (
      autorizaContactoWhatsapp === null ||
      actualizandoAutorizacion
    ) {
      return;
    }

    const nuevoEstado = !autorizaContactoWhatsapp;

    Alert.alert(
      nuevoEstado ? 'Activar contacto por WhatsApp' : 'Revocar autorización',
      nuevoEstado
        ? '¿Autorizás a Work24 a compartir tu teléfono con los clientes que habiliten el contacto?'
        : 'Al revocar esta autorización, los nuevos clientes no podrán recibir tu teléfono para contactarte por WhatsApp.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: nuevoEstado ? 'Autorizar' : 'Revocar',
          style: nuevoEstado ? 'default' : 'destructive',
          onPress: async () => {
            setActualizandoAutorizacion(true);

            try {
              const token = await obtenerToken();

              if (!token) {
                throw new Error('No se encontró la sesión');
              }

              const respuesta = await fetch(
                `${API_URL}/auth/contacto-whatsapp`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    autorizaContactoWhatsapp: nuevoEstado,
                  }),
                }
              );

              const datos = await respuesta.json();

              if (!respuesta.ok) {
                throw new Error(
                  datos.error || 'No se pudo modificar la autorización'
                );
              }

              setAutorizaContactoWhatsapp(
                datos.autoriza_contacto_whatsapp === true
              );

              Alert.alert(
                'Autorización actualizada',
                nuevoEstado
                  ? 'Los clientes podrán contactarte por WhatsApp cuando Work24 valide el contacto.'
                  : 'Tu teléfono ya no se compartirá en nuevos contactos.'
              );
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'No se pudo modificar la autorización.'
              );
            } finally {
              setActualizandoAutorizacion(false);
            }
          },
        },
      ]
    );
  }

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

        <Text
          style={[
            estilos.disponible,
            estadoDisponibilidad === true
              ? estilos.estadoActivo
              : estilos.estadoInactivo,
          ]}
        >
          {estadoDisponibilidad === null
            ? 'Consultando estado...'
            : estadoDisponibilidad
              ? '🟢 Disponible'
              : '🔴 No disponible'}
        </Text>

        <Text style={estilos.aclaracionEstado}>
          Al estar disponible, los clientes podrán encontrarte
          según tu ubicación y la urgencia del trabajo.
          La ubicación se obtiene mientras usás la aplicación.
        </Text>

        <TouchableOpacity
          style={estilos.botonEstado}
          onPress={cambiarDisponibilidad}
          disabled={
            estadoDisponibilidad === null ||
            actualizandoDisponibilidad
          }
        >
          <Text style={estilos.textoBoton}>
            {actualizandoDisponibilidad
              ? 'Actualizando...'
              : estadoDisponibilidad
                ? 'Dejar de estar disponible'
                : 'Activar disponibilidad'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.autorizacion}>
        <Text style={estilos.estadoTitulo}>
          Contacto por WhatsApp
        </Text>

        <Text style={estilos.textoAutorizacion}>
          {autorizaContactoWhatsapp === null
            ? 'Consultando autorización...'
            : autorizaContactoWhatsapp
              ? '🟢 Autorización activa'
              : '🔴 Autorización desactivada'}
        </Text>

        <Text style={estilos.aclaracionAutorizacion}>
          Tu número no es público. Work24 solo lo comparte con clientes
          cuando valida el contacto. Podés activar o revocar esta
          autorización cuando quieras.
        </Text>

        <TouchableOpacity
          style={estilos.botonAutorizacion}
          onPress={cambiarAutorizacion}
          disabled={
            autorizaContactoWhatsapp === null ||
            actualizandoAutorizacion
          }
        >
          <Text style={estilos.textoBoton}>
            {actualizandoAutorizacion
              ? 'Actualizando...'
              : autorizaContactoWhatsapp
                ? 'Revocar autorización'
                : 'Autorizar contacto'}
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
    fontWeight: 'bold',
    marginBottom: 12,
  },

  estadoActivo: {
    color: '#008000',
  },

  estadoInactivo: {
    color: '#cc0000',
  },

  aclaracionEstado: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
    color: '#333333',
  },

  autorizacion: {
    borderWidth: 1,
    borderColor: '#0055cc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
    backgroundColor: '#eef5ff',
  },

  textoAutorizacion: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#003399',
  },

  aclaracionAutorizacion: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
    color: '#333333',
  },

  botonAutorizacion: {
    backgroundColor: '#003399',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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
