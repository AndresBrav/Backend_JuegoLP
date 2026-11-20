import { Response } from "express";
import { AuthenticatedRequest } from "../Middlewares/verifyToken";
import { RequestAutenticado } from "../Middlewares/cargarUsuarioActual";
import { obtenerUnUsuarioServicio } from "../Services/usuarioServices";
import { obtenerCuotaGeneracionIA } from "../Services/cuotaGeneracionIAServicio";
import {
    CuotaGeneracionAgotadaError,
    GeminiNoConfiguradoError,
    generarEjercicioIA,
    TemarioGeneracionInvalidoError,
} from "../Services/generacionIAService";
import type { TipoGeneracionIA } from "../Services/generacionIAService";
import {
    CuotaRevisionAgotadaError,
    EjercicioRevisionNoEncontradoError,
} from "../Services/cuotaRevisionIAServicio";
import {
    consultarCuotaRevisionIA,
    SolucionRevisionInvalidaError,
    verificarDiagramaIA,
    verificarPseudocodigoIA,
} from "../Services/verificacionIAService";
import {
    obtenerTodosLosJuegosIA,
    guardarJuegoIA,
    obtenerTodosLosJuegosIAPseudo,
    completarJuegoIA,
    obtenerJuegoIAPorId,
    guardarEstadoTableroJuegoIA,
    reiniciarEstadoTableroJuegoIA,
    obtenerTemariosIA,
} from "../Services/juegosiaServicios";

/**
 * @swagger
 * /juegos/cuota-generacion-ia:
 *   get:
 *     tags: [Juegos IA]
 *     summary: Consultar el uso diario de generación IA del estudiante
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cuota diaria actual; es null para roles sin límite
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cuota:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     limite:
 *                       type: integer
 *                       example: 5
 *                     usados:
 *                       type: integer
 *                     restantes:
 *                       type: integer
 *                     fecha:
 *                       type: string
 *                       format: date
 *       401:
 *         description: Usuario no autenticado
 *       500:
 *         description: Error al consultar la cuota
 */
const obtenerCuotaGeneracionIAController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    try {
        if (!req.usuarioActual) {
            res.status(401).json({ msg: "Usuario no autenticado" });
            return;
        }

        const cuota =
            req.usuarioActual.rol === "estudiante"
                ? await obtenerCuotaGeneracionIA(req.usuarioActual.id)
                : null;
        res.json({ cuota });
    } catch (error) {
        console.error("Error al consultar cuota de generación IA:", error);
        res.status(500).json({ msg: "No se pudo consultar la cuota diaria." });
    }
};

/**
 * @swagger
 * /juegos/generar-ejercicio-ia:
 *   post:
 *     tags: [Juegos IA]
 *     summary: Generar un ejercicio de diagrama o pseudocódigo con IA
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo_juego]
 *             properties:
 *               tipo_juego:
 *                 type: string
 *                 enum: [ia, iapseudo]
 *               temario_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ejercicio generado y cuota actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ejercicio:
 *                   type: string
 *                 cuota:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     limite:
 *                       type: integer
 *                     usados:
 *                       type: integer
 *                     restantes:
 *                       type: integer
 *                     fecha:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Tipo de ejercicio o temario no válido
 *       429:
 *         description: Se alcanzó el límite diario de 5 generaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 cuota:
 *                   type: object
 *                   properties:
 *                     limite:
 *                       type: integer
 *                     usados:
 *                       type: integer
 *                     restantes:
 *                       type: integer
 *                     fecha:
 *                       type: string
 *                       format: date
 *       502:
 *         description: No se pudo obtener un ejercicio de Gemini
 */
const generarEjercicioIAController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    if (!req.usuarioActual) {
        res.status(401).json({ msg: "Usuario no autenticado" });
        return;
    }

    const tipo: TipoGeneracionIA = req.body?.tipo_juego;
    if (tipo !== "ia" && tipo !== "iapseudo") {
        res.status(400).json({ msg: "tipo_juego debe ser ia o iapseudo." });
        return;
    }

    let temarioId: number | undefined;
    if (req.body?.temario_id !== undefined && req.body.temario_id !== null) {
        temarioId = Number(req.body.temario_id);
        if (!Number.isInteger(temarioId) || temarioId <= 0) {
            res.status(400).json({ msg: "temario_id no es válido." });
            return;
        }
    }

    try {
        const resultado = await generarEjercicioIA(
            req.usuarioActual.id,
            req.usuarioActual.rol,
            tipo,
            temarioId,
        );
        res.json(resultado);
    } catch (error) {
        if (error instanceof CuotaGeneracionAgotadaError) {
            res.status(429).json({
                msg: error.message,
                cuota: error.cuota,
            });
            return;
        }

        if (error instanceof TemarioGeneracionInvalidoError) {
            res.status(400).json({ msg: error.message });
            return;
        }

        if (error instanceof GeminiNoConfiguradoError) {
            res.status(500).json({ msg: error.message });
            return;
        }

        console.error("Error al generar ejercicio con IA:", error);
        res.status(502).json({
            msg: "No se pudo generar el ejercicio. Intenta de nuevo.",
        });
    }
};

