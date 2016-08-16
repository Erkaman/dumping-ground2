(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//var loadJson = require('./common.js').loadJson

var canvas = document.body.appendChild(document.createElement('canvas'))
canvas.width = 1
canvas.height = 1

//const regl = require('../regl')({canvas: canvas, extensions: ['oes_texture_float']})

//loadJson(function (jsonData) {
//  var cnnGpu = require('./gpu.js')(regl, jsonData)

  var container = document.createElement('div')
  container.style.cssText = 'margin: 0 auto; max-width: 960px;' // center text.
  container.style.fontWeight = '300' // default font weight
  container.style.fontSize = '1.0rem' // default font size
  container.style.fontFamily = "'Roboto',Helvetica,sans-serif"
  container.style.color = '#444444'
  document.body.appendChild(container)

  var par = document.createElement('h1')
  par.innerHTML = 'GPU Deep Learning Demo'
  par.style.fontWeight = '400'
  par.style.fontSize = '2rem'

  container.appendChild(par)

  par = document.createElement('p')
  par.innerHTML = 'Please draw a character into this canvas.'
  container.appendChild(par)

  // create drawing canvas.
  canvas = document.createElement('canvas')
  canvas.width = 280
  canvas.height = 280
  canvas.style.borderWidth = 1
  canvas.style.borderStyle = 'solid'
  container.appendChild(canvas)
  var ctx = canvas.getContext('2d')

  var div = document.createElement('div')

  var btn = document.createElement('button')
  btn.innerHTML = 'Clear'
  btn.addEventListener('click', function (e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, false)
  div.appendChild(btn)

  btn = document.createElement('button')
  btn.innerHTML = 'Recognize'
  btn.addEventListener('click', function (e) {
    recognize()
  }, false)
  div.appendChild(btn)

  container.appendChild(div)

  var digitPar = document.createElement('p')
  digitPar.innerHTML = ''
  digitPar.style.fontWeight = '800'
  digitPar.style.fontSize = '4em'
  container.appendChild(digitPar)

  // add listeners.
  canvas.addEventListener('mousemove', function (e) {
    canvasListener('move', e)
  }, false)
  canvas.addEventListener('mousedown', function (e) {
    canvasListener('down', e)
  }, false)
  canvas.addEventListener('touchstart', function (e) {
    canvasListener('down', e)
  }, false)
  canvas.addEventListener('touchend', function (e) {
    canvasListener('up', e)
  }, false)
  canvas.addEventListener('touchmove', function (e) {
    canvasListener('move', e)
  }, false)
  canvas.addEventListener('mouseup', function (e) {
    canvasListener('up', e)
  }, false)
  canvas.addEventListener('mouseout', function (e) {
    canvasListener('out', e)
  }, false)

  var lineWidth = 20
  var isMousedown = false

  function drawCircle (e) {
    var x = e.pageX - canvas.offsetLeft
    var y = e.pageY - canvas.offsetTop

    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.arc(x, y, lineWidth / 2, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.closePath()
    ctx.fill()
  }

  function canvasListener (cmd, e) {
    if (cmd === 'down') {
      isMousedown = true
      drawCircle(e)
    } else if (cmd === 'up') {
      isMousedown = false
    } else if (cmd === 'move' && isMousedown) {
      drawCircle(e)
      e.preventDefault(); // prevent any scrolling.
    }
  }

  // computes center of mass of digit, for centering
  // note 1 stands for black (0 white) so we have to invert.
  function centerImage (img) {
    var meanX = 0
    var meanY = 0
    var rows = img.length
    var columns = img[0].length
    var sumPixels = 0

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < columns; x++) {
        var pixel = (1 - img[y][x])
        sumPixels += pixel

        meanY += y * pixel
        meanX += x * pixel
      }
    }

    meanX /= sumPixels
    meanY /= sumPixels

    var dY = Math.round(rows / 2 - meanY)
    var dX = Math.round(columns / 2 - meanX)
    return {transX: dX, transY: dY}
  }

  // given grayscale image, find bounding rectangle of digit defined
  // by above-threshold surrounding
  function getBoundingRectangle (img, threshold) {
    var rows = img.length
    var columns = img[0].length
    var minX = columns
    var minY = rows
    var maxX = -1
    var maxY = -1
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < columns; x++) {
        if (img[y][x] < threshold) {
          if (minX > x) minX = x
          if (maxX < x) maxX = x
          if (minY > y) minY = y
          if (maxY < y) maxY = y
        }
      }
    }
    return {minY: minY, minX: minX, maxY: maxY, maxX: maxX}
  }

  // take canvas image and convert to grayscale. Mainly because my
  // own functions operate easier on grayscale, but some stuff like
  // resizing and translating is better done with the canvas functions
  function imageDataToGrayscale (imgData) {
    var grayscaleImg = []
    for (var y = 0; y < imgData.height; y++) {
      grayscaleImg[y] = []
      for (var x = 0; x < imgData.width; x++) {
        var offset = y * 4 * imgData.width + 4 * x
        var alpha = imgData.data[offset + 3]
        // weird: when painting with stroke, alpha == 0 means white
        // alpha > 0 is a grayscale value in that case I simply take the R value
        if (alpha === 0) {
          imgData.data[offset + 0] = 255
          imgData.data[offset + 1] = 255
          imgData.data[offset + 2] = 255
        }
        imgData.data[offset + 3] = 255
        // simply take red channel value. Not correct, but works for
        // black or white images.
        grayscaleImg[y][x] = imgData.data[y * 4 * imgData.width + x * 4 + 0] / 255
      }
    }
    return grayscaleImg
  }

  function recognize () {
    // convert RGBA image to a grayscale array, then compute bounding rectangle and center of mass
    var imgData = ctx.getImageData(0, 0, 280, 280)
    var grayscaleImg = imageDataToGrayscale(imgData)

    var boundingRectangle = getBoundingRectangle(grayscaleImg, 0.01)
    //  console.log('boundingRectangle ', boundingRectangle)

    var trans = centerImage(grayscaleImg) // [dX, dY] to center of mass
    //  console.log('trans ', trans)

    // copy image to hidden canvas, translate to center-of-mass, then
    // scale to fit into a 200x200 box (see MNIST calibration notes on
    // Yann LeCun's website)
    var canvasCopy = document.createElement('canvas')
    canvasCopy.width = imgData.width
    canvasCopy.height = imgData.height
    var copyCtx = canvasCopy.getContext('2d')
    var brW = boundingRectangle.maxX + 1 - boundingRectangle.minX
    var brH = boundingRectangle.maxY + 1 - boundingRectangle.minY
    var scaling = 190 / (brW > brH ? brW : brH)
    // scale
    copyCtx.translate(canvas.width / 2, canvas.height / 2)
    copyCtx.scale(scaling, scaling)
    copyCtx.translate(-canvas.width / 2, -canvas.height / 2)
    // translate to center of mass
    copyCtx.translate(trans.transX, trans.transY)

    // default take image from original canvas
    copyCtx.drawImage(ctx.canvas, 0, 0)

    // now bin image into 10x10 blocks (giving a 28x28 image)
    imgData = copyCtx.getImageData(0, 0, 280, 280)
    grayscaleImg = imageDataToGrayscale(imgData)

    var nnInput = new Array(784)
    for (var y = 0; y < 28; y++) {
      for (var x = 0; x < 28; x++) {
        var mean = 0
        for (var v = 0; v < 10; v++) {
          for (var h = 0; h < 10; h++) {
            mean += grayscaleImg[y * 10 + v][x * 10 + h]
          }
        }

        mean = (1 - mean / 100) // average and invert
        nnInput[x + y * 28] = mean
      }
    }
/*
    var res = cnnGpu(nnInput)
    console.log('result: ', res)
*/
    var actual = res.indexOf(Math.max.apply(null, res))
    digitPar.innerHTML = actual + ''
  }
//})

},{}]},{},[1]);
