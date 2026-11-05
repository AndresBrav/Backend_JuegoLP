import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";
import Grupo from "./grupoModel";
import UsuarioEjerciciosGrupo from "./usuario_ejerciciosGrupoModel";
import TemariosGrupo from "./temariosGrupoModel";

export interface EjerciciosGrupoAttributes {
    id?: number;
    grupo_id?: number;
    temario_id?: number;
    titulo?: string;
    enunciado?: string;
    tipo?: string;
    puntos?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface EjerciciosGrupoInstance
    extends Model<EjerciciosGrupoAttributes>,
        EjerciciosGrupoAttributes {}

const EjerciciosGrupo = db.define<EjerciciosGrupoInstance>(
    "EjerciciosGrupo",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        grupo_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        temario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        titulo: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        enunciado: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        tipo: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "diagrama",
        },
        puntos: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 10,
        },
    },
    {
        tableName: "Ejercicios_Grupo",
        timestamps: true,
    },
);

EjerciciosGrupo.belongsTo(Grupo, {
    as: "grupo",
    foreignKey: "grupo_id",
});

EjerciciosGrupo.belongsTo(TemariosGrupo, {
    as: "temario",
    foreignKey: "temario_id",
});

Grupo.hasMany(EjerciciosGrupo, {
    as: "ejercicios",
    foreignKey: "grupo_id",
});

EjerciciosGrupo.hasMany(UsuarioEjerciciosGrupo, {
    as: "respuestas",
    foreignKey: "ejercicio_grupo_id",
});

UsuarioEjerciciosGrupo.belongsTo(EjerciciosGrupo, {
    as: "ejercicio",
    foreignKey: "ejercicio_grupo_id",
});

export default EjerciciosGrupo;