/**
 * @swagger
 * /juegos/ia/{id}/cuota-revision:
 *   get:
 *     tags: [Juegos IA]
 *     summary: Consultar los intentos de revisión restantes para un ejercicio IA
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
 *         description: Cuota diaria del ejercicio
 *       404:
 *         description: Ejercicio IA no encontrado
 *       500:
 *         description: Error al consultar la cuota
 */
const obtenerCuotaRevisionIAController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    if (!req.usuarioActual) {
        res.status(401).json({ msg: "Usuario no autenticado" });
        return;
    }

    const juegoId = Number(req.params.id);
    if (!Number.isInteger(juegoId) || juegoId <= 0) {
        res.status(400).json({ msg: "id de ejercicio no válido." });
        return;
    }

    try {
        const cuota = await consultarCuotaRevisionIA(
            req.usuarioActual.id,
            juegoId,
        );
        res.json({ cuota });
    } catch (error) {
        if (error instanceof EjercicioRevisionNoEncontradoError) {
            res.status(404).json({ msg: error.message });
            return;
        }
        console.error("Error al consultar cuota de revisión IA:", error);
        res.status(500).json({ msg: "No se pudo consultar la cuota diaria." });
    }
};

/**
 * @swagger
 * /juegos/ia/{id}/revisar-diagrama:
 *   post:
 *     tags: [Juegos IA]
 *     summary: Revisar con IA el diagrama de un ejercicio propio
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
 *             required: [diagrama]
 *             properties:
 *               diagrama:
 *                 type: object
 *     responses:
 *       200:
 *         description: Resultado de revisión y cuota actualizada
 *       400:
 *         description: Diagrama no válido
 *       404:
 *         description: Ejercicio IA no encontrado
 *       429:
 *         description: Se alcanzaron los 5 intentos diarios de este ejercicio
 *       502:
 *         description: No se pudo obtener la revisión de Gemini
 */
const verificarDiagramaIAController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    if (!req.usuarioActual) {
        res.status(401).json({ msg: "Usuario no autenticado" });
        return;
    }

    const juegoId = Number(req.params.id);
    if (!Number.isInteger(juegoId) || juegoId <= 0) {
        res.status(400).json({ msg: "id de ejercicio no válido." });
        return;
    }

    try {
        const resultado = await verificarDiagramaIA(
            req.usuarioActual.id,
            juegoId,
            req.body?.diagrama,
        );
        res.json(resultado);
    } catch (error) {
        if (error instanceof SolucionRevisionInvalidaError) {
            res.status(400).json({ msg: error.message });
            return;
        }
        if (error instanceof EjercicioRevisionNoEncontradoError) {
            res.status(404).json({ msg: error.message });
            return;
        }
        if (error instanceof CuotaRevisionAgotadaError) {
            res.status(429).json({
                msg: error.message,
                cuota: error.cuota,
            });
            return;
        }
        if (error instanceof GeminiNoConfiguradoError) {
            res.status(500).json({ msg: error.message });
            return;
        }

        console.error("Error al verificar diagrama con IA:", error);
        res.status(502).json({
            msg: "No se pudo verificar el diagrama. Intenta de nuevo.",
        });
    }
};

/**
 * @swagger
 * /juegos/ia/{id}/revisar-pseudocodigo:
 *   post:
 *     tags: [Juegos IA]
 *     summary: Revisar con IA el pseudocódigo de un ejercicio propio
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
 *             required: [pseudocodigo]
 *             properties:
 *               pseudocodigo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado de revisión y cuota actualizada
 *       400:
 *         description: Pseudocódigo no válido
 *       404:
 *         description: Ejercicio IA no encontrado
 *       429:
 *         description: Se alcanzaron los 5 intentos diarios de este ejercicio
 *       502:
 *         description: No se pudo obtener la revisión de Gemini
 */
