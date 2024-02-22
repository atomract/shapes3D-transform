import * as T from 'three';
import * as dat from 'dat.gui';
import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new T.Scene();

    this.camera = new T.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    this.controls = new OrbitControls(this.camera, canvas);


    this.renderer = new T.WebGLRenderer({ canvas: this.canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const pointLight = new T.PointLight(0xffffff, 10, 1000);
    pointLight.position.set(0, 0, 3);
    this.scene.add(pointLight);

    const pointLight2 = new T.SpotLight(0xffffff, 10, 1000);
    pointLight2.position.set(-5, 0, -1);
    this.scene.add(pointLight2);

    // Add a directional light
    const directionalLight = new T.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0, 1, 0);
    this.scene.add(directionalLight);

    this.gui = new dat.GUI();

    this.shapes = this.createShapes();
    this.shapes.forEach(shape => this.scene.add(shape));

    this.raycaster = new T.Raycaster();
    this.mouse = new T.Vector2();

    // Add a click event listener to the canvas
    this.canvas.addEventListener('click', event => this.onCanvasClick(event));


    this.animate();
  }

  createShapes() {
    const geometry1 = new T.CylinderGeometry(0.6, 0.6, 1, 64,64);
    const geometry2 = new T.BoxGeometry(1, 1, 1);
    const geometry3 = new T.IcosahedronGeometry(0.5, 0);

    const material = new T.MeshPhongMaterial({ color: 0x0000ff, transparent: true, opacity: 0, metalness: 0.5, roughness: 0.5});

    const cylinder = new T.Mesh(geometry1, material);
    cylinder.position.x = -2.7;
    cylinder.name = 'cylinder';

    const cube = new T.Mesh(geometry2, material);
    cube.name = 'cube';


    const icosahedron = new T.Mesh(geometry3, material);
    icosahedron.position.x = 2.7;
    icosahedron.name = 'icosahedron';


    return [cylinder, cube, icosahedron];
  }

  onCanvasClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    for (let i = 0; i < intersects.length; i++) {
      // If the intersected object is a shape, create a GUI for it
      if (this.shapes.includes(intersects[i].object)) {
        this.createGui(intersects[i].object);
        const targetPosition = intersects[i].object.position.clone();
        if (intersects[i].object.geometry instanceof T.CylinderGeometry) {
          targetPosition.y += intersects[i].object.geometry.parameters.height / 2;
          targetPosition.z += 2;  // Adjust this value to place the camera at the desired distance
          targetPosition.x -= 2.4;  // Adjust this value to place the camera at the desired distance
          
        }
        else if (intersects[i].object.geometry instanceof T.IcosahedronGeometry) {
          // targetPosition.y += intersects[i].object.geometry.parameters.height / 2;
          targetPosition.z += 1;  // Adjust this value to place the camera at the desired distance
          targetPosition.x += 1;  // Adjust this value to place the camera at the desired distance
        } 
         else {
          targetPosition.z += 2;  // Adjust this value to place the camera at the desired distance
        }
  
        this.controls.enabled = false;
        new TWEEN.Tween(this.camera.position)
          .to(targetPosition, 2000)  // Adjust the duration as needed
          .easing(TWEEN.Easing.Quadratic.Out)
          .onComplete(() => {
            this.controls.enabled = true;
          })
          .start();
  
        new TWEEN.Tween(-this.camera.rotation)
          .to(intersects[i].object.rotation, 2000)  // Adjust the duration as needed
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();
  
        break;
      }
    }
  }

  createGui(shape) {
    // If a GUI for a shape already exists, remove it
    if (this.shapeGui) {
      this.gui.removeFolder(this.shapeGui);
    }

    // Create a new GUI for the shape
    this.shapeGui = this.gui.addFolder(shape.name);

    switch (shape.name) {
      case 'cube':
        this.shapeGui.add(shape.geometry.parameters, 'width', 0.1, 2.0).onChange(() => this.updateShape(shape));
        this.shapeGui.add(shape.geometry.parameters, 'height', 0.1, 2.0).onChange(() => this.updateShape(shape));
        this.shapeGui.add(shape.geometry.parameters, 'depth', 0.1, 2.0).onChange(() => this.updateShape(shape));
        break;
      case 'cylinder':
        this.shapeGui.add(shape.geometry.parameters, 'radiusTop', 0.1, 2.0).onChange(() => this.updateShape(shape));
        this.shapeGui.add(shape.geometry.parameters, 'height', 0.1, 2.0).onChange(() => this.updateShape(shape));
        break;
      case 'icosahedron':
        this.shapeGui.add(shape.geometry.parameters, 'radius', 0.1, 2.0).onChange(() => this.updateShape(shape));
        this.shapeGui.add(shape.geometry.parameters, 'detail', 1, 10).step(1).onChange(() => this.updateShape(shape));
        break;
    }
    this.shapeGui.open();
  }


  updateShape(shape) {
    const geometry = shape.geometry;
    const parameters = geometry.parameters;

    switch (shape.name) {
      case 'cube':
        geometry.dispose();
        shape.geometry = new T.BoxGeometry(parameters.width, parameters.height, parameters.depth);
        break;
      case 'cylinder':
        geometry.dispose();
        shape.geometry = new T.CylinderGeometry(parameters.radiusTop, parameters.radiusBottom, parameters.height, parameters.radialSegments);
        break;
      case 'icosahedron':
        geometry.dispose();
        shape.geometry = new T.IcosahedronGeometry(parameters.radius, parameters.detail);
        break;
    }
    
    this.createGui(shape);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.shapes.forEach(shape => {
  
      shape.material.opacity += 0.01;
      if (shape.material.opacity >= 0.99) {
        shape.material.opacity = 1;
      }
      shape.rotation.y += 0.005;
    });
    TWEEN.update();
    
  this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }
}