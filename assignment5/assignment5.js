/**assignment5.js
 *@fileoverview uses webgl to create a scene of randomly shaped cubes and a
 working windmill in a 3d world. windmill rotates with y and its blades will 
 animate with w. you are able to move around the terrain by using the arrow
 keys. refrences various examples from Matsuda as well as Twoprograms.js
 *@author Jordan Salvagno
 */

function main() {

  //Vertex Shader for Cube
  var CUBE_VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
      '  gl_Position = u_MvpMatrix * a_Position;\n' +
        '  v_Color = a_Color;\n' +
        '}\n';

  // Fragment shader program
  var CUBE_FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'uniform vec4 u_Color;\n' +
    'void main() {\n' +
      '  gl_FragColor = v_Color;\n' +
        '}\n';

  //Vertex shader for floor
  var FLOOR_VSHADER_SOURCE=
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_TexCoord;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
      'gl_Position = u_MvpMatrix * a_Position;\n' +
        'v_TexCoord = a_TexCoord;\n' +
        '}\n';

  //Fragment shader for floor
  var FLOOR_FSHADER_SOURCE=
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_Sampler;\n' +
    'varying vec2 v_TexCoord;\n' + 'void main() {\n' +
      'vec4 color = texture2D(u_Sampler, v_TexCoord);\n' +
        'gl_FragColor = color;\n' +
        '}\n';

  //variables for shaders
  var shaderVariables = {
    u_MvpMatrix: new Matrix4(),
    viewMatrix: new Matrix4(),
    modelMatrix: new Matrix4(),
    canvasSize:0,
  };

  //cube variables
  var cube= {
    vertices : new Float32Array ([
                   -0.5,  0.5,  0.5, 1.0, 0.0, 0.0,
                   -0.5, -0.5,  0.5, 1.0, 0.0, 0.0,
                    0.5, -0.5,  0.5, 1.0, 0.0, 0.0,
                   -0.5,  0.5,  0.5, 1.0, 0.0, 0.0,
                    0.5, -0.5,  0.5, 1.0, 0.0, 0.0,
                    0.5,  0.5,  0.5, 1.0, 0.0, 0.0,

                   0.5,  0.5,  0.5,  0.0, 0.0, 1.0,
                   0.5, -0.5,  0.5,  0.0, 0.0, 1.0,
                   0.5, -0.5, -0.5,  0.0, 0.0, 1.0,
                   0.5,  0.5,  0.5,  0.0, 0.0, 1.0,
                   0.5, -0.5, -0.5,  0.0, 0.0, 1.0,
                   0.5,  0.5, -0.5,  0.0, 0.0, 1.0,

                   0.5, -0.5,  0.5,  0.0, 1.0, 0.0,
                   -0.5, -0.5,  0.5, 0.0, 1.0, 0.0,
                   -0.5, -0.5, -0.5, 0.0, 1.0, 0.0,
                   0.5, -0.5,  0.5,  0.0, 1.0, 0.0,
                   -0.5, -0.5, -0.5, 0.0, 1.0, 0.0,
                   0.5, -0.5, -0.5,  0.0, 1.0, 0.0,

                   0.5,  0.5, -0.5,  0.0, 0.5, 0.5,
                   -0.5,  0.5, -0.5, 0.0, 0.5, 0.5,
                   -0.5,  0.5,  0.5, 0.0, 0.5, 0.5,
                   0.5,  0.5, -0.5,  0.0, 0.5, 0.5,
                   -0.5,  0.5,  0.5, 0.0, 0.5, 0.5,
                   0.5,  0.5,  0.5,  0.0, 0.5, 0.5,

                   -0.5, -0.5, -0.5, 1.0, 1.0, 0.0,
                   -0.5,  0.5, -0.5, 1.0, 1.0, 0.0,
                   0.5,  0.5, -0.5,  1.0, 1.0, 0.0,
                   -0.5, -0.5, -0.5, 1.0, 1.0, 0.0,
                   0.5,  0.5, -0.5,  1.0, 1.0, 0.0,
                   0.5, -0.5, -0.5,  1.0, 1.0, 0.0,

                   -0.5,  0.5, -0.5,  0.8, 0.0, 0.8,
                   -0.5, -0.5, -0.5,  0.8, 0.0, 0.8,
                   -0.5, -0.5,  0.5,  0.8, 0.0, 0.8,
                   -0.5,  0.5, -0.5,  0.8, 0.0, 0.8,
                   -0.5, -0.5,  0.5,  0.8, 0.0, 0.8,
                   -0.5,  0.5,  0.5,  0.8, 0.0, 0.8,
                     ]),
                   n:36,
                   buffer:0,
                   turn:false,
                   animate:false,
                   translate:[],
                   scale:[],
                   rotateBlade:0,
                   rotateX:90,
                   numCubes:20
  };

  //assign scale array and translate array with random numbers for each cube
  assignCubeCoordinates(cube);

  //variables for floor object
  var floor = {
    vertices: new Float32Array([
                  -100.0, -0.7, -100.0, 0.0, 0.0,
                  100.0,  -0.7, -100.0, 1.0, 0.0,
                  100.0,  -0.7,  100.0, 1.0, 1.0,
                  -100.0, -0.7,  100.0, 0.0, 1.0,
                  ]),
    n:4,
    buffer:0
  };

  //variables for camera
  var camera = {
    viewMatrix: new Matrix4(),
    projMatrix: new Matrix4(),
    angle:0.0,
    eye: new Vector3([0,0,0]),
    pos: new Vector3([1,0,0]),
    up: new Vector3([0,1,0]),
  };


  //object to hold various object models
  var models = {
    cube,
    floor
  };

  //retrieves canvas
  var canvas = document.getElementById('webgl');

  // Gets rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  //Initialize shaders
  var cubeProgram = createProgram(gl, CUBE_VSHADER_SOURCE, 
      CUBE_FSHADER_SOURCE);
  var floorProgram = createProgram(gl, FLOOR_VSHADER_SOURCE,
      FLOOR_FSHADER_SOURCE);
  if (!cubeProgram || !floorProgram) {
    console.log('Failed to intialize shaders.');
    return;
  }

  //set up shadervariables for cube and floor programs
  cubeProgram.a_Position = gl.getAttribLocation(cubeProgram, 'a_Position');
  cubeProgram.a_Color = gl.getAttribLocation(cubeProgram, 'a_Color');
  cubeProgram.u_MvpMatrix = gl.getUniformLocation(cubeProgram, 'u_MvpMatrix');

  floorProgram.a_Position = gl.getAttribLocation(floorProgram, 'a_Position');
  floorProgram.a_TexCoord = gl.getAttribLocation(floorProgram, 'a_TexCoord');
  floorProgram.u_MvpMatrix = gl.getUniformLocation(floorProgram, 'u_MvpMatrix');
  floorProgram.u_Sampler = gl.getUniformLocation(floorProgram, 'u_Sampler');

  if(cubeProgram.a_Position < 0 || cubeProgram.a_Color < 0 ||
      !cubeProgram.u_MvpMatrix){
    console.log('Failed to get cube shader variables');
  }

  if(floorProgram.a_Position < 0 || !floorProgram.u_Sampler ||
      !floorProgram.u_MvpMatrix || !floorProgram.a_TexCoord){
    console.log('Failed to get floor shader variables');
  }

  //set up buffers for models
  var n = initVertexBuffers(gl, shaderVariables, models, cubeProgram,
      floorProgram);
  if(!n){
    console.log('Failed to set the positions of the vertices');
    return;
  }

  //set up textures
  var texture = initTextures(gl, floorProgram,shaderVariables);
  if(!texture){
    console.log('Failed to init textures.');
  }

  //registers handlekeyDown and handleKeyUp methods to be called on
  //a keypress
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  //sets background color and enables depth buffer
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 1);

  //get the size of the canvas and setup the perspective view
  shaderVariables.canvasSize = canvas.width/canvas.height;
  camera.projMatrix.setPerspective(40.0, shaderVariables.canvasSize, 1, 100);

  //start animation loop
  /**
   * tick - callback function to animate/redraw
   */
  function tick(){
    //funciton that handles any key pressed recieved from onKeyDown and onKeyUp
    keydown(gl, models, camera);
    renderScene(gl, shaderVariables, models, camera, texture,
        cubeProgram, floorProgram);
    animate(models);
    requestAnimationFrame(tick, canvas);
  }
  tick();
}

