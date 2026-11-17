import { DataTypes, Model } from "sequelize";
import db from "../db/conexion";

export interface UsuarioEjerciciosGrupoAttributes {
    id?: number;
    ejercicio_grupo_id?: number;
    usuario_id?: number;
    estado_tablero?: string | null;
    resultado_casos_prueba?: Array<{
        indice: number;
        aprobado: boolean;
        salida_obtenida: string[];
        error: string | null;
    }> | null;
    completado?: boolean;
    puntos?: number;
    calificado?: boolean;
    puntos_profesor?: number | null;
    comentario_profesor?: string | null;
    fecha_completado?: Date | null;
    ultima_actividad?: Date | null;
}

export interface UsuarioEjerciciosGrupoInstance
    extends Model<UsuarioEjerciciosGrupoAttributes>,
        UsuarioEjerciciosGrupoAttributes {}

/**
 * Entrega del estudiante para UN ejercicio de grupo.
 *
 * BLINDAJE del bug histórico ("entrego uno y se marca otro"): el índice
 * único (ejercicio_grupo_id, usuario_id) de la migración garantiza UNA
 * fila por par (ejercicio, estudiante). Los servicios SIEMPRE consultan
 * con where { ejercicio_grupo_id, usuario_id } y validan la cadena
 * completa de pertenencia (ejercicio → grupo → inscripción) antes de
 * leer o escribir. Los puntos se suman solo cuando `completado` pasa de
 * false a true en ESTA fila; un ejercicio nuevo no hereda nada.
 */
const UsuarioEjerciciosGrupo = db.define<UsuarioEjerciciosGrupoInstance>(
    "UsuarioEjerciciosGrupo",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        ejercicio_grupo_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        estado_tablero: {
            type: DataTypes.TEXT("long"),
            allowNull: true,
        },
        resultado_casos_prueba: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        completado: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        puntos: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        calificado: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        puntos_profesor: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        comentario_profesor: {
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
