
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config/api';

import {
  GoogleOneTapSignIn,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse,
  isCancelledResponse,
} from 'react-native-nitro-google-signin';

const CLIENTE_WEB_ID =
  '692357548547-aqc6q7r0ulbl71quqrc4c8hojjr0234b.apps.googleusercontent.com';

const CLAVE_REGISTRO_GOOGLE = 'work24_registro_google';

export interface DatosGoogle {
  nombre: string;
  apellido: string;
  email: string;
}

export interface RegistroGoogle {
  onboardingToken: string;
  datosGoogle: DatosGoogle;
}

export interface UsuarioGoogle {
  token: string;
  usuario: any;
}

export interface NuevaCuentaGoogle {
  requiereRegistro: true;
  onboardingToken: string;
  datosGoogle: DatosGoogle;
}

export type ResultadoGoogle = UsuarioGoogle | NuevaCuentaGoogle;

GoogleOneTapSignIn.configure({
  webClientId: CLIENTE_WEB_ID,
});

export async function obtenerTokenGoogle(): Promise<string> {
  await GoogleOneTapSignIn.checkPlayServices();

  let respuesta = await GoogleOneTapSignIn.signIn();

  if (isNoSavedCredentialFoundResponse(respuesta)) {
    respuesta = await GoogleOneTapSignIn.createAccount();
  }

  if (isNoSavedCredentialFoundResponse(respuesta)) {
    respuesta = await GoogleOneTapSignIn.presentExplicitSignIn();
  }

  if (isCancelledResponse(respuesta)) {
    throw new Error('Inicio de sesión cancelado.');
  }

  if (isSuccessResponse(respuesta)) {
    const idToken = respuesta.data.idToken;

    if (!idToken) {
      throw new Error('Google no devolvió un token de autenticación.');
    }

    return idToken;
  }

  throw new Error('No se pudo completar el inicio de sesión con Google.');
}

export async function autenticarConGoogle(
  tipo: 'cliente' | 'profesional'
): Promise<ResultadoGoogle> {
  const idToken = await obtenerTokenGoogle();

  const respuesta = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken,
      tipo,
    }),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.error || 'No se pudo iniciar sesión con Google.'
    );
  }

  if (
    datos.requiereRegistro === true &&
    datos.onboardingToken &&
    datos.datosGoogle
  ) {
    return datos as NuevaCuentaGoogle;
  }

  if (datos.token && datos.usuario) {
    return datos as UsuarioGoogle;
  }

  throw new Error('El servidor devolvió una respuesta inesperada.');
}

export async function guardarRegistroGoogle(
  onboardingToken: string,
  datosGoogle: DatosGoogle
) {
  const registro: RegistroGoogle = {
    onboardingToken,
    datosGoogle,
  };

  await SecureStore.setItemAsync(
    CLAVE_REGISTRO_GOOGLE,
    JSON.stringify(registro)
  );
}

export async function obtenerRegistroGoogle(): Promise<RegistroGoogle | null> {
  const contenido = await SecureStore.getItemAsync(
    CLAVE_REGISTRO_GOOGLE
  );

  if (!contenido) {
    return null;
  }

  try {
    return JSON.parse(contenido) as RegistroGoogle;
  } catch {
    await limpiarRegistroGoogle();
    return null;
  }
}

export async function limpiarRegistroGoogle() {
  await SecureStore.deleteItemAsync(CLAVE_REGISTRO_GOOGLE);
}
