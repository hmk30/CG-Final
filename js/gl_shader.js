export const SHADER_TYPE = {
    VERTEX : "VERTEX_SHADER",
    FRAGMENT : "FRAGMENT_SHADER"
}

export class Shader {
    static get TYPE() { return SHADER_TYPE; }

    constructor(type, source) {
        this.type = type;
        this.source = source;
        this.is_compiled = false;
    }
}

export class Program {

    constructor(vertex_shader, fragment_shader) {
        this.vertex_shader = vertex_shader;
        this.fragment_shader = fragment_shader;
        this.is_compiled = false;
        this.attributes = { };
        this.uniforms = { };
        this.funcRenderGeometry = null;
    }

    isCompiled() { return is_compiled; }

    setRenderGeometryFunc(func) { this.funcRenderGeometry = func; }
    canRenderGeometry() { return this.funcRenderGeometry != null; }
    renderGeometry(gl, geometry) { this.funcRenderGeometry(gl, this, geometry); }
}


export async function fetchShader(path) {
    let code = null;
    try {
        let response = await fetch(path);
        code = await response.text();
    } catch (error) {
        console.log(`${error}`);
    }
    return code;
}


export async function loadShaderProgram(path_vertex, path_fragment) {

    let code_vertex = await fetchShader(path_vertex);
    let code_fragment = await fetchShader(path_fragment);

    if (!code_vertex) {
        console.log(`[error]: Can't load vertex shader ${path_vertex}.`);
        return null;
    }
    if (!code_fragment) {
        console.log(`[error]: Can't load vertex shader ${path_fragment}.`);
        return null;
    }

    let program = new Program(
        new Shader(Shader.TYPE.VERTEX, code_vertex),
        new Shader(Shader.TYPE.FRAGMENT, code_fragment),
    );

    return program;
}





