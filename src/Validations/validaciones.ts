import { Rol } from "../interfaces/Usuario";

export const isString = (id: any): boolean => {
    return typeof id === "string";
};

export const isNumero = (x: any): boolean => {
    return typeof x === "number";
};

/** Roles que un usuario puede elegir al registrarse. Admin queda fuera. */
export const esRolDeRegistro = (valor: any): valor is Rol => {
    return valor === "estudiante" || valor === "profesor";
};

/** Código institucional: string alfanumérico de 4 a 20 caracteres. */
export const esCodigoValido = (valor: any): boolean => {
    if (typeof valor !== "string") return false;
    return /^[A-Za-z0-9]{4,20}$/.test(valor.trim());
};

export const normalizarCodigo = (valor: string): string => valor.trim();

/** Fecha en formato YYYY-MM-DD. */
export const esFechaValida = (valor: any): boolean => {
    if (typeof valor !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const fecha = new Date(`${valor}T00:00:00`);
    return !Number.isNaN(fecha.getTime());
};
