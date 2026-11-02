import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

export interface UsuarioEjerciciosGrupoAttributes {
    id?: number;
    usuario_id?: number;
    ejercicio_grupo_id?: number;
    completado?: boolean;
    puntos?: number;
    estado_tablero?: string | null;
    fecha_completado?: Date | null;
    ultima_actividad?: Date | null;
}

export interface UsuarioEjerciciosGrupoInstance
    extends Model<UsuarioEjerciciosGrupoAttributes>,
        UsuarioEjerciciosGrupoAttributes {}

const UsuarioEjerciciosGrupo = db.define<UsuarioEjerciciosGrupoInstance>(
    "UsuarioEjerciciosGrupo",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        ejercicio_grupo_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        completado: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        puntos: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        estado_tablero: {
            type: DataTypes.TEXT("long"),
            allowNull: true,
        },
        fecha_completado: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        ultima_actividad: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "Usuario_Ejercicios_Grupo",
        timestamps: false,
    },
);

export default UsuarioEjerciciosGrupo;
