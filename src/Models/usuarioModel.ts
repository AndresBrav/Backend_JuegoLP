import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";
import UsuarioJuegos from "./usuario_juegosModel";
import Notificaciones from "./NotificacionesModel";
import JuegosIA from "./juegos_iaModel";
import UsuarioJuegosIA from "./usuario_juegosIAModel";
import { Rol } from "../interfaces/Usuario";

interface UsuariosAttributes {
    id?: number;
    codigo?: string;
    username?: string;
    edad?: number;
    password?: string;
    idAvatar?: number;
    rol?: Rol;
}

export interface UsuariosInstance
    extends Model<UsuariosAttributes>,
        UsuariosAttributes {}

const Usuarios = db.define<UsuariosInstance>(
    "Usuarios",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        codigo: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        edad: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        idAvatar: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        rol: {
            type: DataTypes.ENUM("estudiante", "profesor", "admin"),
            allowNull: false,
            defaultValue: "estudiante",
        },
    },
    {
        tableName: "Usuarios",
    },
);

Usuarios.hasMany(UsuarioJuegos, {
    foreignKey: "usuario_id",
    sourceKey: "id",
});

UsuarioJuegos.belongsTo(Usuarios, {
    foreignKey: "usuario_id",
    targetKey: "id",
});

Usuarios.hasMany(Notificaciones, {
    foreignKey: "usuario_id",
    sourceKey: "id",
});

Notificaciones.belongsTo(Usuarios, {
    foreignKey: "usuario_id",
    targetKey: "id",
});

Usuarios.hasMany(JuegosIA, {
    foreignKey: "usuario_id",
    sourceKey: "id",
});

JuegosIA.belongsTo(Usuarios, {
    foreignKey: "usuario_id",
    targetKey: "id",
});

Usuarios.hasMany(UsuarioJuegosIA, {
    foreignKey: "usuario_id",
    sourceKey: "id",
});

UsuarioJuegosIA.belongsTo(Usuarios, {
    foreignKey: "usuario_id",
    targetKey: "id",
});

export default Usuarios;
