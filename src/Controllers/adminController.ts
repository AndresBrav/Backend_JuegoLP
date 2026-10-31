import { Response } from "express";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import {
    crearProfesor,
    listarEstudiantes,
    listarProfesores,
    listarTodosLosGrupos,
} from "../Services/adminServices";
import {
    esCodigoValido,
    normalizarCodigo,
} from "../Validations/validaciones";
import {
    reporteEstudiante,
    reporteGrupo,
    estadisticasGlobales,
} from "../Services/reporteServices";
import { obtenerGrupoPorId } from "../Services/grupoServices";

/**
 * @swagger
 * /admin/profesores:
 *   post:
 *     tags: [Admin]
 *     summary: Crear una cuenta de profesor
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codigo, username, edad, password]
 *             properties:
 *               codigo:
 *                 type: string
 *                 example: "201900123"
 *               username:
 *                 type: string
 *               edad:
 *                 type: integer
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Profesor creado
 *       409:
 *         description: Código o usuario duplicado
 */
export const crearProfesorController = async (
    req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const { codigo, username, edad, password } = req.body ?? {};

        if (!codigo || !username || !edad || !password) {
            res.status(400).json({ message: "Faltan datos en la solicitud" });
            return;
        }

        const codigoNormalizado = normalizarCodigo(String(codigo));

        if (!esCodigoValido(codigoNormalizado)) {
            res.status(400).json({
                message: "El código debe ser alfanumérico de 4 a 20 caracteres",
            });
            return;
        }

        const edadNumero = Number(edad);

        if (!Number.isInteger(edadNumero) || edadNumero <= 0 || edadNumero > 120) {
            res.status(400).json({ message: "Edad inválida" });
            return;
        }

        const profesor = await crearProfesor({
            codigo: codigoNormalizado,
            username: String(username).trim(),
            edad: edadNumero,
            password: String(password),
        });

        res.status(201).json({
            id: profesor.id,
            codigo: profesor.codigo,
            username: profesor.username,
            rol: profesor.rol,
        });
    } catch (error: any) {
        if (error.message === "CODIGO_DUPLICADO") {
            res.status(409).json({ message: "El código ya está registrado" });
            return;
        }

        if (error.message === "USERNAME_DUPLICADO") {
            res.status(409).json({ message: "El usuario ya está registrado" });
            return;
        }

        console.error("ERROR crearProfesorController:", error);
        res.status(500).json({ message: "No se pudo crear el profesor" });
    }
};

/**
 * @swagger
 * /admin/profesores:
 *   get:
 *     tags: [Admin]
 *     summary: Listar profesores con número de grupos y estudiantes
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de profesores
 */
export const listarProfesoresController = async (
    _req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const profesores = await listarProfesores();
        res.json(profesores);
    } catch (error: any) {
        console.error("ERROR listarProfesoresController:", error);
        res.status(500).json({ message: "No se pudieron listar los profesores" });
    }
};

/**
 * @swagger
 * /admin/grupos:
 *   get:
 *     tags: [Admin]
 *     summary: Listar todos los grupos de la plataforma
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de grupos
 */
export const listarGruposController = async (
    _req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const grupos = await listarTodosLosGrupos();
        res.json(grupos);
    } catch (error: any) {
        console.error("ERROR listarGruposController:", error);
        res.status(500).json({ message: "No se pudieron listar los grupos" });
    }
};

/**
 * @swagger
 * /admin/estudiantes:
 *   get:
 *     tags: [Admin]
 *     summary: Listar todos los estudiantes con grupos y puntos
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista global de estudiantes
 */
export const listarEstudiantesController = async (
    _req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const estudiantes = await listarEstudiantes();
        res.json(estudiantes);
    } catch (error: any) {
        console.error("ERROR listarEstudiantesController:", error);
        res.status(500).json({
            message: "No se pudieron listar los estudiantes",
        });
    }
};

/**
 * @swagger
 * /admin/estudiantes/{id}/reporte:
 *   get:
 *     tags: [Admin]
 *     summary: Reporte de progreso de cualquier estudiante
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
 *         description: Progreso por ejercicio y por día
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
            res.status(400).json({ message: "Id de estudiante inválido" });
            return;
        }

        const reporte = await reporteEstudiante(estudianteId);

        if (!reporte) {
            res.status(404).json({ message: "Estudiante no encontrado" });
            return;
        }

        res.json(reporte);
    } catch (error: any) {
        console.error("ERROR admin reporteEstudianteController:", error);
        res.status(500).json({
            message: "No se pudo generar el reporte",
        });
    }
};

/**
 * @swagger
 * /admin/grupos/{id}/reporte:
 *   get:
 *     tags: [Admin]
 *     summary: Reporte de cualquier grupo
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
 *         description: Reporte del grupo
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
            res.status(400).json({ message: "Id de grupo inválido" });
            return;
        }

        const grupo = await obtenerGrupoPorId(grupoId);

        if (!grupo) {
            res.status(404).json({ message: "Grupo no encontrado" });
            return;
        }

        const desde = typeof req.query.desde === "string" ? req.query.desde : undefined;
        const hasta = typeof req.query.hasta === "string" ? req.query.hasta : undefined;

        const reporte = await reporteGrupo(grupo, desde, hasta);
        res.json(reporte);
    } catch (error: any) {
        console.error("ERROR admin reporteGrupoController:", error);
        res.status(500).json({ message: "No se pudo generar el reporte" });
    }
};

/**
 * @swagger
 * /admin/estadisticas:
 *   get:
 *     tags: [Admin]
 *     summary: Estadísticas globales de la plataforma
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Totales de usuarios, grupos, puntos y actividad
 */
export const estadisticasController = async (
    _req: RequestAutenticado,
    res: Response,
): Promise<void> => {
    try {
        const estadisticas = await estadisticasGlobales();
        res.json(estadisticas);
    } catch (error: any) {
        console.error("ERROR estadisticasController:", error);
        res.status(500).json({ message: "No se pudieron calcular las estadísticas" });
    }
};
