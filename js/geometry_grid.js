import { Geometry } from "gl_geometry";

// ---------------------------------------------------------------------------- 
// Geometry for Grid
// ----------------------------------------------------------------------------

function create_grid_vertices() {

    let grid = {
        bounds : {
            a : { lower : -5, upper : 5 },
            b : { lower : -5, upper : 5 }
        },
        spacing : {
            a : 1.0,
            b : 1.0,
        }
    }

    let aL = Math.trunc(grid.bounds.a.lower / grid.spacing.a);
    let aH = Math.trunc(grid.bounds.a.upper / grid.spacing.a);
    let bL = Math.trunc(grid.bounds.b.lower / grid.spacing.b);
    let bH = Math.trunc(grid.bounds.b.upper / grid.spacing.b);

    if (aL>aH) { [aL,aH] = [aH,aL]; }
    if (bL>bH) { [bL,bH] = [bH,bL]; }
    let nA = aH - aL + 1;
    let nB = bH - bL + 1;

    let vs = new Float32Array(6*(nA+nB));

    let k = 0;
    for (let i=aL; i<=aH; ++i) {
        vs[k++] = i*grid.spacing.a;
        vs[k++] = 0.0;
        vs[k++] = grid.bounds.b.lower;
        vs[k++] = i*grid.spacing.a;
        vs[k++] = 0.0;
        vs[k++] = grid.bounds.b.upper;
    }
    for (let j=bL; j<=bH; ++j) {
        vs[k++] = grid.bounds.a.lower;
        vs[k++] = 0.0;
        vs[k++] = j*grid.spacing.b;
        vs[k++] = grid.bounds.a.upper;
        vs[k++] = 0.0;
        vs[k++] = j*grid.spacing.b;
    }

    grid.vertices = vs;

    return vs;
}


export function createGeometryGrid(gl) {

    let grid_vertices = create_grid_vertices();
    let grid = new Geometry(gl.LINES);
    grid.addArray("a_Position", grid_vertices);
    grid.setArrayCount(44)

    return grid;
}


