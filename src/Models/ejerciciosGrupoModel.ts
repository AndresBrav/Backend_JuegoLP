import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";
import UsuarioEjerciciosGrupo from "./usuario_ejerciciosGrupoModel";

export interface EjerciciosGrupoAttributes {
    id?: number;
    grupo_id?: number;
    temario_id?: number;
    titulo?: string;
    enunciado?: string;
    tipo?: "diagrama" | "pseudocodigo";
    asignacion?: "todos" | "seleccionados";
    puntos?: number;
    fecha_limite?: string | null;
    casos_prueba?: Array<{
        entradas: string[];
        salidas_esperadas: string[];
    }> | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface EjerciciosGrupoInstance
    extends Model<EjerciciosGrupoAttributes>,
        EjerciciosGrupoAttributes {}

/**
 * Ejercicios de grupo creados por el profesor dentro de un temario.
 * `tipo` define el tablero con el que se resuelve (diagrama o
 * pseudocódigo PSeInt). `fecha_limite` (DATEONLY, NULL = sin límite):
 * pasado el día el estudiante solo puede VER, no guardar ni completar.
 */
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
            type: DataTypes.STRING(120),
            allowNull: false,
            validate: {
                len: {
                    args: [3, 120],
                    msg: "El título debe tener 3 a 120 caracteres",
                },
            },
        },
        enunciado: {
            type: DataTypes.TEXT("long"),
            allowNull: false,
        },
        tipo: {
            type: DataTypes.ENUM("diagrama", "pseudocodigo"),
            allowNull: false,
        },
        asignacion: {
            type: DataTypes.ENUM("todos", "seleccionados"),
            allowNull: false,
            defaultValue: "todos",
        },
        puntos: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 5,
        },
        fecha_limite: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        casos_prueba: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        tableName: "Ejercicios_Grupo",
        timestamps: true,
    },
);

EjerciciosGrupo.hasMany(UsuarioEjerciciosGrupo, {
    foreignKey: "ejercicio_grupo_id",
    sourceKey: "id",
});

UsuarioEjerciciosGrupo.belongsTo(EjerciciosGrupo, {
    foreignKey: "ejercicio_grupo_id",
    targetKey: "id",
});

export default EjerciciosGrupo;
