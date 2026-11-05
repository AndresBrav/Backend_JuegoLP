import { Response } from "express";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import {
    crearGrupo,
    eliminarGrupo,
    listarEstudiantesDeGrupo,
    listarGruposProfesor,
    obtenerGrupoPorId,
    profesorTieneEstudiante,
} from "../Services/grupoServices";
import {
    reporteEstudiante,
    reporteGrupo,
} from "../Services/reporteServices";
import {
    crearEjercicioDeGrupo,
    listarEjerciciosDeGrupo,
    editarEjercicioDeGrupo,
    eliminarEjercicioDeGrupo,
    profesorEsDuenioDeGrupo,
    obtenerEjercicioPorId,
    listarSolucionesEjercicio,
    calificarEntregaEstudiante,
    esTipoEjercicioValido,
    obtenerRankingGrupo,
} from "../Services/ejerciciosGrupoServices";

const esAdmin = (req: RequestAutenticado): boolean =>
    req.usuarioActual?.rol === "admin";

/**
 * @swagger
 * /profesor/grupos:
 *   post:
 *     tags: [Profesor]
 *     summary: Crear un grupo
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "10-A"
 *     responses:
 *       201:
 *         description: Grupo creado
 *       400:
 *         description: Nombre invÃ¡lido
 *       403:
 *         description: Requiere rol profesor
 */
export const crearGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const nombre = req.body?.nombre;

        if (typeof nombre !== "string" || nombre.trim().length === 0) {
            res.status(400).json({ message: "El nombre del grupo es obligatorio" });
            return;
        }

        const grupo = await crearGrupo(
            req.usuarioActual!.id,
            nombre.trim(),
        );

        res.status(201).json({
            id: grupo.id,
            nombre: grupo.nombre,
            codigo: grupo.codigo,
        });
    } catch (error: any) {
        console.error("ERROR crearGrupoController:", error);
        res.status(500).json({ message: "No se pudo crear el grupo" });
    }
};

/**
 * @swagger
 * /profesor/grupos:
 *   get:
 *     tags: [Profesor]
 *     summary: Listar los grupos del profesor autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de grupos con nÃºmero de estudiantes
 */
export const listarGruposController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupos = await listarGruposProfesor(req.usuarioActual!.id);
        res.json(grupos);
    } catch (error: any) {
        console.error("ERROR listarGruposController:", error);
        res.status(500).json({ message: "No se pudieron listar los grupos" });
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}:
 *   get:
 *     tags: [Profesor]
 *     summary: Ver un grupo con sus estudiantes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Grupo con estudiantes
 *       403:
 *         description: El grupo pertenece a otro profesor
 *       404:
 *         description: Grupo no encontrado
 */
export const obtenerGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);

        if (!Number.isInteger(grupoId)) {
            res.status(400).json({ message: "Id de grupo invÃ¡lido" });
            return;
        }

        const grupo = await obtenerGrupoPorId(grupoId);

        if (!grupo) {
            res.status(404).json({ message: "Grupo no encontrado" });
            return;
        }

        if (!esAdmin(req) && Number(grupo.profesor_id) !== req.usuarioActual!.id) {
            res.status(403).json({ message: "Este grupo no te pertenece" });
            return;
        }

        const estudiantes = await listarEstudiantesDeGrupo(grupoId);

        res.json({
            id: grupo.id,
            nombre: grupo.nombre,
            codigo: grupo.codigo,
            profesor: (grupo as any).profesor,
            estudiantes,
        });
    } catch (error: any) {
        console.error("ERROR obtenerGrupoController:", error);
        res.status(500).json({ message: "No se pudo obtener el grupo" });
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}:
 *   delete:
 *     tags: [Profesor]
 *     summary: Eliminar un grupo propio
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Grupo eliminado
 *       404:
 *         description: Grupo no encontrado
 */
export const eliminarGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);

        if (!Number.isInteger(grupoId)) {
            res.status(400).json({ message: "Id de grupo invÃ¡lido" });
            return;
        }

        const eliminado = await eliminarGrupo(grupoId, req.usuarioActual!.id);

        if (!eliminado) {
            res.status(404).json({ message: "Grupo no encontrado" });
            return;
        }

        res.status(204).send();
    } catch (error: any) {
        console.error("ERROR eliminarGrupoController:", error);
        res.status(500).json({ message: "No se pudo eliminar el grupo" });
    }
};

const validarRango = (req: RequestAutenticado) => {
    const desde = typeof req.query.desde === "string" ? req.query.desde : undefined;
    const hasta = typeof req.query.hasta === "string" ? req.query.hasta : undefined;
    return { desde, hasta };
};

/**
 * @swagger
 * /profesor/grupos/{id}/reporte:
 *   get:
 *     tags: [Profesor]
 *     summary: Reporte del grupo con evoluciÃ³n diaria
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte del grupo
 *       403:
 *         description: Sin permisos sobre el grupo
 *       404:
 *         description: Grupo no encontrado
 */
