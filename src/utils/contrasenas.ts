import argon2 from "argon2";

export const hashContrasena = (contrasena: string): Promise<string> =>
    argon2.hash(contrasena, { type: argon2.argon2id });

export const verificarContrasena = (
    hash: string,
    contrasena: string,
): Promise<boolean> => argon2.verify(hash, contrasena);
