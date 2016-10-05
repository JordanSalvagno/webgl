/**assignment3.js
 *@fileoverview uses webgl to create a space invaders style game
 *makes use of matricies to translate and scale game objects.
 *also uses animation techniques to animate enemies and projectiles
 *References TwoBuffers.js as well as examples from Matsuda
 *@author Jordan Salvagno
 */

function main() {
  //Vertex shader program
  var VSHADER_SOURCE = 
    'attribute vec4 a_Position;\n' +
    'attribute float a_PointSize;\n'+
    'uniform mat4 u_xformMatrix;\n'+
    'void main() {\n' +
      ' gl_Position = u_xformMatrix *  a_Position;\n' +
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
    a_Position:0,
    u_color:0,
    a_PointSize:0,
    u_xformMatrix:0
  };

  //variables used to handle enemy movement
  var enemyVariables = {
    Tx:0,
    Ty:0,
    direction:"right",
    enemiesHit:0,
    enemySpeed:0.001,
    numberEnemies:25
  };

  //player object
  var player={
    verticies: new Float32Array([
                   -0.05,  -0.8,
                   -0.05, -0.85,
                   0.05,  -0.8,
                   0.05, -0.85
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
  }

  //shield object
  var shield={
    verticies: new Float32Array([
                   -0.05, -0.85,
                   0.05, -0.85,
                   -0.05, -0.75,
                   0.05, -0.75,
                   -0.05, -0.65,
                   0.25, -0.65,
                   0.15, -0.75,
                   0.25, -0.75,
                   0.15, -0.85,
                   0.25, -0.85
                   ]),
    modelMatrix: new Matrix4,
    buffer:0,
    n:10,
    Tx:[],
    Ty:0,
    Sx:1,
    Sy:0.75
  }

  //fills locations for multiple shields
  createShields(shield);

  // enemy objects
  var enemies={
    verticies: new Float32Array([
                   -0.6, 0.2,
                   -0.6, 0.1,
                   -0.5, 0.2,
                   -0.5, 0.1
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
    //enemy design
    enemyType1:{
      verticies: new Float32Array([
                     -0.1, 0.1,
                     -0.1, 0.2,
                     -0.1, 0.3,
                     0.0, 0.3,
                     0.0, 0.4,
                     0.1, 0.1,
                     0.1, 0.2,
                     0.1, 0.3,
                     0.1, 0.4,
                     0.1, 0.5,
                     0.1, 0.7,
                     0.2, 0.0,
                     0.2, 0.2,
                     0.2, 0.3,
                     0.2, 0.5,
                     0.2, 0.6,
                     0.3, 0.0,
                     0.3, 0.2,
                     0.3, 0.3,
                     0.3, 0.4,
                     0.3, 0.5,
                     0.4, 0.2,
                     0.4, 0.3,
                     0.4, 0.4,
                     0.4, 0.5,
                     0.5, 0.0,
                     0.5, 0.2,
                     0.5, 0.3,
                     0.5, 0.4,
                     0.5, 0.5,
                     0.6, 0.0,
                     0.6, 0.2,
                     0.6, 0.3,
                     0.6, 0.5,
                     0.6, 0.6,
                     0.7, 0.1,
                     0.7, 0.2,
                     0.7, 0.3,
                     0.7, 0.4,
                     0.7, 0.5,
                     0.7, 0.7,
                     0.8, 0.3,
                     0.8, 0.4,
                     0.9, 0.1,
                     0.9, 0.2,
                     0.9, 0.3
                       ]),
                     modelMatrix: new Matrix4,
                     buffer:0,
                     n:46,
                     Tx:[],
                     Ty:[],
                     Tz:0
    }
  }
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
  }

  //fills location arrays for multiple hitboxes
  createShieldHitbox(shieldHitbox);

  //object to hold various object models
  var models = {
    player,
    shot,
    enemies,
    shield,
    shieldHitbox
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

  shaderVariables.u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
  if(!shaderVariables.u_Translation < 0) {
    console.log('Failed to get the storage location of u_xformMatrix');
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
    keydown(ev, gl, shaderVariables, enemyVariables, models); };

  //update html score
  document.getElementById("score").innerHTML = "Score: " + enemyVariables.enemiesHit * 100;

  //sets background color
  gl.clearColor(0, 0, 0, 1.0);

  //start animation loop

  /**
   * tick - callback function to animate/redraw
   */
  var tick = function(){
    animate(models,enemyVariables);
    renderScene(gl, shaderVariables, enemyVariables, models);
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


  //set up enemy type 1 image
  models.enemies.enemyType1.buffer = gl.createBuffer();
  if(!models.enemies.enemyType1.buffer){
    console.log('Failed to create enemyType1 buffer object');
    return false;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, models.enemies.enemyType1.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.enemies.enemyType1.verticies, gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderVariables.a_Position, 2, gl.FLOAT, false, 0 ,0);
  gl.enableVertexAttribArray(shaderVariables.a_Position);

  //set up enemy hit boxes
  models.enemies.buffer = gl.createBuffer();
  if(!models.enemies.buffer){
    console.log('Failed to create enemy buffer object');
    return false;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, models.enemies.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, models.enemies.verticies, gl.STATIC_DRAW);
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
function renderScene(gl, shaderVariables, enemyVariables, models){

  gl.clear(gl.COLOR_BUFFER_BIT);

  // draw player
  gl.uniform4f(shaderVariables.u_Color, 0.2 , 0.9, 0.2, 1);
  gl.uniformMatrix4fv( shaderVariables.u_xformMatrix, false, models.player.modelMatrix.elements);
  gl.bindBuffer(gl.ARRAY_BUFFER, models.player.buffer);
  gl.vertexAttribPointer(
      shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, models.player.n);

  //draw shields
  for(i = 0; i < 4; i++)
  {
    //scales shields smaller
    models.shield.modelMatrix.setScale(models.shield.Sx, models.shield.Sy, 1);
    models.shield.modelMatrix.translate(models.shield.Tx[i], 0, 0);
    gl.uniform4f(shaderVariables.u_Color, 0.2 , 0.9, 0.2, 1);
    gl.uniformMatrix4fv( shaderVariables.u_xformMatrix, false, models.shield.modelMatrix.elements);
    gl.bindBuffer(gl.ARRAY_BUFFER, models.shield.buffer);
    gl.vertexAttribPointer(
        shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, models.shield.n);
  }

  for(i = 0; i < models.shieldHitbox.numberOfHitboxes; i++)
  {
    if(models.shieldHitbox.visible[i] == true){
      models.shieldHitbox.modelMatrix.setTranslate(models.shieldHitbox.Tx[i],
                                                   models.shieldHitbox.Ty[i], 0);
      gl.uniform4f(shaderVariables.u_Color, 0 , 0, 0, 1);
      gl.uniformMatrix4fv( shaderVariables.u_xformMatrix, false, 
                            models.shieldHitbox.modelMatrix.elements);
      gl.bindBuffer(gl.ARRAY_BUFFER, models.shieldHitbox.buffer);
      gl.vertexAttribPointer(
          shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, models.shieldHitbox.n);
    }
  }

  // draw enemies
  for(i = 0; i < 25; i++){
    if(models.enemies.visible[i] == true){
      models.enemies.modelMatrix.setTranslate(
                            models.enemies.Tx[i] + enemyVariables.Tx,
                            models.enemies.Ty[i] + enemyVariables.Ty, 0);
      gl.uniform4f(shaderVariables.u_Color, 0, 0, 0, 0);
      gl.uniformMatrix4fv( shaderVariables.u_xformMatrix, false, 
                           models.enemies.modelMatrix.elements);
      gl.bindBuffer(gl.ARRAY_BUFFER, models.enemies.buffer);
      gl.vertexAttribPointer(
          shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, models.enemies.n);

      //draw enemy type 1
      models.enemies.enemyType1.modelMatrix.setScale(0.10, 0.10, 1);
      models.enemies.enemyType1.modelMatrix.translate(
          (enemyVariables.Tx * 10)+ models.enemies.enemyType1.Tx[i], 
          (enemyVariables.Ty * 10) + models.enemies.enemyType1.Ty[i], 0);
      gl.uniform4f(shaderVariables.u_Color, 1, 1, 1, 1);
      gl.vertexAttrib1f(shaderVariables.a_PointSize, 3);
      gl.uniformMatrix4fv( shaderVariables.u_xformMatrix, false, 
                           models.enemies.enemyType1.modelMatrix.elements);
      gl.bindBuffer(gl.ARRAY_BUFFER, models.enemies.enemyType1.buffer);
      gl.vertexAttribPointer(
          shaderVariables.a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, models.enemies.enemyType1.n);
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
  renderScene(gl, shaderVariables,enemyVariables, models);
}


/**
 * createShields - fills location arrays for multiple shields
 * @params {object} shield - shield objects to be filled with multiple locations
 */
function createShields(shield){
  tmp = [];
  Tx = -0.9
    for(i = 0; i < 4; i++){
      shield.Tx.push(Tx);
      Tx += 0.5;
    }
  return tmp;
}

/**
 * createShieldHitbox - fills locations for multiple shield hitboxes
 * @paramss {Objec} shieldHitbox - shieldHitbox object to have location
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
 * @params {Object} enemies - enemies object to have locations filled
 */
function createEnemies(enemies){
  var x1 = -0.6;
  var x4 = -0.5;
  var y1 =  0.2;
  var y4 = 0.1;
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
      enemies.enemyType1.Ty.push(imageTy);
      enemies.enemyType1.Tx.push(imageTx);
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
 * @params {models} - all model objects which could be effected by 
 * collisions
 * @param {enemyVariables} - variables holding all enemy animation variables
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
          enemyVariables.enemySpeed += 0.001;
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
 * @params {models} - all model objects which could be animated
 * @param {enemyVariables} - variables holding all enemy animation variables
 */
function animate(models, enemyVariables){
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
    if(enemyVariables.Tx >= 0.7)
    {
      enemyVariables.Ty -= 0.1;
      enemyVariables.direction = "left";
    }
  }
  if(enemyVariables.direction == "left")
  {
    if(enemyVariables.Tx <= -0.4)
    {
      enemyVariables.Ty -= 0.1;
      enemyVariables.direction = "right";
    }
    enemyVariables.Tx -= enemyVariables.enemySpeed;
  }
  if(enemyVariables.Ty <= -0.9 || enemyVariables.enemiesHit == enemyVariables.numberEnemies){
    reset(models,enemyVariables);
  }
}

/**
 * reset - resets the game when player loses or wins
 * @params {models} - all model objects which have been changed and need to
 * be reset
 * @param {enemyVariables} - variables holding all enemy animation variables
 */
function reset(models, enemyVariables){
  //makes each enemy visible again
  for(i = 0; i < 25; i++){
    models.enemies[i].visible = true;
  }
  //changes enemy speed and location back
  enemyVariables.enemySpeed = 0.001;
  enemyVariables.enemiesHit = 0;
  enemyVariables.Tx = 0;
  enemyVariables.Ty = 0;
}

