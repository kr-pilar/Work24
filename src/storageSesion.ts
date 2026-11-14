import * as SecureStore from 'expo-secure-store';

const CLAVE_TOKEN = 'work24_token';
const CLAVE_USUARIO = 'work24_usuario';

export async function guardarSesion(token: string, usuario: any) {
  await SecureStore.setItemAsync(CLAVE_TOKEN, token);
  await SecureStore.setItemAsync(
    CLAVE_USUARIO,
    JSON.stringify(usuario)
  );
}

export async function obtenerToken() {
  return await SecureStore.getItemAsync(CLAVE_TOKEN);
}

export async function obtenerUsuarioSesion() {
  const usuario = await SecureStore.getItemAsync(CLAVE_USUARIO);

  if (usuario) {
    return JSON.parse(usuario);
  }

  return null;
}

export async function cerrarSesion() {
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  await SecureStore.deleteItemAsync(CLAVE_USUARIO);
}
