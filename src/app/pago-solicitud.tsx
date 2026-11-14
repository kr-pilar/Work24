import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { API_URL } from '../config/api';
import { obtenerToken } from '../storageSesion';

export default function PagoSolicitud() {
  const {
    solicitudId,
    profesional,
    titulo,
    descripcion,
    ubicacion,
    urgencia,
  } = useLocalSearchParams<{
    solicitudId: string;
    profesional: string;
    titulo: string;
    descripcion: string;
    ubicacion: string;
    urgencia: string;
  }>();

  const [pagoId, setPagoId] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [estado, setEstado] = useState('sin_pago');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  async function crearPago() {
    if (!solicitudId) {
      setError('No se recibió el identificador de la solicitud.');
      return;
    }

    setProcesando(true);
    setError('');

    try {
      const token = await obtenerToken();

      if (!token) {
        setError('Tu sesión venció. Volvé a iniciar sesión.');
        setProcesando(false);
        return;
      }

      const respuesta = await fetch(`${API_URL}/pagos/crear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          solicitudId: Number(solicitudId),
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo crear el pago.');
      }

      setPagoId(String(datos.pagoId));
      setCheckoutUrl(datos.checkoutUrl);
      setEstado('pendiente');

      await Linking.openURL(datos.checkoutUrl);
    } catch (e: any) {
      setError(e.message || 'No se pudo conectar con el servidor.');
    } finally {
      setProcesando(false);
    }
  }

  async function consultarPago() {
    if (!pagoId) {
      setError('Primero tenés que generar la orden de pago.');
      return;
    }

    setProcesando(true);
    setError('');

    try {
      const token = await obtenerToken();

      if (!token) {
        setError('Tu sesión venció. Volvé a iniciar sesión.');
        setProcesando(false);
        return;
      }

      const respuesta = await fetch(
        `${API_URL}/pagos/${pagoId}/estado`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo consultar el pago.');
      }

      setEstado(datos.estado);

      if (datos.estado === 'aprobado') {
        router.replace({
          pathname: '/solicitud-enviada',
          params: {
            profesional,
            titulo,
            descripcion,
            ubicacion,
            urgencia,
            solicitudId,
          },
        });
      } else {
        setError('Todavía no se confirmó el pago. Podés volver a consultar.');
      }
    } catch (e: any) {
      setError(e.message || 'No se pudo consultar el estado del pago.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.titulo}>Pago de solicitud</Text>

      <Text style={estilos.subtitulo}>
        Revisá los datos antes de continuar con Mercado Pago.
      </Text>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>Profesional seleccionado</Text>
        <Text style={estilos.nombre}>{profesional || 'Profesional'}</Text>

        <Text style={estilos.dato}>Ubicación: {ubicacion}</Text>
        <Text style={estilos.dato}>Urgencia: {urgencia}</Text>
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>Trabajo solicitado</Text>
        <Text style={estilos.nombre}>{titulo}</Text>
        <Text style={estilos.descripcion}>{descripcion}</Text>
      </View>

      <View style={estilos.pago}>
        <Text style={estilos.etiqueta}>Importe de prueba</Text>
        <Text style={estilos.precio}>$5.000</Text>
        <Text style={estilos.nota}>
          Importe temporal para las pruebas de Work24.
        </Text>
      </View>

      {estado === 'aprobado' && (
        <Text style={estilos.exito}>¡Pago aprobado!</Text>
      )}

      {error !== '' && (
        <Text style={estilos.error}>{error}</Text>
      )}

      {!pagoId && (
        <TouchableOpacity
          style={estilos.boton}
          onPress={crearPago}
          disabled={procesando}
        >
          {procesando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={estilos.textoBoton}>
              Generar orden y pagar
            </Text>
          )}
        </TouchableOpacity>
      )}

      {pagoId !== '' && (
        <>
          <Text style={estilos.estado}>
            Estado del pago: {estado}
          </Text>

          <TouchableOpacity
            style={estilos.boton}
            onPress={consultarPago}
            disabled={procesando}
          >
            {procesando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={estilos.textoBoton}>
                Ya pagué / Consultar estado
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.botonSecundario}
            onPress={() => Linking.openURL(checkoutUrl)}
          >
            <Text style={estilos.textoSecundario}>
              Volver a Mercado Pago
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    padding: 22,
    backgroundColor: '#F2F5FA',
  },
  titulo: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#003B8E',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 22,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555555',
    marginBottom: 8,
  },
  nombre: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#003B8E',
    marginBottom: 10,
  },
  dato: {
    fontSize: 15,
    color: '#222222',
    marginTop: 5,
  },
  descripcion: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  pago: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0066CC',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  precio: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#003B8E',
  },
  nota: {
    fontSize: 13,
    color: '#555555',
    marginTop: 8,
    textAlign: 'center',
  },
  boton: {
    backgroundColor: '#0057C2',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonSecundario: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0057C2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  textoSecundario: {
    color: '#0057C2',
    fontSize: 15,
    fontWeight: 'bold',
  },
  estado: {
    color: '#222222',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
  },
  error: {
    color: '#B00020',
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  exito: {
    color: '#087A32',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
  },
});
