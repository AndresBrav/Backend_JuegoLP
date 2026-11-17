import { GoogleGenAI } from "@google/genai";
import JuegosIA from "../Models/juegos_iaModel";
import {
    consumirRevisionIA,
    CuotaRevisionAgotadaError,
    EjercicioRevisionNoEncontradoError,
    obtenerCuotaRevisionIA,
} from "./cuotaRevisionIAServicio";
import { GeminiNoConfiguradoError } from "./generacionIAService";

interface NodoFlujo {
    id: string;
    type: string;
    label: string;
}

interface ConexionFlujo {
    source: string;
    target: string;
    label: string;
}

interface DiagramaReducido {
    nodes: NodoFlujo[];
    edges: ConexionFlujo[];
}

export class SolucionRevisionInvalidaError extends Error {}

const esRegistro = (
    valor: unknown,
): valor is Record<string, unknown> =>
    typeof valor === "object" && valor !== null && !Array.isArray(valor);

const reducirDiagrama = (valor: unknown): DiagramaReducido => {
    if (!esRegistro(valor)) {
        throw new SolucionRevisionInvalidaError(
            "El diagrama enviado no es válido.",
        );
    }

    const nodos = valor.nodes;
    const conexiones = valor.edges;
    if (
        !Array.isArray(nodos) ||
        nodos.length === 0 ||
        !Array.isArray(conexiones)
    ) {
        throw new SolucionRevisionInvalidaError(
            "El diagrama debe incluir nodos y conexiones válidos.",
        );
    }

    return {
        nodes: nodos.map((nodo) => {
            if (!esRegistro(nodo)) {
                throw new SolucionRevisionInvalidaError(
                    "El diagrama contiene un nodo no válido.",
                );
            }
            const datos = esRegistro(nodo.data) ? nodo.data : {};

            return {
                id: String(nodo.id ?? ""),
                type: typeof nodo.type === "string" ? nodo.type : "",
                label: typeof datos.label === "string" ? datos.label : "",
            };
        }),
        edges: conexiones.map((conexion) => {
            if (!esRegistro(conexion)) {
                throw new SolucionRevisionInvalidaError(
                    "El diagrama contiene una conexión no válida.",
                );
            }

            return {
                source: String(conexion.source ?? ""),
                target: String(conexion.target ?? ""),
                label:
                    typeof conexion.label === "string"
                        ? conexion.label
                        : "",
            };
        }),
    };
};

const obtenerEjercicioPropio = async (
    usuarioId: number,
    juegoId: number,
    tipoJuego: "ia" | "iapseudo",
) => {
    const juego = await JuegosIA.findOne({
        attributes: ["id", "descripcion"],
        where: { id: juegoId, usuario_id: usuarioId, tipo_juego: tipoJuego },
    });

    if (!juego) {
        throw new EjercicioRevisionNoEncontradoError(
            "No se encontró el ejercicio de IA.",
        );
    }

    return String(juego.descripcion ?? "");
};

const obtenerClienteGemini = (): GoogleGenAI => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new GeminiNoConfiguradoError(
            "La verificación con IA no está configurada.",
        );
    }

    return new GoogleGenAI({ apiKey });
};

export const consultarCuotaRevisionIA = obtenerCuotaRevisionIA;

export const verificarDiagramaIA = async (
    usuarioId: number,
    juegoId: number,
    diagramaRecibido: unknown,
) => {
    const diagrama = reducirDiagrama(diagramaRecibido);
    const ejercicio = await obtenerEjercicioPropio(usuarioId, juegoId, "ia");
    const ai = obtenerClienteGemini();
    const consumo = await consumirRevisionIA(usuarioId, juegoId);
    if (!consumo.permitida) {
        throw new CuotaRevisionAgotadaError(consumo.cuota);
    }

    const prompt = `
Eres un profesor experto en algoritmos y diagramas de flujo.

Tu tarea es verificar si el flujo lógico del diagrama cumple correctamente el ejercicio.

REGLAS IMPORTANTES:
- Analiza SOLO la lógica.
- Ignora posiciones x/y.
- Ignora diseño visual.
- Ignora estética.
- Analiza únicamente nodos y conexiones.
- No inventes errores inexistentes.
- Si la lógica cumple el ejercicio, responde que es correcto.

Debes verificar:
- inicio y fin correctos
- ciclos
- decisiones
- variables
- acumuladores
- contadores
- secuencia lógica

La respuesta debe:
- ser MUY corta
- máximo 3 oraciones
- sonar como un profesor experto
- indicar si es correcto o incorrecto
- mencionar solo el error más importante si existe

IMPORTANTE:
- Si el diagrama cumple el ejercicio, debes incluir obligatoriamente la palabra "correcto".
- Si el diagrama no cumple el ejercicio, debes incluir obligatoriamente la palabra "incorrecto".
- Nunca uses palabras ambiguas como "aceptable", "válido", "adecuado" o "cumple parcialmente" sin indicar además si es correcto o incorrecto.
- No respondas únicamente con "sí" o "no".
- La primera oración debe indicar claramente si el diagrama es correcto o incorrecto.

Ejemplos válidos:

"El diagrama es correcto y la lógica del ciclo está bien implementada."

"El diagrama es correcto porque cumple completamente el ejercicio."

"El diagrama es incorrecto porque el contador nunca se incrementa."

"El diagrama es incorrecto porque la condición de salida del ciclo no permite finalizar correctamente."

Ejercicio:
${ejercicio}

Diagrama:
${JSON.stringify(diagrama)}
`;
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
    });
    const resultado = response.text?.trim();
    if (!resultado) {
        throw new Error("Gemini no devolvió una revisión.");
    }

    return { resultado, cuota: consumo.cuota };
};

