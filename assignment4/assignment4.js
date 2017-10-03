/**assignment4.js
 *@fileoverview Webgl version of space invaders. Improves on previous
 *version by using textures for game objects. Also gives game a paper style
 *texture using two texture units
 *References TwoBuffers.js as well as examples from Matsuda
 *@author Jordan Salvagno
 */

function main() {
  //Vertex shader program
  var VSHADER_SOURCE = 
    'attribute vec4 a_Position;\n' +
    'attribute float a_PointSize;\n'+
    'uniform mat4 u_xformMatrix;\n'+
    'attribute vec2 a_TexCoord;\n'+
    'varying vec2 v_TexCoord;\n'+
    'void main() {\n' +
      ' gl_Position = u_xformMatrix *  a_Position;\n' +
        ' gl_PointSize = a_PointSize;\n'+
        'v_TexCoord = a_TexCoord;\n'+
        '}\n';

  //Fragment shader program
  var FSHADER_SOURCE = 
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_Sampler0;\n' +
    'uniform sampler2D u_Sampler1;\n' +
    'varying vec2 v_TexCoord;\n' +
    'uniform vec4 u_Color;\n' +
    'void main() {\n' +
      ' vec4 color0 = texture2D(u_Sampler0, v_TexCoord);\n' +
        ' vec4 color1 = texture2D(u_Sampler1, v_TexCoord);\n' +
        ' gl_FragColor = color0 * color1 * u_Color ;\n' +
        '}\n';

  //variables for shaders
  var shaderVariables = {
    a_Position:0,
    a_PointSize:0,
    a_TexCoord:0,
    u_Color:0,
    u_xformMatrix:0,
    u_Sampler0:0,
    u_Sampler1:0,
  };

  //variables used to handle enemy movement
  var enemyVariables = {
    Tx:0,
    Ty:0,
    direction:"right",
    enemiesHit:0,
    enemySpeed:0.001,
    numberEnemies:25,
    frame:0
  };

  //variables used to store texture information
  var textures ={
    enemy1:{
      texture:0,
      image:0
    },
    enemy2:{
      texture:0,
      image:0
    },
    shield:{
      texture:0,
      image:0
    },
    brick:{
      texture:0,
      image:0
    },
    player:{
      texture:0,
      image:0
    },
    white:{
      texture:0,
      whitePixel: new Uint8Array(
          [255, 255, 255, 255
          ])
    }
  };

  //player object
  var player={
    verticies: new Float32Array([
                   -0.05,  -0.8,
                   -0.05, -0.85,
                   0.05,  -0.8,
                   0.05, -0.85,
                   ]),
    n:4,
    modelMatrix: new Matrix4,
    buffer:0,
    Tx:0,
    Ty:0,
    Tz:0
  };

  //shot object
  var shot={
    verticies: new Float32Array([
                   0,-0.75,
                   0,-0.8
                   ]),
    n:2,
    modelMatrix: new Matrix4,
    visible:false,
    buffer:0,
    X1:0,
    X2:0,
    Y1:-0.75,
    Y2:-0.8,
    Ty:0,
    Tx:0,
    Tz:0
  };

  //shield object
  var shield={
    verticies: new Float32Array([
                   -0.95,-0.45,
                   -0.95,-0.65,
                   -0.6,-0.45,
                   -0.6,-0.65
                   ]),
    n:4,
    modelMatrix: new Matrix4,
    buffer:0,
    Tx:[],
    Ty:0,
    Sx:1,
    Sy:0.75
  };

  //fills locations for multiple shields
  createShields(shield);

  // enemy objects
  var enemies={
    verticies: new Float32Array([
                   -1.00, 0.2,    0.0, 1.0,
                   -1.00, 0.125,  0.0, 0.0,
                   -0.85, 0.2,    1.0, 1.0,
                   -0.85, 0.125 , 1.0, 0.0
                   ]),
    modelMatrix: new Matrix4,
    buffer:0,
    n:4,
    visible:[],
    X1:[],
    Y1:[],
    X4:[],
    Y4:[],
    Tx:[],
    Ty:[],
    textures:[],
    images:[]
  };
  //fills location arrays for enemies
  createEnemies(enemies);


  //shieldHitbox object
  var shieldHitbox={
    verticies: new Float32Array([
                   -0.95, -0.60,
                   -0.95, -0.65,
                   -0.90, -0.60,
                   -0.90, -0.65 ]),
    modelMatrix: new Matrix4,
    buffer:0,
    n:4,
    numberOfHitboxes:100,
    visible:[],
    X1:[],
    Y1:[],
    X4:[],
    Y4:[],
    Tx:[],
    Ty:[]
  };

  //fills location arrays for multiple hitboxes
  createShieldHitbox(shieldHitbox);

  //object to hold various object models
  var models = {
    player,
    shot,
    enemies,
    shield,
    shieldHitbox,
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
  initShaderVariables(gl, shaderVariables);

  //set up buffers for models
  var n = initVertexBuffers(gl, shaderVariables, models);
  if(n<0){
    console.log('Failed to set the positions of the verticies');
    return;
  }

  //Registers the event handler to be called when a key is pressed
  document.onkeydown = function(ev){ 
    keydown(ev, gl, shaderVariables, enemyVariables, models); };

  //update html score
  document.getElementById("score").innerHTML = "Score: " + enemyVariables.enemiesHit * 100;

  //sets background color
  gl.clearColor(0, 0, 0, 1.0);

  if(!initTextures(gl, textures)){
    console.log('Failed to init textures');
    return;
  }

  //start animation loop

  /**
   * tick - callback function to animate/redraw
   */
  var tick = function(){
    animate(models,enemyVariables);
    renderScene(gl, shaderVariables, enemyVariables, models, textures);
    requestAnimationFrame(tick, canvas);
  }
  tick();
}

/**
 * initVertexBuffers - initializes all Webgl buffers for models
 * @param {object} gl - WebGL rendering context
 * @param {object} shaderVars - locations of shader variables
 * @param {object} models - all model objects to be initilized
 * @returns {Boolean}
 */
function initVertexBuffers(gl, shaderVariables, models){

  //set up enemies
  models.enemies.buffer = gl.createBuffer();
  if(!models.enemies.buffer){
    console.log('Failed to create enemy buffer object');
    return false;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, models.enemies.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.enemies.verticies, gl.STATIC_DRAW);

  var FSIZE = models.enemies.verticies.BYTES_PER_ELEMENT;

  gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false,
      FSIZE * 4 ,0);
  gl.enableVertexAttribArray(shaderVariables.a_Position);

  gl.vertexAttribPointer(shaderVariables.a_TexCoord, 2, gl.FLOAT, false,
      FSIZE * 4 , FSIZE * 2);
  gl.enableVertexAttribArray(shaderVariables.a_TexCoord);

  //set up player
  models.player.buffer = gl.createBuffer();
  if(!models.player.buffer){
    console.log('Failed to create player buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, models.player.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.player.verticies, gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false, 0 ,0);
  gl.enableVertexAttribArray(shaderVariables.a_Position);

  //set up shield
  models.shield.buffer = gl.createBuffer();
  if(!models.shield.buffer){
    console.log('Failed to create shield buffer object');
    return false;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, models.shield.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.shield.verticies, gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false, 0 ,0);
  gl.enableVertexAttribArray(shaderVariables.a_Position);

  //set up shield hitbox
  models.shieldHitbox.buffer = gl.createBuffer();
  if(!models.shieldHitbox.buffer){
    console.log('Failed to create shield Hitbox buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, models.shieldHitbox.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.shieldHitbox.verticies, gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false, 0 ,0);
  gl.enableVertexAttribArray(shaderVariables.a_Position);

  //set up shot
  models.shot.buffer = gl.createBuffer();
  if(!models.shot.buffer){
    console.log('Failed to create shot buffer object');
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, models.shot.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.shot.verticies, gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false, 0 ,0);
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
function renderScene(gl, shaderVariables, enemyVariables, models, textures){

  gl.clear(gl.COLOR_BUFFER_BIT);

  // draw enemies
  gl.activeTexture(gl.TEXTURE0);
  if(enemyVariables.frame == 0){
    gl.bindTexture(gl.TEXTURE_2D, textures.enemy1.texture);
  }
  else{
    gl.bindTexture(gl.TEXTURE_2D, textures.enemy2.texture);
  }
  gl.uniform1i(shaderVariables.u_Sampler0, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures.brick.texture);
  gl.uniform1i(shaderVariables.u_Sampler1, 1);
  gl.uniform4f(shaderVariables.u_Color, 1, 1, 1, 1);

  var FSIZE = models.enemies.verticies.BYTES_PER_ELEMENT;

  for(i = 0; i < 25; i++){
    if(models.enemies.visible[i] == true){
      models.enemies.modelMatrix.setTranslate(
          models.enemies.Tx[i] + enemyVariables.Tx,
          models.enemies.Ty[i] + enemyVariables.Ty, 0);
      gl.uniformMatrix4fv(shaderVariables.u_xformMatrix, false, 
          models.enemies.modelMatrix.elements);
      gl.bindBuffer(gl.ARRAY_BUFFER, models.enemies.buffer);
      gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false,
          FSIZE * 4 ,0);
      gl.vertexAttribPointer(shaderVariables.a_TexCoord, 2, gl.FLOAT, false,
          FSIZE * 4 , FSIZE * 2);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  //draw shields
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures.shield.texture);
  gl.uniform1i(shaderVariables.u_Sampler0, 0);
  gl.uniform4f(shaderVariables.u_Color, 1, 1, 1, 1);
  for(i = 0; i < 4; i++){
    models.shield.modelMatrix.setTranslate(models.shield.Tx[i], 0, 0);
    gl.uniformMatrix4fv(shaderVariables.u_xformMatrix, false, models.shield.modelMatrix.elements);
    gl.bindBuffer(gl.ARRAY_BUFFER, models.shield.buffer);
    gl.vertexAttribPointer(
        shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, models.shield.n);
  }

  //draw player
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures.player.texture);
  gl.uniform1i(shaderVariables.u_Sampler0, 0);
  gl.uniform4f(shaderVariables.u_Color, 1, 1, 1, 1);
  gl.uniformMatrix4fv( shaderVariables.u_xformMatrix, false, models.player.modelMatrix.elements);
  gl.bindBuffer(gl.ARRAY_BUFFER, models.player.buffer);
  gl.vertexAttribPointer(
      shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, models.player.n);

  //draw shield hitboxes
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform4f(shaderVariables.u_Color, 0.2 , 0.9, 0.2, 1);
  gl.bindTexture(gl.TEXTURE_2D, textures.white.texture);
  for(i = 0; i < models.shieldHitbox.numberOfHitboxes; i++)
  {
    if(models.shieldHitbox.visible[i] == true){
      models.shieldHitbox.modelMatrix.setTranslate(models.shieldHitbox.Tx[i],
          models.shieldHitbox.Ty[i], 0);
      gl.uniform4f(shaderVariables.u_Color, 0, 0, 0, 1);
      gl.uniformMatrix4fv( shaderVariables.u_xformMatrix, false, 
          models.shieldHitbox.modelMatrix.elements);
      gl.bindBuffer(gl.ARRAY_BUFFER, models.shieldHitbox.buffer);
      gl.vertexAttribPointer(
          shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, models.shieldHitbox.n);
    }
  }

  // draw shot
  if(models.shot.visible == true)
  {
    models.shot.modelMatrix.setTranslate(models.shot.Tx, models.shot.Ty,
        models.shot.Tz);
    gl.uniform4f(shaderVariables.u_Color, 1 , 1, 1, 1);
    gl.uniformMatrix4fv( shaderVariables.u_xformMatrix, false, 
        models.shot.modelMatrix.elements);
    gl.bindBuffer(gl.ARRAY_BUFFER, models.shot.buffer);
    gl.vertexAttribPointer(
        shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, models.shot.n);
  }

}

/**
 * keydown - event handler for keyboard presses
 * @param {Object} ev - the event handler
 * @param {Object} gl - the WebGL rendering context
 * @param {Object} shaderVariables- the locations of the shader variables
 * @param {Object} translationVariables- the locations of the variables handling 
 * translation
 * @param {Object} models- holds models that are being rendered
 */
function keydown(ev,gl, shaderVariables, enemyVariables, models){
  //right key moves player right
  if(ev.keyCode == 39 && models.player.Tx < 0.95){
    models.player.Tx += 0.05; 
  }

  //left key moves player left
  if(ev.keyCode == 37 && models.player.Tx > -0.95){
    models.player.Tx -= 0.05; 
  }

  //space fires lazer
  if(ev.keyCode == 32 && models.shot.visible == false){
    models.shot.visible = true;
    models.shot.Ty = 0;
    models.shot.Tx = models.player.Tx;
  }

  models.player.modelMatrix.setTranslate(models.player.Tx, models.player.Ty,
      models.player.Tz);
}


/**
 * createShields - fills location arrays for multiple shields
 * @param {object} shield - shield objects to be filled with multiple locations
 */
function createShields(shield){
  tmp = [];
  Tx = 0;
  for(i = 0; i < 4; i++){
    shield.Tx.push(Tx);
    Tx += 0.5;
  }
  return tmp;
}

/**
 * createShieldHitbox - fills locations for multiple shield hitboxes
 * @params {Object} shieldHitbox - shieldHitbox object to have location
 * arrays filled
 */
function createShieldHitbox(shieldHitbox){
  var x1 = -0.95;
  var x4 = -0.90;
  var y1 = -0.60;
  var y4 = -0.65;
  var Tx = 0;
  var Ty = 0;
  for(i = 0; i < 4; i++){
    for(ii = 0; ii < 25; ii++){
      shieldHitbox.X1.push(x1 + Tx);  
      shieldHitbox.Y1.push(y1 + Ty);
      shieldHitbox.X4.push(x4 + Tx);
      shieldHitbox.Y4.push(y4 + Ty); 
      shieldHitbox.Tx.push(Tx); 
      shieldHitbox.Ty.push(Ty); 
      shieldHitbox.visible.push(false);
      if(ii == 6){
        Tx += 0.2;
      }
      else if(ii == 12 || ii == 18){
        Tx += 0.25
      }
      else{
        Tx += 0.05;
      }
    }
    Tx = 0;
    Ty += 0.05;
  }
}

/**
 * createEnemies - fills location arrays for an enemy object
 * @param {Object} enemies - enemies object to have locations filled
 */
function createEnemies(enemies){
  var x1 = -1.0;
  var x4 = -0.85;
  var y1 =  0.2;
  var y4 = 0.125;
  var enemyTx = 0;
  var enemyTy = 0;
  var imageTx = -5.9;
  var imageTy = 1.2;

  for(i = 0; i < 5; i++){
    for(ii = 0; ii < 5; ii++){
      enemies.X1.push(x1+enemyTx);
      enemies.Y1.push(y1+enemyTy);
      enemies.X4.push(x4+enemyTx);
      enemies.Y4.push(y4+enemyTy);
      enemies.Tx.push(enemyTx);
      enemies.Ty.push(enemyTy);
      enemies.visible.push(true);
      enemyTx += 0.2;
      imageTx += 2.0;
    }
    enemyTx = 0;
    enemyTy += 0.2;
    imageTx = -5.9;
    imageTy += 2.0;
  }
}

/**
 * collision - checks for collions from players shots for enemies and
 * shields
 * @param {object} models - all model objects which could be effected by 
 * collisions
 * @param {object} enemyVariables - variables holding all enemy animation variables
 */
function collision(models, enemyVariables){

  //check if shot hit an enemy
  for(i = 0; i < 25; i++){
    if(models.enemies.visible[i] == true){
      if(models.shot.X1 + models.shot.Tx >= models.enemies.X1[i] 
          + enemyVariables.Tx &&
          models.shot.X1 + models.shot.Tx <= models.enemies.X4[i] 
          + enemyVariables.Tx)
      {
        if(models.shot.Y1 + models.shot.Ty <= models.enemies.Y1[i] 
            + enemyVariables.Ty &&
            models.shot.Y1 + models.shot.Ty >= models.enemies.Y4[i] 
            + enemyVariables.Ty)
        {
          //enemy was hit, increase speed, increase score
          models.enemies.visible[i] = false;
          models.shot.visible= false;
          enemyVariables.enemySpeed += 0.0005;
          enemyVariables.enemiesHit += 1;
          document.getElementById("score").innerHTML =
            "Score: " + enemyVariables.enemiesHit * 100;

        }
      }
    }
  }
  //check if shield was hit
  for(i = 0; i < 100; i++){
    if(models.shieldHitbox.visible[i] == false){
      if(models.shot.X1 + models.shot.Tx >= models.shieldHitbox.X1[i] &&
          models.shot.X1 + models.shot.Tx <= models.shieldHitbox.X4[i])
      {
        if(models.shot.Y1 + models.shot.Ty <= models.shieldHitbox.Y1[i] &&
            models.shot.Y1 + models.shot.Ty >= models.shieldHitbox.Y4[i])
        {
          //shield was hit turn on hit box
          models.shieldHitbox.visible[i] = true;
          models.shot.visible = false;
        }
      }
    }
  }
}

/**
 * animate - changes animated objects variables for every call from tick
 * @param {object} models - all model objects which could be animated
 * @param {object} enemyVariables - variables holding all enemy animation variables
 */
var last = Date.now();
function animate(models, enemyVariables){
  var now = Date.now();
  var elapsed = now - last;
  if(models.shot.visible == true)
  {
    collision(models, enemyVariables);
    models.shot.Ty += 0.05;
    if(models.shot.Ty >= 1.85){
      models.shot.Ty= 0;
      models.shot.visible = false;
    }
  }
  if(enemyVariables.direction == "right")
  {
    enemyVariables.Tx += enemyVariables.enemySpeed;
    if(enemyVariables.Tx >= 1)
    {
      enemyVariables.Ty -= 0.1;
      enemyVariables.direction = "left";
    }
  }
  if(enemyVariables.direction == "left")
  {
    if(enemyVariables.Tx <= 0)
    {
      enemyVariables.Ty -= 0.1;
      enemyVariables.direction = "right";
    }
    enemyVariables.Tx -= enemyVariables.enemySpeed;
  }
  if(enemyVariables.Ty <= -0.9 || enemyVariables.enemiesHit == enemyVariables.numberEnemies){
    reset(models,enemyVariables);
  } 
  if(elapsed >= 1000){
    last = now;
    if(enemyVariables.frame == 0){
      enemyVariables.frame = 1;
    }
    else{
      enemyVariables.frame = 0;
    }
  }
}

/**
 * reset - resets the game when player loses or wins
 * @param {object} models - all model objects which have been changed and need to
 * be reset
 * @param {object} enemyVariables - variables holding all enemy animation variables
 */
function reset(models, enemyVariables){
  //makes each enemy visible again
  for(i = 0; i < 25; i++){
    models.enemies.visible[i] = true;
  }
  //changes enemy speed and location back
  enemyVariables.enemySpeed = 0.001;
  enemyVariables.enemiesHit = 0;
  enemyVariables.Tx = 0;
  enemyVariables.Ty = 0;
}


/**
 * initShaderVariables - initilizes all shader variables
 * @param {object} gl - webgl program
 * @param {object} shaderVariables - variables holding shader variables to be 
 * initialized
 */
function initShaderVariables(gl, shaderVariables){
  
  //set up shaders and locations of shader variables
  //find and initialize a_Position
  shaderVariables.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(!shaderVariables.a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return false;
  }

  //find and initialize a_PointSize
  shaderVariables.a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
  if(!shaderVariables.a_PointSize < 0) {
    console.log('Failed to get the storage location of a_PointSize');
    return false;
  }

  //find and initialize a_TexCoord
  shaderVariables.a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if(!shaderVariables.a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return false;
  }

  //find and initialize u_xformMatrix
  shaderVariables.u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
  if(!shaderVariables.u_Translation < 0) {
    console.log('Failed to get the storage location of u_xformMatrix');
    return false;
  }

  //find and initialize u_Color
  shaderVariables.u_Color = gl.getUniformLocation(gl.program, 'u_Color');
  if(!shaderVariables.u_Color < 0) {
    console.log('Failed to get the storage location of u_Color');
    return false;
  }

  //find and initialize u_Sampler0 and u_Sampler1
  shaderVariables.u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  shaderVariables.u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if(!shaderVariables.u_Sampler0 || !shaderVariables.u_Sampler1){
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  return true;
}


/**
 * initTextures - initilizes all textures used 
 * @param {object} gl - webgl program
 * @param {object} textures - holds all textures used and needed 
 * to be initialized
 */
function initTextures(gl, textures){

  //create texture objects for each texture
  textures.enemy1.texture = gl.createTexture();
  textures.enemy2.texture = gl.createTexture();
  textures.shield.texture = gl.createTexture();
  textures.brick.texture = gl.createTexture();
  textures.player.texture = gl.createTexture();
  textures.white.texture  =  gl.createTexture();
  if(!textures.enemy1.texture || !textures.enemy2.texture ||
      !textures.white.texture || !textures.shield.texture ||
      !textures.brick.texture || !textures.player.texture){
        console.log('Failed to create texture object');
        return false
      }

  //create image objects for each texture
  textures.enemy1.image = new Image();
  textures.enemy2.image = new Image();
  textures.shield.image = new Image();
  textures.brick.image = new Image();
  textures.player.image = new Image();
  if(!textures.enemy1.image || !textures.enemy2.image 
      || !textures.shield.image || !textures.brick.image
      || !textures.player.image){
        console.log('Failed to create image object');
        return false;
      }

  //creates an onload function for each texture that calls 
  //handleLoadedTexture
  textures.enemy1.image.onload = function() {handleLoadedTexture(gl, textures.enemy1)}
  textures.enemy2.image.onload = function() {handleLoadedTexture(gl, textures.enemy2)}
  textures.shield.image.onload = function() {handleLoadedTexture(gl, textures.shield)}
  textures.brick.image.onload = function() {handleLoadedTexture(gl, textures.brick)}
  textures.player.image.onload = function() {handleLoadedTexture(gl, textures.player)}
  
  //source images for textures
  textures.enemy1.image.src = 'resources/invader1.png';
  textures.enemy2.image.src = 'resources/invader2.png';
  textures.shield.image.src = 'resources/shield.png';
  textures.brick.image.src = 'resources/paper.jpg';
  textures.player.image.src = 'resources/player.png';

  //creates a white pixel texture for objects without textures
  gl.bindTexture(gl.TEXTURE_2D, textures.white.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      textures.white.whitePixel);

  return true;
}

/**
 * handleLoadedTexture - once an image is loaded, prepares texture for use
 * @param {object} gl - webgl program
 * @param {object} texture - the texture that finished loading
 */
function handleLoadedTexture(gl, texture) {

  gl.bindTexture(gl.TEXTURE_2D, texture.texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

}

