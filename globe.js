window.addEventListener("load", prepare);

function prepare() {
  var data = {};//json data set
  var queue = new createjs.LoadQueue();
  queue.addEventListener("fileload", handleFileLoad);
  queue.addEventListener("complete", handleComplete);
  queue.loadFile({id: "globalmap", src: "json/globalmap.topojson"});

  function handleFileLoad(event) {
    var item = event.item;
    var id = item.id;
    if (id == "globalmap") {
      result = JSON.parse(event.result);//json string to object
      data.globalmap = topojson.feature(result, result.objects.countries).features;//topojson to geojson
    }
  }

  function handleComplete() {
    window.removeEventListener("load", prepare);
    queue.removeEventListener("fileload", handleFileLoad);
    queue.removeEventListener("complete", handleComplete);
    init(data);
  }
}

function init(data) {
  var sin = Math.sin;
  var cos = Math.cos;
  var abs = Math.abs;
  var degToRad = Math.PI / 180;
  var cw = 600;//canvas width
  var ch = 600;//canvas height
  var gr = 270;//globe radius
  var rotate = [0, 0, 0];
  var oldX = 0;
  var oldY = 0;
  var vx = 0;
  var vy = 0;
  var ax = 0;
  var ay = 0;
  var canvas_elt = document.getElementById("globe");
  canvas_elt.setAttribute("width", String(cw));
  canvas_elt.setAttribute("height", String(ch));

  console.log(data.globalmap);
  var orthographic;
  var projection;

  var stage = new createjs.Stage("globe");

  var universe = new createjs.Container();
  universe.x = cw / 2;
  universe.y = ch / 2;
  stage.addChild(universe);

  var globe = new createjs.Shape();
  globe.graphics.beginFill("black").drawCircle(0, 0, gr);
  universe.addChild(globe);

  var lands;

  function drawGlobe(rotate){
    universe.removeChild(lands);
    lands = new createjs.Container();
    universe.addChild(lands);

    data.globalmap.forEach((country, l) => {
      const drawCountry = (land, country) => {
        country.geometry.coordinates.forEach((island, j, coordinates) => {
          var line = new createjs.Shape();
          var past_point = [];
          var visible = true;
          var past_k;
          var start = [];
          var crds = (coordinates.length == 1) ? island : island[0];
          crds.forEach((vertex, i, verticies) => {
            var px = vertex[0] * degToRad;//point x
            var py = vertex[1] * degToRad;//point y
            var rx = rotate[0] * degToRad;//rotate x
            var ry = rotate[1] * degToRad;//rotate y
            var k = cos(rx) * cos(ry) * cos(px) * cos(py)
                  + sin(rx) * cos(ry) * sin(px) * cos(py)
                  +           sin(ry) *           sin(py); //points k < 0 can see
            var x = gr * sin(px - rx) * cos(py);
            var y = gr * (sin(py) - k * sin(ry)) / cos(ry);

            if ((i === verticies.length - 1) && (visible === false)) {
              line.graphics.arcTo(x, y, start[0], start[1], gr);
            }

            if (past_point.length !== 0) {
              if (k < 0) {
                if (!visible) {
                  start = [x, y];
                }
                line.graphics.lineTo(x, y);
              }
            } else {
              if (k >= 0) {
                visible = false;
              } else {
                line.graphics.beginStroke("orange").beginFill("yellow").moveTo(x, y);
              }
            }

            past_point = [x,y];
          });
          line.graphics.endStroke().endFill();
          land.addChild(line);
        });
        return land;
      };
      var land = new createjs.Container();
      land = drawCountry(land, country);
      lands.addChild(land);
    });
  }

  drawGlobe(rotate);

  // インタラクティブの設定
  stage.addEventListener("mousedown", (event) => {
    oldX = stage.mouseX;
    oldY = stage.mouseY;
  });
  stage.addEventListener("pressmove", (event) => {
    nowX = stage.mouseX;
    nowY = stage.mouseY;
    ax = ax + nowX - oldX;
    ay = ay + nowY - oldY;
    oldX = nowX;
    oldY = nowY;
  });
  stage.addEventListener("pressup", (event) => {
    console.log("pressup");
  });

  // 時間制御
  createjs.Ticker.addEventListener("tick", () => {
    rotate = [rotate[0] + vx, rotate[1] + vy, 0];
    vx = vx * 0.8 - ax / 9;
    vx = (abs(vx) > 0.01) ? vx : 0;
    vy = vy * 0.8 + ay / 9;
    vy = (abs(vy) > 0.01) ? vy : 0;
    ax = 0;
    ay = 0;
    drawGlobe(rotate);
    stage.update();
  });
}