export const verificarPseudocodigoIA = async (
    usuarioId: number,
    juegoId: number,
    pseudocodigo: unknown,
) => {
    if (typeof pseudocodigo !== "string" || !pseudocodigo.trim()) {
        throw new SolucionRevisionInvalidaError(
            "El pseudocódigo enviado no es válido.",
        );
    }

    const ejercicio = await obtenerEjercicioPropio(
        usuarioId,
        juegoId,
        "iapseudo",
    );
    const ai = obtenerClienteGemini();
    const consumo = await consumirRevisionIA(usuarioId, juegoId);
    if (!consumo.permitida) {
        throw new CuotaRevisionAgotadaError(consumo.cuota);
    }

    const prompt = `
Eres un profesor experto en algoritmos y pseudocódigo.

Tu tarea es verificar si el pseudocódigo ingresado por el usuario resuelve correctamente el ejercicio planteado.

REGLAS IMPORTANTES:
- Analiza únicamente la lógica del pseudocódigo.
- El pseudocódigo debe estar en español.
- Puede utilizar palabras clave de PSeInt como:
  Algoritmo, Proceso, Definir, Escribir, Leer, Si, Entonces,
  SiNo, FinSi, Para, FinPara, Mientras, FinMientras,
  Repetir, Hasta Que, Segun, FinSegun, MOD, etc.
- Ignora diferencias menores en los nombres de las variables si la lógica es correcta.
- No inventes errores inexistentes.
- Si la lógica cumple el ejercicio, responde que es correcto.
- Verifica especialmente:
  - variables
  - condiciones
  - ciclos
  - contadores
  - acumuladores
  - operadores
  - cálculos
  - secuencia lógica
  - cantidad de repeticiones
  - condiciones de salida
- No exijas una estructura específica si existen diferentes formas
  correctas de resolver el ejercicio.

La respuesta debe:
- ser MUY corta.
- máximo 3 oraciones.
- sonar como un profesor experto.
- indicar claramente si es correcto o incorrecto.
- mencionar solo el error más importante si existe.

IMPORTANTE:
- Si el pseudocódigo cumple el ejercicio, debes incluir obligatoriamente la palabra "correcto".
- Si el pseudocódigo no cumple el ejercicio, debes incluir obligatoriamente la palabra "incorrecto".
- Nunca uses palabras ambiguas como "aceptable", "válido",
  "adecuado" o "cumple parcialmente" sin indicar además
  si es correcto o incorrecto.
- No respondas únicamente con "sí" o "no".
- La primera oración debe indicar claramente si el pseudocódigo
  es correcto o incorrecto.

Ejemplos válidos:

"El pseudocódigo es correcto y cumple la lógica solicitada."

"El pseudocódigo es correcto porque cuenta correctamente los intentos fallidos."

"El pseudocódigo es incorrecto porque no incrementa el contador de intentos fallidos."

"El pseudocódigo es incorrecto porque el ciclo permite más de 3 intentos."

Ejercicio:
${ejercicio}

Pseudocódigo del usuario:
${pseudocodigo}
`;
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
    });
    const resultado = response.text?.trim();
    if (!resultado) {
        throw new Error("Gemini no devolvió una revisión.");
    }

    return { resultado, cuota: consumo.cuota };
};
