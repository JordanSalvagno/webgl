/**assignment2.js
*@fileoverview Renders a scene making use of geometric primitives
*using multiiple buffer objects
*References TwoBuffers.js as well as examples from Matsuda
*@author Jordan Salvagno
*/

function main() {
//Vertex shader program
var VSHADER_SOURCE = 
  'attribute vec4 a_Position;\n' +
  'attribute float a_PointSize;\n'+
  'uniform vec4 u_Translation;\n'+
  'void main() {\n' +
  ' gl_Position = a_Position + u_Translation;\n' +
  ' gl_PointSize = a_PointSize;\n'+
  '}\n';

//Fragment shader program
var FSHADER_SOURCE = 
 'precision mediump float;\n' +
 'uniform vec4 u_Color;\n' +
 'void main() {\n' +
 ' gl_FragColor = u_Color;\n' +
 '}\n';

 //variables for shaders
 var shaderVariables = {
   u_Translation:0,
   a_Position:0,
   u_color:0,
   a_PointSize:0
 };

//variables for translation
var translationVariables = {
  Tx:0,
  Ty:0,
  Tz:0
};

var animationVariables = {
};

//triangle object used for center mountain
var triangle = {
  verticies: new Float32Array([
  -1.0, 2.0,
  -2.0, -1.0,
  0.0, -1.0]),
  n: 3,
  mountainColor:0.6,
  buffer:0
};

var triangle2 ={
  verticies: new Float32Array([
   -0.4, -0.1,
   -0.375, 0.1,
   -0.35, -0.1
    ]),
    n: 3,
    buffer:0
};

//circle object used for sun
var circle = {
  verticies: new Float32Array([
   0.1,  0.0,
   0.15, 0.15,
   0.075, 0.15,
   0.05, 0.3,
   0.0,  0.2,
  -0.05, 0.3,
  -0.075,0.15,
  -0.15, 0.15,
  -0.1,  0.0,
  -0.15,-0.15,
  -0.075,-0.15,
  -0.05, -0.3,
   0.0, -0.2,
   0.05,-0.3,
   0.075,-0.15,
   0.15,-0.15
  ]),
  n:16,
  buffer:0
};

//quad object used for sky and grass
var quad = {
  verticies: new Float32Array([
   1.0, -1.0,
   1.0, 0.0,
  -1.0, -1.0,
  -1.0, 0.0
  ]),
  n: 4,
  buffer:0
};

//random points used for stars and constalations
var points={
  verticies: new Float32Array([
    -2.0, 0.5,
    -2.1, 0.2,
    -2.2, 0.4,
    -2.25,0.8,
    -2.3, 0.5,
    -2.4, 0.3
   ]),
  starColor:0.8,
  starSize:3,
  n:6,
  buffer:0
};

//object to hold various object models
var models = {
  triangle,
  triangle2,
  quad,
  circle,
  points
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
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
 
//set up shaders and locations of shader variables
  shaderVariables.u_Translation = gl.getUniformLocation(gl.program, 'u_Translation');
   if(!shaderVariables.u_Translation < 0) {
    console.log('Failed to get the storage location of u_Translation');
    return;
  }
  shaderVariables.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
   if(!shaderVariables.a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  shaderVariables.a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
   if(!shaderVariables.a_PointSize < 0) {
    console.log('Failed to get the storage location of a_PointSize');
    return;
  }
  shaderVariables.u_Color = gl.getUniformLocation(gl.program, 'u_Color');
   if(!shaderVariables.u_Translation < 0) {
    console.log('Failed to get the storage location of u_Color');
    return;
  }

   //set up buffers for models
   var n = initVertexBuffers(gl, shaderVariables, models);
  if(n<0){
    console.log('Failed to set the positions of the verticies');
    return;
  }

 //Registers the event handler to be called when a key is pressed
  document.onkeydown = function(ev){ 
    keydown(ev, gl, shaderVariables, translationVariables, models); };

 //sets background color
  gl.clearColor(0.7, 0.8, 1.0, 1.0);

  //start animation loop
  var dark = true; 
  /**
   * tick - callback function to animate/redraw
   */
  var tick = function(){

 //logic for darkening or brightning stars
    if(dark){
      models.points.starColor -= 0.01;
      models.points.starSize += 0.005;
    }
    else{
      models.points.starColor += 0.01;
      models.points.starSize -= 0.005;
    }
    if(models.points.starColor <= 0.0){
      dark = false;
    }
    if(models.points.starColor >= 1.0){
      dark = true;
    }
    renderScene(gl, shaderVariables, translationVariables, models);
    requestAnimationFrame(tick, canvas);
  }
  tick();
}

/**
 * initVertexBuffers - initializes all Webgl buffers for models
 * @param {object} gl - WebGL rendering context
 * @param {object} shaderVars - locations of shader variables
 * @params {models} - all model objects to be initilized
 * @returns {Boolean}
 */
function initVertexBuffers(gl, shaderVariables, models){
  //set up quad
  models.quad.buffer = gl.createBuffer();
  if(!models.quad.buffer){
    console.log('Failed to create quad buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, models.quad.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.quad.verticies, gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderVariables.a_Position);

  //set up triangle 
  models.triangle.buffer = gl.createBuffer();
  if(!models.triangle.buffer){
    console.log('Failed to create triangle buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, models.triangle.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.triangle.verticies, gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderVariables.a_Position);
  
  //set up triangle2
 
  models.triangle2.buffer = gl.createBuffer();
  if(!models.triangle2.buffer){
    console.log('Failed to create the triangle2 buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, models.triangle2.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.triangle2.verticies, gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderVariables.a_Position);
  
  //set up circle
  models.circle.buffer = gl.createBuffer();
  if(!models.circle.buffer){
    console.log('Failed to create circle buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, models.circle.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.circle.verticies, gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderVariables.a_Position);

  //points
  models.points.buffer = gl.createBuffer();
  if(!models.points.buffer){
    console.log('Failed to create points buffer object');
    return false;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, models.points.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.points.verticies, gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderVariables.a_Position);

  return true;
}

/**
 *renderScene - renders the scene using WebGL
 *@param {object} gl - the WebGL rendering context
 *@param {object} shaderVariables - the locations of the shader variables
 *@param {object} translationVariables - the locations of translation Variables
 *@param {object} models - models of objects to be rendered
 */
function renderScene(gl, shaderVariables, translationVariables, models){

  //local translation variables
  var Tx;
  var Ty;

  //clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);

  //set current translation
  gl.uniform4f(shaderVariables.u_Translation, translationVariables.Tx, 
      translationVariables.Ty, translationVariables.Tz, 0.0);
  
  // draw day time grass
  gl.uniform4f(shaderVariables.u_Color, 0 , 0.8 , 0 , 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, models.quad.buffer);
  gl.vertexAttribPointer(
      shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, models.quad.n);
 
  // draw night time grass
  Tx = translationVariables.Tx - 2.0;
  gl.uniform4f(shaderVariables.u_Translation, Tx, 
      translationVariables.Ty, translationVariables.Tz, 0.0);
  gl.uniform4f(shaderVariables.u_Color, 0 , 0.4 , 0 , 1);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, models.quad.n);

  //draw night sky
  Ty = translationVariables.Ty + 1.0;
  gl.uniform4f(shaderVariables.u_Translation, Tx, 
      Ty, translationVariables.Tz, 0.0);
  gl.uniform4f(shaderVariables.u_Color, 0 , 0 , 0.3 , 1);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, models.quad.n);

  //reset translation
  gl.uniform4f(shaderVariables.u_Translation, translationVariables.Tx, 
      translationVariables.Ty, translationVariables.Tz, 0.0);
  
  // draw trees
  gl.uniform4f(shaderVariables.u_Color, 0, 0.4, 0, 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, models.triangle2.buffer);
  gl.vertexAttribPointer(
      shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  Tx = translationVariables.Tx;
  Ty = translationVariables.Ty;

  //drawing row of trees
  for(var i = 0; i < 100; i++){
    Tx += 0.025;
  gl.uniform4f(shaderVariables.u_Translation, Tx, 
      translationVariables.Ty, translationVariables.Tz, 0.0);
  gl.drawArrays(gl.TRIANGLES, 0, models.triangle2.n);
  }
    Tx = translationVariables.Tx;
    Ty -= 0.1;
  gl.uniform4f(shaderVariables.u_Color, 0, 0.6, 0, 1);

  //drawing closer row of trees
  for(var i = 0; i < 100; i++){
    Tx += 0.02 ;
  gl.uniform4f(shaderVariables.u_Translation, Tx, 
      Ty, translationVariables.Tz, 0.0);
  gl.drawArrays(gl.TRIANGLES, 0, models.triangle2.n);
  }

  //reset translation
  gl.uniform4f(shaderVariables.u_Translation, translationVariables.Tx, 
      translationVariables.Ty, translationVariables.Tz, 0.0);
 
  // draw mountain
  gl.uniform4f(shaderVariables.u_Color, models.triangle.mountainColor, models.triangle.mountainColor, models.triangle.mountainColor, 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, models.triangle.buffer);
  gl.vertexAttribPointer(
      shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, models.triangle.n);

  // draw sun
  Tx = translationVariables.Tx + 0.8;
  Ty = translationVariables.Ty + 0.7;
  gl.uniform4f(shaderVariables.u_Translation, Tx, 
      Ty, translationVariables.Tz, 0.0);
  gl.uniform4f(shaderVariables.u_Color, 1, 1, 0, 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, models.circle.buffer);
  gl.vertexAttribPointer(
    shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, models.circle.n);
  
  //reset translation
  gl.uniform4f(shaderVariables.u_Translation, translationVariables.Tx, 
      translationVariables.Ty, translationVariables.Tz, 0.0);

  // draw stars
  gl.vertexAttrib1f(shaderVariables.a_PointSize, models.points.starSize); 
  gl.uniform4f(shaderVariables.u_Color, 1 , 1, models.points.starColor, 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, models.points.buffer);
  gl.vertexAttribPointer(
     shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  
  //draw strip constalation
  gl.drawArrays(gl.LINE_STRIP, 0, models.points.n);
  gl.drawArrays(gl.POINTS, 0, models.points.n);

  Tx = translationVariables.Tx + 0.3;
  Ty = translationVariables.Ty;
 
  //draw multiple stars
  for(var i = 0; i < 5; i++){
    Tx -= i/10;
  gl.uniform4f(shaderVariables.u_Translation, Tx, 
      translationVariables.Ty, translationVariables.Tz, 0.0);
  gl.drawArrays(gl.POINTS, 0, models.points.n);
  }

  //draw line constalation
  gl.drawArrays(gl.LINES, 0, models.points.n);
  gl.uniform4f(shaderVariables.u_Translation, Tx, 
      translationVariables.Ty, translationVariables.Tz, 0.0);
 
  Tx += 1.2;
  Ty += 0.2;
  
  gl.uniform4f(shaderVariables.u_Translation, Tx, 
      Ty, translationVariables.Tz, 0.0);

  //draw loop constalation
  gl.drawArrays(gl.POINTS, 0, models.points.n);
  gl.drawArrays(gl.LINE_LOOP, 0, models.points.n);
}

/**
 * keydown - event handler for keyboard presses
 * @param {Object} ev - the event handler
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} shaderVariables- the locations of the shader variables
 * @param {Object} translationVariables- the locations of the variables handling translation
 * @param {Object} models- holds models that are being rendered
 */
function keydown(ev,gl, shaderVariables, translationVariables, models){
  if(ev.keyCode == 39 && translationVariables.Tx < 2.0){
    translationVariables.Tx += 0.1; 
    models.triangle.mountainColor -= 0.01;
  }

  //left key
  if(ev.keyCode == 37 && translationVariables.Tx > 0.0){
    translationVariables.Tx -= 0.1; 
    models.triangle.mountainColor += 0.01;
  }
  tick();
}
