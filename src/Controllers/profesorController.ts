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
import {
    listarTemariosDeGrupo,
    crearTemarioDeGrupo,
    editarTemarioDeGrupo,
    eliminarTemarioDeGrupo,
    reordenarTemariosDeGrupo,
    obtenerTemarioPorId,
} from "../Services/temariosGrupoServices";

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
        const { titulo, enunciado, tipo, puntos, temario_id } = req.body;

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

        // Todo ejercicio pertenece a un temario del grupo
        const temarioId = Number(temario_id);
        if (!Number.isInteger(temarioId)) {
            res.status(400).json({ message: "Debes elegir un temario para el ejercicio" });
            return;
        }

        const temario = await obtenerTemarioPorId(temarioId);
        if (!temario || Number(temario.grupo_id) !== grupoId) {
            res.status(400).json({ message: "El temario no pertenece a este grupo" });
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
                temario_id: temarioId,
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

/**
 * @swagger
 * /profesor/grupos/{id}/temarios:
 *   get:
 *     tags: [Profesor]
 *     summary: Listar los temarios de un grupo con cantidad de ejercicios
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
 *         description: Lista de temarios
 *       403:
 *         description: No tienes acceso a este grupo
 */
export const listarTemariosGrupoController = async (
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

        const temarios = await listarTemariosDeGrupo(grupoId);
        res.json(temarios);
    } catch (error: any) {
        console.error("ERROR listarTemariosGrupoController:", error);
        res.status(500).json({ message: "No se pudieron listar los temarios" });
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}/temarios:
 *   post:
 *     tags: [Profesor]
 *     summary: Crear un temario en el grupo
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *                 example: "Condicionales"
 *               descripcion:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Temario creado
 *       400:
 *         description: Datos inválidos o nombre repetido
 */
export const crearTemarioGrupoController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);
        const { nombre, descripcion } = req.body;

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

        if (
            !nombre ||
            typeof nombre !== "string" ||
            nombre.trim().length < 2 ||
            nombre.trim().length > 80
        ) {
            res.status(400).json({
                message: "El nombre del temario debe tener entre 2 y 80 caracteres",
            });
            return;
        }

        const temario = await crearTemarioDeGrupo(grupoId, {
            nombre: nombre.trim(),
            descripcion:
                typeof descripcion === "string" ? descripcion.trim() : null,
        });

        res.status(201).json(temario);
    } catch (error: any) {
        if (error.message === "NOMBRE_REPETIDO") {
            res.status(400).json({ message: "Ya existe un temario con ese nombre en el grupo" });
            return;
        }
        console.error("ERROR crearTemarioGrupoController:", error);
        res.status(500).json({ message: "No se pudo crear el temario" });
    }
};

/**
 * @swagger
 * /profesor/temarios/{id}:
 *   put:
 *     tags: [Profesor]
 *     summary: Editar un temario (nombre, descripción u orden)
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
 *         description: Temario actualizado
 *       403/404:
 *         description: Sin acceso o no encontrado
 */
export const editarTemarioController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const temarioId = Number(req.params.id);
        const { nombre, descripcion, orden } = req.body;

        if (!Number.isInteger(temarioId)) {
            res.status(400).json({ message: "Id de temario inválido" });
            return;
        }

        const temario = await obtenerTemarioPorId(temarioId);
        if (!temario) {
            res.status(404).json({ message: "Temario no encontrado" });
            return;
        }

        const grupo = await obtenerGrupoPorId(Number(temario.grupo_id));
        if (!grupo || (!esAdmin(req) && grupo.profesor_id !== req.usuarioActual!.id)) {
            res.status(403).json({ message: "No tienes acceso a este temario" });
            return;
        }

        if (
            nombre !== undefined &&
            (typeof nombre !== "string" ||
                nombre.trim().length < 2 ||
                nombre.trim().length > 80)
        ) {
            res.status(400).json({
                message: "El nombre del temario debe tener entre 2 y 80 caracteres",
            });
            return;
        }

        const actualizado = await editarTemarioDeGrupo(temarioId, {
            nombre:
                typeof nombre === "string" ? nombre.trim() : undefined,
            descripcion:
                typeof descripcion === "string" ? descripcion.trim() : undefined,
            orden: orden !== undefined ? Number(orden) : undefined,
        });

        res.json(actualizado);
    } catch (error: any) {
        if (error.message === "NOMBRE_REPETIDO") {
            res.status(400).json({ message: "Ya existe un temario con ese nombre en el grupo" });
            return;
        }
        console.error("ERROR editarTemarioController:", error);
        res.status(500).json({ message: "No se pudo editar el temario" });
    }
};

/**
 * @swagger
 * /profesor/temarios/{id}:
 *   delete:
 *     tags: [Profesor]
 *     summary: Eliminar un temario (solo si está vacío)
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
 *         description: Temario eliminado
 *       400:
 *         description: El temario tiene ejercicios
 *       403/404:
 *         description: Sin acceso o no encontrado
 */
export const eliminarTemarioController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const temarioId = Number(req.params.id);

        if (!Number.isInteger(temarioId)) {
            res.status(400).json({ message: "Id de temario inválido" });
            return;
        }

        const temario = await obtenerTemarioPorId(temarioId);
        if (!temario) {
            res.status(404).json({ message: "Temario no encontrado" });
            return;
        }

        const grupo = await obtenerGrupoPorId(Number(temario.grupo_id));
        if (!grupo || (!esAdmin(req) && grupo.profesor_id !== req.usuarioActual!.id)) {
            res.status(403).json({ message: "No tienes acceso a este temario" });
            return;
        }

        await eliminarTemarioDeGrupo(temarioId);
        res.json({ message: "Temario eliminado" });
    } catch (error: any) {
        if (error.message === "TEMARIO_CON_EJERCICIOS") {
            res.status(400).json({
                message:
                    "El temario tiene ejercicios: muévelos o elimínalos antes de borrarlo",
            });
            return;
        }
        console.error("ERROR eliminarTemarioController:", error);
        res.status(500).json({ message: "No se pudo eliminar el temario" });
    }
};

/**
 * @swagger
 * /profesor/grupos/{id}/temarios/reordenar:
 *   put:
 *     tags: [Profesor]
 *     summary: Reordenar los temarios del grupo (lista de ids)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orden]
 *             properties:
 *               orden:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Temarios reordenados
 */
export const reordenarTemariosController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupoId = Number(req.params.id);
        const orden = req.body?.orden;

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

        if (
            !Array.isArray(orden) ||
            orden.some((item) => !Number.isInteger(Number(item)))
        ) {
            res.status(400).json({ message: "La lista de orden es inválida" });
            return;
        }

        await reordenarTemariosDeGrupo(orden.map(Number));
        res.json({ message: "Temarios reordenados" });
    } catch (error: any) {
        console.error("ERROR reordenarTemariosController:", error);
        res.status(500).json({ message: "No se pudo reordenar los temarios" });
    }
};
