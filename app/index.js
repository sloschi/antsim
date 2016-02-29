'use strict';

const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);
const EffectComposer = require('three-effectcomposer')(THREE);
const SSAOShader = require('./app/postprocessing/ssaoshader');
//const FXAAShader = require('three-shader-fxaa')(THREE);

const Ant = require('./app/ant');

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var clock = new THREE.Clock();

var renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// post processing
var depthMaterial, effectComposer, depthRenderTarget;
var ssaoPass;
var renderPass = new EffectComposer.RenderPass(scene, camera);
var depthShader = THREE.ShaderLib['depthRGBA'];
var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);
depthMaterial = new THREE.ShaderMaterial({
    fragmentShader: depthShader.fragmentShader,
    vertexShader: depthShader.vertexShader,
    uniforms: depthUniforms,
    blending: THREE.NoBlending
});
var pars = {
    minFilter: THREE.LinearFilter,
    magFilteR: THREE.LinearFilter
};
depthRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

// ssao pass
ssaoPass = new EffectComposer.ShaderPass(SSAOShader);
ssaoPass.renderToScreen = true;
ssaoPass.uniforms["tDepth"].value = depthRenderTarget;
ssaoPass.uniforms['size'].value.set(window.innerWidth, window.innerHeight);
ssaoPass.uniforms['cameraNear'].value = camera.near;
ssaoPass.uniforms['cameraFar'].value = camera.far;
ssaoPass.uniforms['aoClamp'].value = 0.6;
ssaoPass.uniforms['lumInfluence'].value = 0.2;
 
effectComposer = new EffectComposer(renderer);
effectComposer.addPass(renderPass);
effectComposer.addPass(ssaoPass);

var controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = false;

var ants = [];
var hives = [];
var foodSources = [];
var spiders = [];

camera.position.z = 5;
camera.position.y = 40;
camera.rotation.x += Math.PI / 2;

const HiveColors = [
    { name: 'RED', color: 0xF44336 },
    { name: 'GREEN', color: 0x4CAF50 },
    { name: 'BLUE', color: 0x2196F3 },
    { name: 'YELLOW', color: 0xFFEB3B }
];

const AntColors = {
    'RED': 0xEF5350,
    'GREEN': 0x66BB6A,
    'BLUE': 0x42A5F5,
    'YELLOW': 0xFFEE58
}

/**
 * Creates a hive.
 * @param config - The configuration of this hive.
 * @param config.color - a hive color
 */
function createHive(config) {
    var geometry = new THREE.BoxGeometry(5, 5, 2);
    var material = new THREE.MeshBasicMaterial({ color: config.color.color });
    var hive = new THREE.Mesh(geometry, material);
    hive.rotation.x += Math.PI / 2;

    return hive;
}

/**
 * Creates a single ant.
 * @param config - The configuration of this ant.
 * @param config.color - The color of this ant.
 */
function createAnt(config) {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({ color: config.color });
    var antModel = new THREE.Mesh(geometry, material);
    antModel.rotation.x += Math.PI / 2;

    return new Ant({ size: 100 }, config, antModel);
}

/**
 * Creates the world.
 * @param config - The configuration of the world.
 * @param config.size number - The size of the world (squared -> size 100 is a world of 100x100 units)
 * @param config.numHives - The number of hives in the world.
 */
function createWorld(config) {
    // const grid = new THREE.GridHelper(config.size / 2, 1);
    // grid.position.y += 0.1;
    // scene.add(grid);

    var geometry = new THREE.PlaneGeometry(config.size, config.size, 1);
    var material = new THREE.MeshBasicMaterial({ color: 0x795548, side: THREE.DoubleSide });
    var ground = new THREE.Mesh(geometry, material);
    ground.rotation.x += Math.PI / 2;
    scene.add(ground);

    // add hives
    for (let i = 0; i < config.numHives; i++) {
        let hive = createHive({ color: HiveColors[i] }),
            pos = (config.size / 4) + 0.5,
            hivePos;

        if (i === 0) {
            hivePos = new THREE.Vector3(-pos, 1, pos);
        }

        if (i === 1) {
            hivePos = new THREE.Vector3(pos, 1, -pos);
        }

        if (i === 2) {
            hivePos = new THREE.Vector3(-pos, 1, -pos);
        }

        if (i === 3) {
            hivePos = new THREE.Vector3(pos, 1, pos);
        }

        hive.position.copy(hivePos);

        scene.add(hive);

        for (let j = 0; j < 100; j++) {
            let ant = createAnt({ color: AntColors[HiveColors[i].name], position: hivePos });
            scene.add(ant.getModel());

            ants.push(ant);
        }
    }

    // var axisHelper = new THREE.AxisHelper(5); scene.add(axisHelper);

    camera.lookAt(ground);
}

var influence = {
        north: false,
        east: false,
        south: false,
        west: false
    };

var io = require('socket.io-client');
var socket = io.connect('http://antsim.azurewebsites.net');

socket.on('go north', function () {
    influence.north = !influence.north;
    logInfluenceChange();
});

socket.on('go south', function () {
    influence.south = !influence.south;
    logInfluenceChange();
});
socket.on('go east', function () {
    influence.east = !influence.east;
    logInfluenceChange();
});
socket.on('go west', function () {
    influence.west = !influence.west;
    logInfluenceChange();
});
socket.on('go random', function () {
    influence = {
        north: false,
        east: false,    
        south: false,
        west: false
    };
    logInfluenceChange();
});

function logInfluenceChange() {
    console.log('influence changed', influence);
}

function moveAnts() {
    ants.forEach(ant => ant.move(influence));
}

let elapsedTime = 0;
clock.start();

function render() {
    requestAnimationFrame(render);

    controls.update();
    
    // Render depth into depthRenderTarget
    scene.overrideMaterial = depthMaterial;
    renderer.render(scene, camera, depthRenderTarget, true);

    // Render renderPass and SSAO shaderPass
    scene.overrideMaterial = null;
    effectComposer.render();

    elapsedTime += clock.getDelta();
    if (elapsedTime > 0.1) {
        elapsedTime = 0;
        moveAnts();
    }
}

createWorld({ size: 100, numHives: 2 });

render();