import { Geometry } from "gl_geometry";

// ---------------------------------------------------------------------------- 
// Geometry of Tiny House in 3D, 
//   x,z is ground plane, y is height
// ----------------------------------------------------------------------------

let irt = 1.0 / Math.sqrt(2.0); // irrational 

let tinyHouse = {
    vertices : [
        0.0,0.0,0.0,  1.0,0.0,0.0,  1.0,0.0,1.0,  0.0,0.0,1.0, // base
        1.0,0.0,0.0,  1.0,1.0,0.0,  1.0,1.0,1.0,  1.0,0.0,1.0, // right side
        0.0,0.0,0.0,  0.0,0.0,1.0,  0.0,1.0,1.0,  0.0,1.0,0.0, // left side
        1.0,1.0,0.0,  0.5,1.5,0.0,  0.5,1.5,1.0,  1.0,1.0,1.0, // right roof
        0.0,1.0,0.0,  0.0,1.0,1.0,  0.5,1.5,1.0,  0.5,1.5,0.0, // left roof
        0.0,0.0,1.0,  1.0,0.0,1.0,  1.0,1.0,1.0,  0.5,1.5,1.0, 0.0,1.0,1.0, // front
        0.0,0.0,0.0,  0.0,1.0,0.0,  0.5,1.5,0.0,  1.0,1.0,0.0, 1.0,0.0,0.0, // back
    ],
    normals : [
        0.0,-1.0,0.0, 0.0,-1.0,0.0, 0.0,-1.0,0.0, 0.0,-1.0,0.0, // base
        +1.0,0.0,0.0, +1.0,0.0,0.0, +1.0,0.0,0.0, +1.0,0.0,0.0, // right side
        -1.0,0.0,0.0, -1.0,0.0,0.0, -1.0,0.0,0.0, -1.0,0.0,0.0, // left side
        +irt,irt,0.0, +irt,irt,0.0, +irt,irt,0.0, +irt,irt,0.0, // right roof
        -irt,irt,0.0, -irt,irt,0.0, -irt,irt,0.0, -irt,irt,0.0, // left roof
        0.0,0.0,+1.0, 0.0,0.0,+1.0,  0.0,0.0,+1.0,  0.0,0.0,+1.0, 0.0,0.0,+1.0, // front
        0.0,0.0,-1.0, 0.0,0.0,-1.0,  0.0,0.0,-1.0,  0.0,0.0,-1.0, 0.0,0.0,-1.0, // back 
    ],
    indices_triangles : [
         0,  1,  2,    0,  2,  3,              // base
         4,  5,  6,    4,  6,  7,              // right side
         8,  9, 10,    8, 10, 11,              // left side
        12, 13, 14,   12, 14, 15,              // right roof
        16, 17, 18,   16, 18, 19,              // left roof
        20, 21, 22,   20, 22, 24,  22, 23, 24, // front 
        25, 26, 27,   27, 28, 29,  25, 27, 29, // back 
    ],
    indices_outlines : [
          0, 1,   1, 2,   2, 3,   3, 0,         // base
          4, 5,   5, 6,   6, 7,   7, 4,         // right side
          8, 9,   9,10,  10,11,  11, 8,         // left side
         12,13,  13,14,  14,15,  15,12,         // right roof
         16,17,  17,18,  18,19,  19,16,         // left roof
         20,21,  21,22,  22,23,  23,24,  24,20, // front
         25,26,  26,27,  27,28,  28,29,  29,25  // back
    ]
}

export function createGeometryHouse(gl) {

    let house = new Geometry(gl.TRIANGLES);
    house.addArray("a_Position", new Float32Array(tinyHouse.vertices));
    house.addArray("a_Normal", new Float32Array(tinyHouse.normals));
    house.setElements(
        new Uint8Array(tinyHouse.indices_triangles),
        gl.UNSIGNED_BYTE,
        tinyHouse.indices_triangles.length,
    );

    return house;
}


export function createGeometryHouseWires(gl) {

    let house_wires = new Geometry(gl.LINES);
    house_wires.addArray("a_Position", new Float32Array(tinyHouse.vertices));
    house_wires.addArray("a_Normal", new Float32Array(tinyHouse.normals));
    house_wires.setElements(
        new Uint8Array(tinyHouse.indices_outlines),
        gl.UNSIGNED_BYTE,
        tinyHouse.indices_outlines.length
    );

    return house_wires;
}