const verificarPseudocodigoIAController = async (
    req: RequestAutenticado,
    res: Response,
) => {
    if (!req.usuarioActual) {
        res.status(401).json({ msg: "Usuario no autenticado" });
        return;
    }

    const juegoId = Number(req.params.id);
    if (!Number.isInteger(juegoId) || juegoId <= 0) {
        res.status(400).json({ msg: "id de ejercicio no válido." });
        return;
    }

    try {
        const resultado = await verificarPseudocodigoIA(
            req.usuarioActual.id,
            juegoId,
            req.body?.pseudocodigo,
        );
        res.json(resultado);
    } catch (error) {
        if (error instanceof SolucionRevisionInvalidaError) {
            res.status(400).json({ msg: error.message });
            return;
        }
        if (error instanceof EjercicioRevisionNoEncontradoError) {
            res.status(404).json({ msg: error.message });
            return;
        }
        if (error instanceof CuotaRevisionAgotadaError) {
            res.status(429).json({
                msg: error.message,
                cuota: error.cuota,
            });
            return;
        }
        if (error instanceof GeminiNoConfiguradoError) {
            res.status(500).json({ msg: error.message });
            return;
        }

        console.error("Error al verificar pseudocódigo con IA:", error);
        res.status(502).json({
            msg: "No se pudo verificar el pseudocódigo. Intenta de nuevo.",
        });
    }
};

/**
 * @swagger
 * /juegos/temarios:
 *   get:
 *     tags: [Juegos IA]
 *     summary: Listar los temarios globales de ejercicios IA
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de temarios IA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 temarios:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       orden:
 *                         type: integer
 *       401:
 *         description: Token no valido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const traerTemariosIAController = async (
    _req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const temarios = await obtenerTemariosIA();
        res.json({ temarios });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/traerJuegosConIA:
 *   get:
 *     tags: [Juegos IA]
 *     summary: Listar los juegos de IA guardados del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de juegos IA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 juegosIA:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JuegosIA'
 *                 msg:
 *                   type: string
 *       401:
 *         description: Token no valido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const traerJuegosController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const usuario = await obtenerUnUsuarioServicio(
            req.DatosToken?.id,
            req.DatosToken?.username,
        );
        const usuario_id = usuario.id;

        const juegosIA = await obtenerTodosLosJuegosIA(usuario_id); //llama al Servicio
        console.log(juegosIA);
        res.json({
            juegosIA: juegosIA,
            msg: "esta es la lista de juegos con IA que se guardo",
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/traerJuegosConIAPseudo:
 *   get:
 *     tags: [Juegos IA]
 *     summary: Listar los juegos IA (pseudo) guardados del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de juegos IA pseudo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 juegosIA:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JuegosIA'
 *                 msg:
 *                   type: string
 *       401:
 *         description: Token no valido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const traerJuegosControllerPseudo = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const usuario = await obtenerUnUsuarioServicio(
            req.DatosToken?.id,
            req.DatosToken?.username,
        );
        const usuario_id = usuario.id;

        const juegosIA = await obtenerTodosLosJuegosIAPseudo(usuario_id); //llama al Servicio
        console.log(juegosIA);
        res.json({
            juegosIA: juegosIA,
            msg: "esta es la lista de juegos con IA que se guardo",
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/guardarjuegoIA:
 *   post:
 *     tags: [Juegos IA]
 *     summary: Guardar un nuevo juego generado con IA
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descripcion
 *               - tipo_juego
 *             properties:
 *               descripcion:
 *                 type: string
 *               tipo_juego:
 *                 type: string
 *                 enum: [ia, iapseudo]
 *               completado:
 *                 type: boolean
 *               puntos:
 *                 type: integer
 *               temario_id:
 *                 type: integer
 *                 description: Aplica a ejercicios de tipo ia e iapseudo
 *     responses:
 *       201:
 *         description: Juego IA guardado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Juego IA guardado correctamente
 *                 juegoIA:
 *                   $ref: '#/components/schemas/JuegosIA'
 *       400:
 *         description: descripcion y tipo_juego son requeridos
 *       401:
 *         description: Token no valido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const guardarJuegoIAController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const usuario = await obtenerUnUsuarioServicio(
            req.DatosToken?.id,
            req.DatosToken?.username,
        );
        const usuario_id = usuario.id;

        const {
            descripcion,
            tipo_juego,
            completado,
            puntos,
            temario_id,
        } = req.body;

        if (!descripcion || !tipo_juego) {
            res.status(400).json({
                msg: "descripcion y tipo_juego son requeridos",
            });
            return;
        }

        const juegoIA = await guardarJuegoIA(
            usuario_id,
            descripcion,
            tipo_juego,
            completado,
            puntos,
            temario_id ? Number(temario_id) : undefined,
        );

        res.status(201).json({
            msg: "Juego IA guardado correctamente",
            juegoIA,
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/completar/{id}:
 *   put:
 *     tags: [Juegos IA]
 *     summary: Marcar un juego IA como completado e incrementar puntos
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador del juego IA
 *     responses:
 *       200:
 *         description: Juego actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Juego actualizado correctamente
 *                 juego:
 *                   $ref: '#/components/schemas/JuegosIA'
 *       400:
 *         description: id de juego invalido
 *       401:
 *         description: Token no valido
 *       403:
 *         description: Acceso denegado (sin token)
 *       500:
 *         description: Error interno
 */
