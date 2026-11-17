export type Rol = "estudiante" | "profesor" | "admin";

export interface Usuario {
    username: string;
    password: string;
}

export interface UsuarioActualizado {
    username?: string;
    edad?: number;
    password?: string;
}

// Datos que viajan dentro del JWT
export interface DatosToken {
    id?: number;
    codigo?: string;
    username: string;
    password: string;
    rol?: Rol;
}

// Usuario ya validado contra la base de datos
export interface UsuarioAutenticado {
    id: number;
    codigo: string;
    username: string;
    rol: Rol;
}