/**
 * initVertexBuffers - initializes all Webgl buffers for models
 * @param {object} gl - WebGL rendering context
 * @param {object} shaderVars - locations of shader variables
 * @param {object} models - all model objects to be initilized
 * @param {program} cube - cube program
 * @param {program} floor - floor program
 * @returns {Boolean}
 */
function initVertexBuffers(gl, shaderVariables, models, cube, floor){

  //init terrain
  models.floor.buffer = gl.createBuffer();
  if(!models.floor.buffer){
    console.log('Failed to create cube buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, models.floor.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.floor.vertices, gl.STATIC_DRAW);

  var FSIZE = models.floor.vertices.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(floor.a_Position, 3, gl.FLOAT, false, FSIZE * 5 ,0);
  gl.enableVertexAttribArray(floor.a_Position);

  gl.vertexAttribPointer(floor.a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5 , 
      FSIZE * 2);
  gl.enableVertexAttribArray(floor.a_TexCoord);

  //init cube
  models.cube.buffer = gl.createBuffer();
  if(!models.cube.buffer){
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, models.cube.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.cube.vertices, gl.STATIC_DRAW);

  var FSIZE = models.cube.vertices.BYTES_PER_ELEMENT;

  gl.vertexAttribPointer(cube.a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(cube.a_Position);

  gl.vertexAttribPointer(cube.a_Color, 3, gl.FLOAT, false, FSIZE * 6,
      FSIZE * 3);
  gl.enableVertexAttribArray(cube.a_Color);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

/**
 * initTextures - initilizes all textures used 
 * @param {object} gl - webgl program
 * @param {program} program - the program the texture is being set up for
 * @param {object} textures - holds all textures used and needed 
 * to be initialized
 * @returns {texture}
 */
function initTextures(gl, program,shaderVariables){
  var texture = gl.createTexture();
  if(!texture){
    console.log('Failed to create texture')
      return null;
  }

  var image = new Image();
  if(!image) {
    console.log('Failed to create image');
  }
//executes function on load to set up texture
  image.onload = function(){
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.useProgram(program);
    gl.uniform1i(program.u_Sampler, 0);

    gl.bindTexture(gl.TEXTURE_2D, null);
    shaderVariables.loaded=true;

  };

  image.src = '../resources/shield.png';

  return texture;
}
//array to tell which keys are curently pressed
var currentlyPressedKeys = {};

/**
 * handleKeyDown - registers a key as being pressed on a key down being
 * recieved
 * @param {event} event - event holding keyCode
 */
function handleKeyDown(event) {
  currentlyPressedKeys[event.keyCode] = true;
}

/**
 * handleKeyUp - removes a key from being pressed on a key up being
 * recieved
 * @param {event} event - event holding keyCode
 */
function handleKeyUp(event) {
  currentlyPressedKeys[event.keyCode] = false;
}
/**
 * keydown - event handler for keyboard presses
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} models- holds models that are being rendered
 * @param {Object} camera- holds variables related to the camera object
 */
function keydown(gl, models, camera){
  //if left key is pressed decrease angle and add directional values to
  //pos elements
  if(currentlyPressedKeys[37]) {
    camera.angle -= 0.1;
    camera.pos.elements[0] = Math.cos(camera.angle);
    camera.pos.elements[2] = Math.sin(camera.angle);
    camera.pos.normalize();
  }
  //if right key is pressed increase angle and add directional values to
  //pos elements
  else if(currentlyPressedKeys[39]){
    camera.angle += 0.1;
    camera.pos.elements[0] = Math.cos(camera.angle);
    camera.pos.elements[2] = Math.sin(camera.angle);
    camera.pos.normalize();
  }
 
  //if up is pressed increase eye position in direction facing 
  if(currentlyPressedKeys[38]) {
    camera.eye.elements[0] +=  camera.pos.elements[0] * 0.1;
    camera.eye.elements[2] +=  camera.pos.elements[2] * 0.1;
  }
  
  //if down is pressed decrease eye position in direction facing 
  else if(currentlyPressedKeys[40]){
    camera.eye.elements[0] -=  camera.pos.elements[0] * 0.1;
    camera.eye.elements[2] -=  camera.pos.elements[2] * 0.1;
  }
  
  //if y is pressed rotate windmill if its not make sure windmill isn't rotating
  if(currentlyPressedKeys[89]){
    if(models.cube.turn == false){
      models.cube.turn = true;
    }
    else{
      models.cube.turn = false;
    }
  }
  else{
    models.cube.turn = false;
  }

  //if w is pressed ether turn rotation of windmill blades on or off
  if(currentlyPressedKeys[87]){
    console.log("w was pressed");
    if(models.cube.animate == false){
      models.cube.animate = true;
    }
    else{
      models.cube.animate = false;
    }
  }
}

/**
 * animate - changes animated objects variables for every call from tick
 * @param {object} models - contains windmill animation objects 
 */
var previousTime = 0;
function animate(models){
  var currentTime = new Date().getTime();
  if (previousTime != 0){
    var elapsed = currentTime - previousTime;

    if(models.cube.turn == true){
      models.cube.rotateX += 0.1 * elapsed;
    }
    if(models.cube.animate == true){
      models.cube.rotateBlade= models.cube.rotateBlade + (30 * elapsed)
        / 1000.0;
      models.cube.rotateBlade = models.cube.rotateBlade % 360; 
    }
  }
  previousTime = currentTime; 
}

/**
 *renderScene - renders the scene using WebGL
 *@param {object} gl - the WebGL rendering context
 *@param {object} shaderVariables - the locations of the shader variables
 *@param {object} models - models of objects to be rendered
 *@param {object} camera - holds variables related to the camera
 *@param {object} texture - texture to be rendered on floor
 *@param {program} cube - cube program object
 *@param {program} floor - floor program object
 */
function renderScene(gl, shaderVariables, models, camera, texture, cube, floor){

  //sets the camera view
  camera.viewMatrix.setLookAt(
      camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2], 
      camera.eye.elements[0] + camera.pos.elements[0], 
      camera.eye.elements[1] + camera.pos.elements[1], 
      camera.eye.elements[2] + camera.pos.elements[2],
      camera.up.elements[0], camera.up.elements[1], camera.up.elements[2]
      );

  //draw terrain
  gl.useProgram(floor);
  drawTerrain(gl,models, shaderVariables, texture, camera, floor);
  
  //draw cubes
  gl.useProgram(cube);
  for(i = 0; i < models.cube.numCubes; i++){
    drawCube(gl , models, shaderVariables, camera, models.cube.translate[i],
        models.cube.scale[i], cube);
  }
  
  //draw windmill
    drawWindmill(gl, models, shaderVariables, cube, camera);

}

/**
 *drawWindmill - draws the windmill object to the canvas
 *@param {object} gl - the WebGL rendering context
 *@param {object} models - models of objects to be rendered
 *@param {object} shaderVariables - the locations of the shader variables
 *@param {program} cube - cube program object
 *@param {object} camera - holds variables related to the camera
 */
function drawWindmill(gl, models, shaderVariables, cube, camera)
{
  var FSIZE = models.cube.vertices.BYTES_PER_ELEMENT;
  //post
  shaderVariables.modelMatrix.setTranslate(25,0,20);
  shaderVariables.modelMatrix.rotate(models.cube.rotateX, 0, 1 ,0);
  shaderVariables.modelMatrix.scale(0.1, 1.5, 0.1);
  shaderVariables.modelMatrix.translate(1, 0, 0);
  shaderVariables.u_MvpMatrix.set(camera.projMatrix).
    multiply(camera.viewMatrix).multiply(shaderVariables.modelMatrix);
  gl.uniformMatrix4fv(cube.u_MvpMatrix, false,
      shaderVariables.u_MvpMatrix.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, models.cube.buffer);
  gl.vertexAttribPointer(cube.a_Position, 3, gl.FLOAT, false, FSIZE * 6 ,0);
  gl.vertexAttribPointer(cube.a_Color, 3, gl.FLOAT, false, FSIZE * 6 , FSIZE * 3);
  gl.drawArrays(gl.TRIANGLES, 0, models.cube.n);

  //blade right 
  shaderVariables.modelMatrix.setTranslate(25, 0.5, 20);
  shaderVariables.modelMatrix.rotate(models.cube.rotateX, 0, 1 ,0);
  shaderVariables.modelMatrix.rotate(90+models.cube.rotateBlade, 1, 0, 0);
  shaderVariables.modelMatrix.translate(0, 0.35, 0);
  shaderVariables.modelMatrix.scale(0.05, 0.5, 0.05);
  shaderVariables.u_MvpMatrix.set(camera.projMatrix).
    multiply(camera.viewMatrix).multiply(shaderVariables.modelMatrix);
  gl.uniformMatrix4fv(cube.u_MvpMatrix, false, shaderVariables.
      u_MvpMatrix.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, models.cube.buffer);
  gl.vertexAttribPointer(cube.a_Position, 3, gl.FLOAT, false, FSIZE * 6 ,0);
  gl.vertexAttribPointer(cube.a_Color, 3, gl.FLOAT, false, FSIZE * 6 ,
      FSIZE * 3);
  gl.drawArrays(gl.TRIANGLES, 0, models.cube.n);
  shaderVariables.modelMatrix.setTranslate(0, 0, 0);

  //blade left
  shaderVariables.modelMatrix.setTranslate(25, 0.5, 20);
  shaderVariables.modelMatrix.rotate(models.cube.rotateX, 0, 1 ,0);
  shaderVariables.modelMatrix.rotate(90+models.cube.rotateBlade, 1, 0, 0);
  shaderVariables.modelMatrix.translate(0, -0.35, 0);
  shaderVariables.modelMatrix.scale(0.05, 0.5, 0.05);
  shaderVariables.u_MvpMatrix.set(camera.projMatrix).
    multiply(camera.viewMatrix).multiply(shaderVariables.modelMatrix);
  gl.uniformMatrix4fv(cube.u_MvpMatrix, false,
      shaderVariables.u_MvpMatrix.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, models.cube.buffer);
  gl.vertexAttribPointer(cube.a_Position, 3, gl.FLOAT, false, FSIZE * 6 ,0);
  gl.vertexAttribPointer(cube.a_Color, 3, gl.FLOAT, false, FSIZE * 6 , FSIZE * 3);
  gl.drawArrays(gl.TRIANGLES, 0, models.cube.n);

  //top blade

  shaderVariables.modelMatrix.setTranslate(25, 0.5, 20);
  shaderVariables.modelMatrix.rotate(models.cube.rotateX, 0, 1 ,0);
  shaderVariables.modelMatrix.rotate(models.cube.rotateBlade, 1, 0 ,0);
  shaderVariables.modelMatrix.translate(0, 0.3, 0);
  shaderVariables.modelMatrix.scale(0.05, 0.5, 0.05);
  shaderVariables.u_MvpMatrix.set(camera.projMatrix).
    multiply(camera.viewMatrix).multiply(shaderVariables.modelMatrix);
  gl.uniformMatrix4fv(cube.u_MvpMatrix, false, 
      shaderVariables.u_MvpMatrix.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, models.cube.buffer);
  gl.vertexAttribPointer(cube.a_Position, 3, gl.FLOAT, false, FSIZE * 6 ,0);
  gl.vertexAttribPointer(cube.a_Color, 3, gl.FLOAT, false, FSIZE * 6 ,
      FSIZE * 3);
  gl.drawArrays(gl.TRIANGLES, 0, models.cube.n);

  //blade bottom
  shaderVariables.modelMatrix.setTranslate(25, 0.5, 20);
  shaderVariables.modelMatrix.rotate(models.cube.rotateX, 0, 1 ,0);
  shaderVariables.modelMatrix.rotate(models.cube.rotateBlade, 1, 0 ,0);
  shaderVariables.modelMatrix.translate(0, -0.3, 0);
  shaderVariables.modelMatrix.scale(0.05, 0.5, 0.05);
  shaderVariables.u_MvpMatrix.set(camera.projMatrix).
    multiply(camera.viewMatrix).multiply(shaderVariables.modelMatrix);
  gl.uniformMatrix4fv(cube.u_MvpMatrix, false,
      shaderVariables.u_MvpMatrix.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, models.cube.buffer);
  gl.vertexAttribPointer(cube.a_Position, 3, gl.FLOAT, false, FSIZE * 6 ,0);
  gl.vertexAttribPointer(cube.a_Color, 3, gl.FLOAT, false, FSIZE * 6 ,
      FSIZE * 3);
  gl.drawArrays(gl.TRIANGLES, 0, models.cube.n);
  shaderVariables.modelMatrix.setTranslate(0, 0, 0);
}

/**
 * drawCube - draws a cube object to the canvas
 *@param {object} gl - the WebGL rendering context
 *@param {object} models - models of objects to be rendered
 *@param {object} shaderVariables - the locations of the shader variables
 *@param {object} camera - holds variables related to the camera
 *@param {vector3}  translate - holds variables to translate object
 *@param {vector3}  scale - holds variables to scale object
 *@param {program} cube - cube program object
 */
function drawCube(gl,models, shaderVariables, camera, translate, scale,cube){
  var FSIZE = models.cube.vertices.BYTES_PER_ELEMENT;
  shaderVariables.modelMatrix.setTranslate(translate.elements[0],
      translate.elements[1], translate.elements[2]);
  shaderVariables.modelMatrix.scale(scale.elements[0], scale.elements[1],
      scale.elements[2]);
  shaderVariables.u_MvpMatrix.set(camera.projMatrix).
    multiply(camera.viewMatrix).multiply(shaderVariables.modelMatrix);
 
  gl.uniformMatrix4fv(cube.u_MvpMatrix, false,
      shaderVariables.u_MvpMatrix.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, models.cube.buffer);
  gl.vertexAttribPointer(cube.a_Position, 3, gl.FLOAT, false, FSIZE * 6 ,0);
  gl.vertexAttribPointer(cube.a_Color, 3, gl.FLOAT, false, FSIZE * 6 ,
      FSIZE * 3);
  gl.drawArrays(gl.TRIANGLES, 0, models.cube.n);
  shaderVariables.modelMatrix.setTranslate(0, 0, 0);
}

/**
 * drawTerrain - draws the terrain/floor object
 *@param {object} gl - the WebGL rendering context
 *@param {object} models - models of objects to be rendered
 *@param {object} shaderVariables - the locations of the shader variables
 *@param {object} texture - the texture to be rendered
 *@param {object} camera - holds variables related to the camera
 *@param {program} cube - cube program object
 */
function drawTerrain(gl,models, shaderVariables, texture,camera, floor){
  shaderVariables.modelMatrix.setTranslate(0,0,0);
  shaderVariables.u_MvpMatrix.set(camera.projMatrix).
    multiply(camera.viewMatrix).multiply(shaderVariables.modelMatrix);
  gl.uniformMatrix4fv(floor.u_MvpMatrix, false,
      shaderVariables.u_MvpMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.bindBuffer(gl.ARRAY_BUFFER, models.floor.buffer);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  var FSIZE = models.floor.vertices.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(floor.a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
  gl.vertexAttribPointer(floor.a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5,
      FSIZE * 2);
  gl.drawArrays(gl.TRIANGLES, 0, models.floor.n);
}

/**
 * assignCubeCoordinates - assigns random values for each cube being rendered
 *@param {object} cube - object holding all cube variables
 */
function assignCubeCoordinates(cube){
var xMax = 80;
var xMin = 30;
var zMax = 20;
var zMin = -20;
var scaleMax = 10;
var scaleMin = 1;
  for(i = 0; i < cube.numCubes; i++){
  cube.translate[i] = new Vector3([getRandomNumber(xMax, xMin), 0,
      getRandomNumber(zMax,zMin)]);
  cube.scale[i] = new Vector3([getRandomNumber(scaleMax, scaleMin), 
      getRandomNumber(scaleMax,scaleMin), getRandomNumber(scaleMax,scaleMin)]);
  }
}

/**
 * getRandomNumber - gets a random number between max and min
 * #param {int} max - maximum number
 * #param {int} min - minimum number
 */
function getRandomNumber(max, min){
  return Math.random() * (max - min) + min;
}
