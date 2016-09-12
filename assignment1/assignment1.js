//assignment1.js
//Jordan Salvago

//Vertex shader
//contains attribute variables for size and position of point
var VSHADER_SOURCE = 
  'attribute vec4 a_Position;\n' + 
  'attribute float a_PointSize;\n' +
  'void main() {\n' +
  ' gl_Position = a_Position;\n' +
  ' gl_PointSize = a_PointSize;\n' +
  '}\n';

//Fragment shader
//contains uniform variable for color
var FSHADER_SOURCE = 
 'precision mediump float;\n' +
 'uniform vec4 u_FragColor;\n' +
 'void main() {\n' +
 ' gl_FragColor = u_FragColor;\n' +
 '}\n';

function main() {
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
  
  //gets the storage location of a_position
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
    }
  
  //gets the storage location of a_PointSize
  var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
  if (a_PointSize < 0) {
    console.log('Failed to get the storage location of a_PointSize');
    return;
    }

  //gets the storage location of u_FragColor
  var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  //Registers the event handler to be called when a key is pressed
  document.onkeydown = function(ev){ keydown(ev, gl); };
  
  //Registers the event handler to be called when the mouse is clicked
  canvas.onmousedown = function(ev){ click(ev, gl, canvas, a_Position, a_PointSize, u_FragColor); };

  //registers the event handler to be called when the cursor hovers 
  //over the canvas
  canvas.onmousemove = function(ev){ 
    hover(ev, gl, canvas, a_Position, a_PointSize, u_FragColor); };

  //Specifies the color for clearing the canvas
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  //Clears canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
  }

var g_points = [];     //Array for position of points
var g_pointsizes = []; //Array of sizes for points
var g_colors = [];     //Array of colors for points
var size = 0.0;        //variable that contains the point size
var draw = false;      //variable that tells wether draw is selected
var red = 1.0;         //variable for color red
var green = 0.0;       //variable for color green
var blue = 0.0;        //variable for color blue

function keydown(ev,gl){

  //if the key pressed is up increase point size
  if(ev.keyCode == 38){
  size += 0.5;
  }

  //if the key pressed is down decrease point size unless point value
  //would become negative
  if(ev.keyCode == 40 && size > 0.5){
    size -= 0.5;
  }

  //if the key pressed is 'D' then change mode from click points to hover
  //draw or vice versa
  if(ev.keyCode == 68){
    if(draw == false){
      draw = true;
    }
    else{
      draw = false;
    }
  }

  //if the key pressed is right then cycle through colors in order r g b
  if(ev.keyCode == 39){
    if(red == 1.0){
      red = 0.0;
      green = 1.0;
    }
    else if(green == 1.0){
      green = 0.0;
      blue = 1.0;
    }
    else{
      blue = 0.0;
      red = 1.0;
    }
  }

  //if the key pressed is left then cycle through colors in order b g r
  if(ev.keyCode == 37){
    if(red == 1.0){
      red = 0.0;
      blue = 1.0;
    }
    else if(green == 1.0){
      green = 0.0;
      red = 1.0;
    }
    else{
      blue = 0.0;
      green = 1.0;
    }
  }

  //if key pressed was delete/backspace, clear the canvas
  if(ev.keyCode == 8){
    g_points= [];
    g_pointsizes= [];
    g_colors= [];
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
}

function click(ev, gl, canvas, a_Position, a_PointSize, u_FragColor) {
  if(draw == false){
    var x = ev.clientX; //x coordinate of mouse pointer location
    var y = ev.clientY; //y coordinate of mouse pointer location
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    //store coordinates given of mouse pointer in g_points
    g_points.push([x,y]);
    //store current size of point in g_pointsizes
    g_pointsizes.push(size);
    //store current color of point in g_colors
    g_colors.push([red, green, blue, 1.0]);
    
    //clears canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    var len = g_points.length

    //iterates though g_points and draws each one to canvas
    for(var i = 0; i < len; i++){
      var xy = g_points[i];
      var rgba = g_colors[i];

      //change value of a_position variable
      gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
      //change value of a_PointSize variable
      gl.vertexAttrib1f(a_PointSize,g_pointsizes[i] );
      //change value of u_Fragcolor variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      //draw point
      gl.drawArrays(gl.POINTS, 0, 1);
    }
  }
}

function hover(ev, gl, canvas, a_Position, a_PointSize, u_FragColor) {
  if(draw == true){
    var x = ev.clientX; //x coordinate of mouse pointer location
    var y = ev.clientY; //y coordinate of mouse pointer location
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    //store coordinates given of mouse pointer in g_points
    g_points.push([x,y]);
    //store current size of point in g_pointsizes
    g_pointsizes.push(size);
    //store current color of point in g_colors
    g_colors.push([red, green, blue, 1.0]);
    
    //clears canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    var len = g_points.length

    //iterates though g_points and draws each one to canvas
    for(var i = 0; i < len; i++){
      var xy = g_points[i];
      var rgba = g_colors[i];

      //change value of a_position variable
      gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
      //change value of a_PointSize variable
      gl.vertexAttrib1f(a_PointSize,g_pointsizes[i] );
      //change value of u_Fragcolor variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      //draw point
      gl.drawArrays(gl.POINTS, 0, 1);
    }
  }
}
