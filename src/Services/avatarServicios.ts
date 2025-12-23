import Avatares, { AvatarInstance } from "../Models/avatarModel";

export const obtenerAvataresServicios = async () => {
    const avatares = await Avatares.findAll();
    return avatares;
};

export const obtenerUnAvatarServicios = async (id:string):Promise<AvatarInstance> => {
    const avatares = await Avatares.findByPk(id);
    return avatares;
};
