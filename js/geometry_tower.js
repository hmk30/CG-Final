import { Geometry } from "gl_geometry";

// ----------------------------------------------------------------------------
// Geometry for Tower
// ----------------------------------------------------------------------------

function create_tower() {
    let n_sides = 8;  // at least 3
    let y_profile = [  // x (radius), y (height)
        [0.0, 0.0], // 0
        [0.6, 0.0],

        [0.6, 0.0], // 1
        [0.6, 0.2],
        [0.6, 0.2], // 2
        [0.6, 0.4],
        [0.6, 0.4], // 3
        [0.6, 0.6],
        [0.6, 0.6], // 4
        [0.6, 0.8],
        [0.6, 0.8], // 5
        [0.6, 1.0],
        [0.6, 1.0], // 6
        [0.6, 1.2],
        [0.6, 1.2], // 7
        [0.6, 1.4],
        [0.6, 1.4], // 8
        [0.6, 1.6],
        [0.6, 1.6], // 9
        [0.6, 1.8],

        [0.6, 1.8], // 10
        [0.4, 2.0],
        [0.4, 2.0], // 11
        [0.4, 2.3],
        [0.4, 2.3], // 12
        [0.0, 2.7]
    ];
    let y_normals = [ // along profile
        [0.0, -1.0], // 0
        [0.0, -1.0],

        [1.0,  0.0], // 1
        [1.0,  0.0],
        [1.0,  0.0], // 2
        [1.0,  0.0],
        [1.0,  0.0], // 3
        [1.0,  0.0],
        [1.0,  0.0], // 4
        [1.0,  0.0],
        [1.0,  0.0], // 5
        [1.0,  0.0],
        [1.0,  0.0], // 6
        [1.0,  0.0],
        [1.0,  0.0], // 7
        [1.0,  0.0],
        [1.0,  0.0], // 8
        [1.0,  0.0],
        [1.0,  0.0], // 9
        [1.0,  0.0],

        [1.0,  1.0],
        [1.0,  1.0],
        [1.0,  0.0],
        [1.0,  0.0],
        [1.0,  1.0],
        [1.0,  1.0],
    ];
    let n_rings = y_profile.length; // at least 4

    let n_vertices = n_rings*n_sides;

    let tower = {
        vxs : new Float32Array(3 * n_vertices), // vertices
        nms  : new Float32Array(3 * n_vertices), // normals
        idxs : new Uint16Array((3*n_rings-1)*n_sides), // triangle idxs
        idx_rings : new Uint16Array(8*n_sides + 6*n_sides + 6*n_sides)
    };
    let t = tower;

    let angle_part = (Math.PI * 2.0) / n_sides;
    let n_sidesX3 = 3*n_sides;
    let n_sidesX6 = 6*n_sides;

    // loop over all vertices in rings
    for (let i=0; i<n_sides; ++i) {
        let angle = i*angle_part;
        let [cosA, sinA] = [Math.cos(angle), Math.sin(angle)];

        // loop over rings
        let u = 3*i; // idx_vertex in array
        for (let k=0; k<n_rings; ++k) {
            let [r, h] = [y_profile[k][0], y_profile[k][1]];
            let [nx, ny] = [y_normals[k][0], y_normals[k][1]];
            let [vxA, vyA, vzA] = [r*cosA, h, r*sinA];
            let [nxA, nyA, nzA] = [nx*cosA, ny, nx*sinA];
            t.vxs[u+0] = vxA; t.vxs[u+1] = vyA; t.vxs[u+2] = vzA;
            t.nms[u+0] = nxA; t.nms[u+1] = nyA; t.nms[u+2] = nzA;
            u += n_sidesX3; // goto next higher ring
        }

        // bottom and top faces
        let iX3 = i*3;
        let iP1 = (i+1) % n_sides;
        t.idxs[iX3+0] = i; // ring 1 vertex i+1
        t.idxs[iX3+1] = n_sides + i; // ring 1 vertex i
        t.idxs[iX3+2] = n_sides + iP1; // ring 0 vertex i
        t.idxs[n_sidesX3+iX3+0] = (n_rings-2)*n_sides + iP1; // R n-2 V i+1
        t.idxs[n_sidesX3+iX3+1] = (n_rings-2)*n_sides + i; // R n-2 V i
        t.idxs[n_sidesX3+iX3+2] = (n_rings-1)*n_sides; // R n-1 V i

        // remaining faces
        let iX6 = i*6;
        for (let k=2; k<n_rings-2; k+=2) {
            let idx0 = k*n_sides + i;
            let idx1 = (k+1)*n_sides + i;
            let idx2 = (k+1)*n_sides + iP1;
            let idx3 = k*n_sides + iP1;

            t.idxs[k*n_sidesX3+iX6+0] = idx0;
            t.idxs[k*n_sidesX3+iX6+1] = idx1;
            t.idxs[k*n_sidesX3+iX6+2] = idx2;
            t.idxs[k*n_sidesX3+iX6+3] = idx0;
            t.idxs[k*n_sidesX3+iX6+4] = idx2;
            t.idxs[k*n_sidesX3+iX6+5] = idx3;
        }
    }

    console.log("n_rings=" + n_rings + " n_sides=" + n_sides);
    console.log("n_vertices=" + n_vertices + " [" + (4*3*n_vertices) + "bytes]");
    console.log("n_idxs = " + t.idxs.length);

    return tower;
}

export function createGeometryTower(gl) {

    // create tower model
    let tower = create_tower();
    let tower_geometry = new Geometry(gl.TRIANGLES);
    tower_geometry.addArray("a_Position", new Float32Array(tower.vxs));
    tower_geometry.addArray("a_Normal", new Float32Array(tower.nms));
    tower_geometry.setElements(
        new Uint16Array(tower.idxs),
        gl.UNSIGNED_SHORT,
        tower.idxs.length
    );

    return tower_geometry;
}
