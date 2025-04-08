export interface Usuario {
    username: string;
    password: string;
}

export interface UsuarioActualizado {
    username?: string;
    edad?: number;
    password?: string;
}
