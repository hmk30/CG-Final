import { Geometry } from "gl_geometry";

export async function loadGLTF(path_gltf) {
  let gltf;
  try {
    let response = await fetch(path_gltf);
    gltf = await response.json();
  } catch (error) {
    console.log(`GLTF-loader [error]: ${error}`);
    return null;
  }

  // print just mesh information
  console.log(`GLTF-loader [info]: Loading ${path_gltf} ...`);
  console.log(`  num_meshes: ${gltf.meshes.length}`);
  console.log(`  num_accessors: ${gltf.accessors.length}`);
  console.log(`  num_bufferViews: ${gltf.bufferViews.length}`);
  console.log(`  num_buffers: ${gltf.buffers.length}`);

  // decode buffers' data URIs
  for (let buffer of gltf.buffers) {
    try {
      let response = await fetch(buffer.uri);
      let blob = await response.blob();
      buffer.data = await blob.arrayBuffer();
    } catch (error) {
      console.log(`GLTF-loader [error]: ${error}`);
      return null;
    }
    console.log(`    buffer bytes=${buffer.byteLength}`);
    console.log(`    buffer data_bytes=${buffer.data.byteLength}`);
  }
  console.log(`  All data URIs decoded.`);

  return gltf;
}

export async function createGeometryGLTF(gl, gltf, idx_mesh) {
  console.log(`GLTF-to-Geometry [info]: create geometry from mesh ${idx_mesh}`);

  let mesh = gltf.meshes[idx_mesh];
  if (!mesh) {
    return null;
  }

  console.log("MESH:", mesh);

  // restrict to first primitives entry
  //   and get accessor indices (acc_idx)
  let primitives = mesh.primitives[0];
  let acc_idx_position = mesh.primitives[0].attributes["POSITION"];
  let acc_idx_normal = mesh.primitives[0].attributes["NORMAL"];
  let acc_idx_texcoord_0 = mesh.primitives[0].attributes["TEXCOORD_0"];
  let acc_idx_indices = mesh.primitives[0].indices;

  // get accessor for each attribute and indices
  let acc_position = gltf.accessors[acc_idx_position];
  let acc_normal = gltf.accessors[acc_idx_normal];
  let acc_texcoord_0 = gltf.accessors[acc_idx_texcoord_0];
  let acc_indices = gltf.accessors[acc_idx_indices];

  // create corresponding buffer views
  let view_position = gltf.bufferViews[acc_position.bufferView];
  let view_normal = gltf.bufferViews[acc_normal.bufferView];
  let view_texcoord_0 = gltf.bufferViews[acc_texcoord_0.bufferView];
  let view_indices = gltf.bufferViews[acc_indices.bufferView];

  // do some checks
  let types_correct =
    acc_position.componentType == gl.FLOAT && // Float32Array
    acc_normal.componentType == gl.FLOAT && // Float32Array
    acc_texcoord_0.componentType == gl.FLOAT && // Float32Array
    acc_indices.componentType == gl.UNSIGNED_SHORT; // Uint16Array
  if (!types_correct) {
    console.log(`GLTF-to-Geometry [error]: Unexpected buffer types!`);
  }

  let same_buffer =
    view_position.buffer == 0 &&
    view_normal.buffer == 0 &&
    view_texcoord_0.buffer == 0 &&
    view_indices.buffer == 0;
  if (!same_buffer) {
    console.log(`GLTF-to-Geometry [error]: More than one underlying buffer!`);
  }

  // assume it is always the one ArrayBuffer
  let buffer = gltf.buffers[0].data;

  console.log("BUFFER:", buffer);

  // use accessors and buffer views to create typed arrays
  let positions = new Float32Array(buffer, view_position.byteOffset, view_position.byteLength / 4);
  let normals = new Float32Array(buffer, view_normal.byteOffset, view_normal.byteLength / 4);
  let texcoords_0 = new Float32Array(
    buffer,
    view_texcoord_0.byteOffset,
    view_texcoord_0.byteLength / 4
  );
  let indices = new Uint16Array(buffer, view_indices.byteOffset, view_indices.byteLength / 2);
  let num_indices = acc_indices.count;

  console.log(`GLTF-to-Geometry [info]: ${num_indices} primitives.`);

  let geometry = new Geometry(gl.TRIANGLES);
  geometry.addArray("a_Position", positions);
  geometry.addArray("a_Normal", normals);
  // geometry.addArray("a_TexCoords_0", texcoords_0);  // ignore here
  geometry.setElements(indices, gl.UNSIGNED_SHORT, num_indices);

  return geometry;
}