export const reporteGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);

        if (!Number.isInteger(grupoId)) {
            res.status(400).json({ message: "Id de grupo invÃ¡lido" });
            return;
        }

        const grupo = await obtenerGrupoPorId(grupoId);

        if (!grupo) {
            res.status(404).json({ message: "Grupo no encontrado" });
            return;
        }

        if (!esAdmin(req) && Number(grupo.profesor_id) !== req.usuarioActual!.id) {
            res.status(403).json({ message: "Este grupo no te pertenece" });
            return;
        }

        const { desde, hasta } = validarRango(req);
        const reporte = await reporteGrupo(grupo, desde, hasta);

        res.json(reporte);
    } catch (error: any) {
        console.error("ERROR reporteGrupoController:", error);
        res.status(500).json({ message: "No se pudo generar el reporte" });
    }
};

/**
 * @swagger
 * /profesor/estudiantes/{id}/reporte:
 *   get:
 *     tags: [Profesor]
 *     summary: Detalle del progreso de un estudiante
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Progreso del estudiante en ejercicios de grupo
 *       403:
 *         description: El estudiante no pertenece a tus grupos
 *       404:
 *         description: Estudiante no encontrado
 */
export const reporteEstudianteController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const estudianteId = Number(req.params.id);

        if (!Number.isInteger(estudianteId)) {
            res.status(400).json({ message: "Id de estudiante invÃ¡lido" });
            return;
        }

        if (!esAdmin(req)) {
            const permitido = await profesorTieneEstudiante(
                req.usuarioActual!.id,
                estudianteId,
            );

            if (!permitido) {
                res.status(403).json({
                    message: "El estudiante no pertenece a tus grupos",
                });
                return;
            }
        }

        const reporte = await reporteEstudiante(
            estudianteId,
            esAdmin(req) ? undefined : { profesorId: req.usuarioActual!.id },
        );

        if (!reporte) {
            res.status(404).json({ message: "Estudiante no encontrado" });
            return;
        }

        res.json(reporte);
    } catch (error: any) {
        console.error("ERROR reporteEstudianteController:", error);
        res.status(500).json({ message: "No se pudo generar el reporte" });
    }
};

export const crearEjercicioGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);
        const { titulo, enunciado, tipo, puntos } = req.body;

        if (!Number.isInteger(grupoId)) {
            res.status(400).json({ message: "Id de grupo inválido" });
            return;
        }

        const grupo = await obtenerGrupoPorId(grupoId);
        if (!grupo) {
            res.status(404).json({ message: "Grupo no encontrado" });
            return;
        }

        if (!esAdmin(req) && grupo.profesor_id !== req.usuarioActual!.id) {
            res.status(403).json({ message: "No tienes acceso a este grupo" });
            return;
        }

        if (!titulo || typeof titulo !== "string" || titulo.trim().length < 2) {
            res.status(400).json({ message: "El título es requerido" });
            return;
        }

        if (!enunciado || typeof enunciado !== "string" || enunciado.trim().length < 5) {
            res.status(400).json({ message: "El enunciado es requerido" });
            return;
        }

        if (!esTipoEjercicioValido(tipo)) {
            res.status(400).json({ message: "Tipo debe ser 'diagrama' o 'pseudocodigo'" });
            return;
        }

        const puntosNum = Number(puntos ?? 10);
        if (isNaN(puntosNum) || puntosNum <= 0) {
            res.status(400).json({ message: "Los puntos deben ser un número positivo" });
            return;
        }

        const ejercicio = await crearEjercicioDeGrupo(
            grupoId,
            grupo.nombre,
            {
                titulo: titulo.trim(),
                enunciado: enunciado.trim(),
                tipo,
                puntos: puntosNum,
            },
        );

        res.status(201).json(ejercicio);
    } catch (error: any) {
        console.error("ERROR crearEjercicioGrupoController:", error);
        res.status(500).json({ message: "No se pudo crear el ejercicio" });
    }
};

export const listarEjerciciosGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);

        if (!Number.isInteger(grupoId)) {
            res.status(400).json({ message: "Id de grupo inválido" });
            return;
        }

        const grupo = await obtenerGrupoPorId(grupoId);
        if (!grupo) {
            res.status(404).json({ message: "Grupo no encontrado" });
            return;
        }

        if (!esAdmin(req) && grupo.profesor_id !== req.usuarioActual!.id) {
            res.status(403).json({ message: "No tienes acceso a este grupo" });
            return;
        }

        const ejercicios = await listarEjerciciosDeGrupo(grupoId);
        res.json(ejercicios);
    } catch (error: any) {
        console.error("ERROR listarEjerciciosGrupoController:", error);
        res.status(500).json({ message: "No se pudieron listar los ejercicios" });
    }
};

