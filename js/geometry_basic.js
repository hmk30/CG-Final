import { Geometry } from "gl_geometry";

// ---------------------------------------------------------------------------- 
// Basic Geometry
// ----------------------------------------------------------------------------




export function createGeometryQuad(gl) {

    let quad_data = {
        vertices : [
            0.0,0.0,3.0,  1.0,0.0,3.0,  1.0,1.0,3.0,  0.0,1.0,3.0,
        ],
        normals : [
            0.0,0.0,1.0,  0.0,0.0,1.0,  0.0,0.0,1.0,  0.0,0.0,1.0,
        ],
        texcoord : [
            0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
        ],
        indices : [
            0, 1, 2,  0, 2, 3,
        ]
    }

    let quad = new Geometry(gl.TRIANGLES);
    quad.addArray("a_Position", new Float32Array(quad_data.vertices));
    quad.addArray("a_Normal", new Float32Array(quad_data.normals));
    quad.addArray("a_TexCoord", new Float32Array(quad_data.texcoord));
    quad.setElements(new Uint8Array(quad_data.indices), gl.UNSIGNED_BYTE, quad_data.indices.length);

    return quad;
}


export function createGeometryPlane(gl) {

    let plane_data = {
        vertices : [
            -5.0,-0.001,-5.0,  +5.0,-0.001,-5.0,  +5.0,-0.001,+5.0,  -5.0,-0.001,+5.0,
        ],
        normals : [
            0.0,1.0,0.0,  0.0,1.0,0.0,  0.0,1.0,0.0,  0.0,1.0,0.0,
        ],
        texcoord : [
            0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0,
        ],
        indices : [
            2, 1, 0,  3, 2, 0,
        ]
    }

    let plane = new Geometry(gl.TRIANGLES);
    plane.addArray("a_Position", new Float32Array(plane_data.vertices));
    plane.addArray("a_Normal", new Float32Array(plane_data.normals));
    plane.addArray("a_TexCoord", new Float32Array(plane_data.texcoord));
    plane.setElements(new Uint8Array(plane_data.indices), gl.UNSIGNED_BYTE, plane_data.indices.length);

    return plane;
}




