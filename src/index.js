// ThreeJS and Third-party deps
import * as THREE from "three"
import * as dat from 'dat.gui'
import Stats from "three/examples/jsm/libs/stats.module"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

// Core boilerplate code deps
import { createCamera, createRenderer, runApp, updateLoadingProgressBar, getDefaultUniforms } from "./core-utils"

import Leaves from "./assets/leaves.jpg"
import vertexShader from "./shaders/vertex.glsl"
import fragmentShader from "./shaders/fragment.glsl"
import Diamond from "./assets/diamond.glb"

global.THREE = THREE
// previously this feature is .legacyMode = false, see https://www.donmccurdy.com/2020/06/17/color-management-in-threejs/
// turning this on has the benefit of doing certain automatic conversions (for hexadecimal and CSS colors from sRGB to linear-sRGB)
THREE.ColorManagement.enabled = true

/**************************************************
 * 0. Tweakable parameters for the scene
 *************************************************/
const params = {
  // general scene params
}
const uniforms = {
  ...getDefaultUniforms(),
  envMap: { value: null }
}


/**************************************************
 * 1. Initialize core threejs components
 *************************************************/
// Create the scene
let scene = new THREE.Scene()

// Create the renderer via 'createRenderer',
// 1st param receives additional WebGLRenderer properties
// 2nd param receives a custom callback to further configure the renderer
let renderer = createRenderer({ antialias: true }, (_renderer) => {
  // best practice: ensure output colorspace is in sRGB, see Color Management documentation:
  // https://threejs.org/docs/#manual/en/introduction/Color-management
  _renderer.outputColorSpace = THREE.SRGBColorSpace
  _renderer.autoClear = false
})

// Create the camera
// Pass in fov, near, far and camera position respectively
let camera = createCamera(50, 1, 1000, { x: 0, y: 0, z: 5 })
// Create the ortho camera
let orthoCamera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  1,
  1000
)
orthoCamera.layers.set(1)
orthoCamera.position.z = 5


/**************************************************
 * 2. Build your scene in this threejs app
 * This app object needs to consist of at least the async initScene() function (it is async so the animate function can wait for initScene() to finish before being called)
 * initScene() is called after a basic threejs environment has been set up, you can add objects/lighting to you scene in initScene()
 * if your app needs to animate things(i.e. not static), include a updateScene(interval, elapsed) function in the app as well
 *************************************************/
let app = {
  async initScene() {
    // OrbitControls
    this.controls = new OrbitControls(camera, renderer.domElement)
    this.controls.enableDamping = true
    // this.controls.enableZoom = false

    this.envFbo = new THREE.WebGLRenderTarget(
      window.innerWidth * window.devicePixelRatio,
      window.innerHeight * window.devicePixelRatio
    )

    await updateLoadingProgressBar(0.1)

    // create scene background
    const tex = await this.loadTexture(Leaves)
    tex.colorSpace = THREE.SRGBColorSpace
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshBasicMaterial({ map: tex })
    )
    this.quad.layers.set(1) // only seen by the orthographic camera
    this.quad.scale.set(window.innerHeight * 2, window.innerHeight, 1) // for the 2:1 texture to look right, and fit the browser screen correctly
    scene.add(this.quad)
    
    await updateLoadingProgressBar(0.5)

    // add the diamond
    uniforms.envMap.value = this.envFbo.texture
    this.refractionMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms
    })
    let { model } = await this.loadModel(Diamond)
    model.children[0].material = this.refractionMaterial
    this.model = model.children[0]
    scene.add(this.model)

    // GUI controls
    const gui = new dat.GUI()

    // Stats - show fps
    this.stats1 = new Stats()
    this.stats1.showPanel(0) // Panel 0 = fps
    this.stats1.domElement.style.cssText = "position:absolute;top:0px;left:0px;"
    // this.container is the parent DOM element of the threejs canvas element
    this.container.appendChild(this.stats1.domElement)

    await updateLoadingProgressBar(1.0, 100)
  },
  async loadTexture(url) {
    this.textureLoader = this.textureLoader || new THREE.TextureLoader()
    return new Promise(resolve => {
      this.textureLoader.load(url, texture => {
        resolve(texture)
      })
    })
  },
  async loadModel(url) {
    this.modelLoader = this.modelLoader || new GLTFLoader()
    return new Promise(resolve => {
      this.modelLoader.load(url, gltf => {
        const result = { model: gltf.scene }
        resolve(result)
      })
    })
  },
  // @param {number} interval - time elapsed between 2 frames
  // @param {number} elapsed - total time elapsed since app start
  updateScene(interval, elapsed) {
    this.controls.update()
    this.stats1.update()

    renderer.clear()

    // render env to fbo
    renderer.setRenderTarget(this.envFbo)
    renderer.render(scene, orthoCamera)

    // render env to screen
    renderer.setRenderTarget(null)
    renderer.render(scene, orthoCamera)
    renderer.clearDepth()

    this.model.rotation.y += interval

    // render diamond
    renderer.render(scene, camera)
  },
  resize() {
    this.envFbo.setSize(
      window.innerWidth * window.devicePixelRatio,
      window.innerHeight * window.devicePixelRatio
    )

    this.quad.scale.set(window.innerHeight * 2, window.innerHeight, 1)

    orthoCamera.left = window.innerWidth / -2
    orthoCamera.right = window.innerWidth / 2
    orthoCamera.top = window.innerHeight / 2
    orthoCamera.bottom = window.innerHeight / -2
    orthoCamera.updateProjectionMatrix()
  }
}

/**************************************************
 * 3. Run the app
 * 'runApp' will do most of the boilerplate setup code for you:
 * e.g. HTML container, window resize listener, mouse move/touch listener for shader uniforms, THREE.Clock() for animation
 * Executing this line puts everything together and runs the app
 * ps. if you don't use custom shaders, pass undefined to the 'uniforms'(2nd-last) param
 * ps. if you don't use post-processing, pass undefined to the 'composer'(last) param
 *************************************************/
runApp(app, scene, renderer, camera, true, uniforms, undefined)