export const editarEjercicioGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const ejercicioId = Number(req.params.id);
        const { titulo, enunciado, tipo, puntos } = req.body;

        if (!Number.isInteger(ejercicioId)) {
            res.status(400).json({ message: "Id de ejercicio inválido" });
            return;
        }

        const ejercicio = await obtenerEjercicioPorId(ejercicioId);
        if (!ejercicio) {
            res.status(404).json({ message: "Ejercicio no encontrado" });
            return;
        }

        const grupo = await obtenerGrupoPorId(Number(ejercicio.grupo_id));
        if (!grupo || (!esAdmin(req) && grupo.profesor_id !== req.usuarioActual!.id)) {
            res.status(403).json({ message: "No tienes acceso a este ejercicio" });
            return;
        }

        const ejercicioActualizado = await editarEjercicioDeGrupo(ejercicioId, {
            titulo,
            enunciado,
            tipo,
            puntos: puntos !== undefined ? Number(puntos) : undefined,
        });

        res.json(ejercicioActualizado);
    } catch (error: any) {
        console.error("ERROR editarEjercicioGrupoController:", error);
        res.status(500).json({ message: "No se pudo actualizar el ejercicio" });
    }
};

export const eliminarEjercicioGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const ejercicioId = Number(req.params.id);

        if (!Number.isInteger(ejercicioId)) {
            res.status(400).json({ message: "Id de ejercicio inválido" });
            return;
        }

        const ejercicio = await obtenerEjercicioPorId(ejercicioId);
        if (!ejercicio) {
            res.status(404).json({ message: "Ejercicio no encontrado" });
            return;
        }

        const grupo = await obtenerGrupoPorId(Number(ejercicio.grupo_id));
        if (!grupo || (!esAdmin(req) && grupo.profesor_id !== req.usuarioActual!.id)) {
            res.status(403).json({ message: "No tienes acceso a este ejercicio" });
            return;
        }

        await eliminarEjercicioDeGrupo(ejercicioId, Number(ejercicio.grupo_id));
        res.status(204).send();
    } catch (error: any) {
        console.error("ERROR eliminarEjercicioGrupoController:", error);
        res.status(500).json({ message: "No se pudo eliminar el ejercicio" });
    }
};

export const listarSolucionesEjercicioController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const ejercicioId = Number(req.params.id);
        const estudianteId = req.query.estudianteId ? Number(req.query.estudianteId) : null;

        if (!Number.isInteger(ejercicioId)) {
            res.status(400).json({ message: "Id de ejercicio inválido" });
            return;
        }

        const ejercicio = await obtenerEjercicioPorId(ejercicioId);
        if (!ejercicio) {
            res.status(404).json({ message: "Ejercicio no encontrado" });
            return;
        }

        const grupo = await obtenerGrupoPorId(Number(ejercicio.grupo_id));
        if (!grupo || (!esAdmin(req) && grupo.profesor_id !== req.usuarioActual!.id)) {
            res.status(403).json({ message: "No tienes acceso a este ejercicio" });
            return;
        }

        const data = await listarSolucionesEjercicio(ejercicioId, estudianteId);
        res.json(data);
    } catch (error: any) {
        console.error("ERROR listarSolucionesEjercicioController:", error);
        res.status(500).json({ message: "No se pudieron obtener las soluciones" });
    }
};

export const calificarEntregaController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const ejercicioId = Number(req.params.id);
        const estudianteId = Number(req.params.estudianteId);
        const { puntos } = req.body;

        if (!Number.isInteger(ejercicioId) || !Number.isInteger(estudianteId)) {
            res.status(400).json({ message: "Parámetros inválidos" });
            return;
        }

        const puntosNum = Number(puntos);
        if (isNaN(puntosNum) || puntosNum < 0) {
            res.status(400).json({ message: "La nota/puntos debe ser un número mayor o igual a 0" });
            return;
        }

        const ejercicio = await obtenerEjercicioPorId(ejercicioId);
        if (!ejercicio) {
            res.status(404).json({ message: "Ejercicio no encontrado" });
            return;
        }

        const grupo = await obtenerGrupoPorId(Number(ejercicio.grupo_id));
        if (!grupo || (!esAdmin(req) && grupo.profesor_id !== req.usuarioActual!.id)) {
            res.status(403).json({ message: "No tienes acceso a este ejercicio" });
            return;
        }

        const respuesta = await calificarEntregaEstudiante(
            ejercicioId,
            estudianteId,
            puntosNum,
        );

        res.json({
            message: "Calificación asignada correctamente",
            respuesta,
        });
    } catch (error: any) {
        console.error("ERROR calificarEntregaController:", error);
        res.status(500).json({ message: "No se pudo asignar la calificación" });
    }
};

export const obtenerRankingGrupoProfesorController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);
        if (!Number.isInteger(grupoId)) {
            res.status(400).json({ message: "ID de grupo inválido" });
            return;
        }

        const grupo = await obtenerGrupoPorId(grupoId);
        if (!grupo || (!esAdmin(req) && grupo.profesor_id !== req.usuarioActual!.id)) {
            res.status(403).json({ message: "No tienes acceso a este grupo" });
            return;
        }

        const ranking = await obtenerRankingGrupo(grupoId);
        res.json(ranking);
    } catch (error: any) {
        console.error("ERROR obtenerRankingGrupoProfesorController:", error);
        res.status(500).json({ message: "Error al obtener el ranking del grupo" });
    }
};
