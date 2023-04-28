export class Geometry {

    constructor(primitives_type) {
        this.primitives_type = primitives_type;   // WebGL primitive type
        this.buffers = { };             // JS buffer data
        this.buffers_gl = { };          // WebGL id of buffer
        this.elements = null;
        this.elements_type = null;
        this.elements_count = null;
        this.elements_gl = null;
        this.program = null;
    }

    addArray(attribute_name, data) {
        this.buffers[attribute_name] = data;
    }
    setArrayCount(array_count) {
        this.elements_count = array_count;
    }

    setElements(elements, elements_type, elements_count) {
        this.elements = elements;
        this.elements_type = elements_type;
        this.elements_count = elements_count;
    }
    hasElements() { return this.elements != null && this.elements_gl != null; }
    getElements() { return this.elements; }
    getElementsType() { return this.elements_type; }

    setProgram(program) { this.program = program; }
    getProgram() { return this.program; }
    hasProgram() { return this.program != null; }
}