const completarJuegoController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const usuario = await obtenerUnUsuarioServicio(
            req.DatosToken?.id,
            req.DatosToken?.username,
        );
        const usuario_id = usuario.id;

        const juego_id = Number(req.params.id);
        if (isNaN(juego_id)) {
            res.status(400).json({ msg: "id de juego invalido" });
            return;
        }

        const juegoActualizado = await completarJuegoIA(usuario_id, juego_id);

        res.json({
            msg: "Juego actualizado correctamente",
            juego: juegoActualizado,
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/ia/{id}:
 *   get:
 *     tags: [Juegos IA]
 *     summary: Obtener un juego IA por ID con su estado del tablero
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del juego IA
 *     responses:
 *       200:
 *         description: Datos del juego IA
 *       400:
 *         description: ID de juego invalido
 *       404:
 *         description: Juego no encontrado
 *       500:
 *         description: Error interno
 */
const obtenerJuegoIAController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const usuario = await obtenerUnUsuarioServicio(
            req.DatosToken?.id,
            req.DatosToken?.username,
        );
        const usuario_id = usuario.id;

        const juego_id = Number(req.params.id);
        if (isNaN(juego_id)) {
            res.status(400).json({ msg: "id de juego invalido" });
            return;
        }

        const juego = await obtenerJuegoIAPorId(usuario_id, juego_id);
        if (!juego) {
            res.status(404).json({ msg: "Juego no encontrado" });
            return;
        }

        res.json({ juego });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/guardarTablero/{id}:
 *   put:
 *     tags: [Juegos IA]
 *     summary: Guardar el progreso y estado del tablero de un juego IA
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del juego IA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado_tablero:
 *                 type: string
 *                 description: JSON serializado con el estado del tablero
 *     responses:
 *       200:
 *         description: Progreso del tablero guardado correctamente
 *       400:
 *         description: ID de juego invalido
 *       404:
 *         description: Juego no encontrado
 *       500:
 *         description: Error interno
 */
const guardarEstadoTableroController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const usuario = await obtenerUnUsuarioServicio(
            req.DatosToken?.id,
            req.DatosToken?.username,
        );
        const usuario_id = usuario.id;

        const juego_id = Number(req.params.id);
        if (isNaN(juego_id)) {
            res.status(400).json({ msg: "id de juego invalido" });
            return;
        }

        const { estado_tablero } = req.body;
        const estadoString =
            estado_tablero === null
                ? null
                : typeof estado_tablero === "object"
                  ? JSON.stringify(estado_tablero)
                  : String(estado_tablero ?? "");

        const juegoActualizado = await guardarEstadoTableroJuegoIA(
            usuario_id,
            juego_id,
            estadoString,
        );

        res.json({
            msg: "Progreso del tablero guardado correctamente",
            juego: juegoActualizado,
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

/**
 * @swagger
 * /juegos/reiniciarTablero/{id}:
 *   put:
 *     tags: [Juegos IA]
 *     summary: Restablecer el estado del tablero de un juego IA a su inicio
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del juego IA
 *     responses:
 *       200:
 *         description: Tablero del juego IA reiniciado correctamente
 *       400:
 *         description: ID de juego inválido
 *       404:
 *         description: Juego no encontrado
 *       500:
 *         description: Error interno
 */
const reiniciarEstadoTableroController = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
        const usuario = await obtenerUnUsuarioServicio(
            req.DatosToken?.id,
            req.DatosToken?.username,
        );
        const usuario_id = usuario.id;

        const juego_id = Number(req.params.id);
        if (isNaN(juego_id)) {
            res.status(400).json({ msg: "id de juego inválido" });
            return;
        }

        const juegoActualizado = await reiniciarEstadoTableroJuegoIA(
            usuario_id,
            juego_id,
        );

        res.json({
            msg: "Estado del tablero reiniciado correctamente",
            juego: juegoActualizado,
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

export {
    obtenerCuotaGeneracionIAController,
    generarEjercicioIAController,
    obtenerCuotaRevisionIAController,
    verificarDiagramaIAController,
    verificarPseudocodigoIAController,
    traerTemariosIAController,
    traerJuegosController,
    guardarJuegoIAController,
    completarJuegoController,
    traerJuegosControllerPseudo,
    obtenerJuegoIAController,
    guardarEstadoTableroController,
    reiniciarEstadoTableroController,
};
