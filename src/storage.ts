import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE_USUARIOS = '@work24_usuarios';
const CLAVE_SOLICITUDES = '@work24_solicitudes';
const CLAVE_USUARIO_ACTUAL = '@work24_usuario_actual';

export async function guardarUsuarios(usuarios: any[]) {
  await AsyncStorage.setItem(
    CLAVE_USUARIOS,
    JSON.stringify(usuarios)
  );
}

export async function obtenerUsuarios() {
  const datos = await AsyncStorage.getItem(CLAVE_USUARIOS);

  if (datos === null) {
    return [];
  }

  return JSON.parse(datos);
}

export async function guardarUsuarioActual(usuario: any) {
  await AsyncStorage.setItem(
    CLAVE_USUARIO_ACTUAL,
    JSON.stringify(usuario)
  );
}

export async function obtenerUsuarioActual() {
  const datos = await AsyncStorage.getItem(CLAVE_USUARIO_ACTUAL);

  if (datos === null) {
    return null;
  }

  return JSON.parse(datos);
}

export async function guardarSolicitudes(solicitudes: any[]) {
  await AsyncStorage.setItem(
    CLAVE_SOLICITUDES,
    JSON.stringify(solicitudes)
  );
}

export async function obtenerSolicitudes() {
  const datos = await AsyncStorage.getItem(CLAVE_SOLICITUDES);

  if (datos === null) {
    return [];
  }

  return JSON.parse(datos);
}
