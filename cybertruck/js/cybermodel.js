import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Rest of your existing CybermodelViewer class code remains the same

class CybermodelViewer {
    constructor() {
        this.container = document.getElementById('cybermodel-container');
        this.loadingIndicator = this.container.querySelector('.loading-indicator');
        this.isAutoRotating = false;
        this.isDragging = false;
        this.previousPosition = { x: 0, y: 0 };
        
        // Store bound event handlers
        this.boundOnMouseDown = this.onMouseDown.bind(this);
        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnMouseUp = this.onMouseUp.bind(this);
        this.boundOnTouchStart = this.onTouchStart.bind(this);
        this.boundOnTouchMove = this.onTouchMove.bind(this);
        this.boundOnTouchEnd = this.onTouchEnd.bind(this);
        this.boundOnWindowResize = this.onWindowResize.bind(this);

        this.initScene();
        this.loadModel();
        this.setupControls();
        this.setupEventListeners();
    }

    initScene() {
        this.scene = new THREE.Scene();
        const containerRect = this.container.getBoundingClientRect();
        
        this.camera = new THREE.PerspectiveCamera(
            45,
            containerRect.width / containerRect.height,
            0.1,
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.updateRendererSize();
        this.container.appendChild(this.renderer.domElement);
        this.addLights();
    }

    updateRendererSize() {
        const { width, height } = this.container.getBoundingClientRect();
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);
    }

    loadModel() {
        this.loadingIndicator.style.display = 'block';
        
        new GLTFLoader().load(
            './models/cybermodel/scene.gltf',
            (gltf) => {
                this.model = gltf.scene;
                this.optimizeModel();
                this.scene.add(this.model);
                this.fitModelToContainer();
                this.loadingIndicator.style.display = 'none';
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
                this.loadingIndicator.textContent = 'Error loading model';
            }
        );
    }

    optimizeModel() {
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.metalness = 0.9;
                child.material.roughness = 0.3;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    fitModelToContainer() {
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fovRad = this.camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / (2 * Math.tan(fovRad / 2)));

        this.camera.position.set(0, size.y * 0.3, cameraZ * 1.8);
        this.camera.lookAt(center);
    }

    setupControls() {
        document.getElementById('reset-view').addEventListener('click', () => {
            this.fitModelToContainer();
            this.model.rotation.set(0, 0, 0);
        });

        document.getElementById('toggle-rotation').addEventListener('click', () => {
            this.isAutoRotating = !this.isAutoRotating;
        });
    }

    setupEventListeners() {
        this.container.addEventListener('mousedown', this.boundOnMouseDown);
        document.addEventListener('mousemove', this.boundOnMouseMove);
        document.addEventListener('mouseup', this.boundOnMouseUp);
        
        this.container.addEventListener('touchstart', this.boundOnTouchStart);
        document.addEventListener('touchmove', this.boundOnTouchMove);
        document.addEventListener('touchend', this.boundOnTouchEnd);
        
        window.addEventListener('resize', this.boundOnWindowResize);
    }

    // Event handlers
    onMouseDown(e) {
        this.isDragging = true;
        this.previousPosition = { x: e.clientX, y: e.clientY };
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        this.handleRotation(e.clientX, e.clientY);
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onTouchStart(e) {
        this.isDragging = true;
        this.previousPosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    }

    onTouchMove(e) {
        if (!this.isDragging) return;
        this.handleRotation(e.touches[0].clientX, e.touches[0].clientY);
    }

    onTouchEnd() {
        this.isDragging = false;
    }

    handleRotation(clientX, clientY) {
        const deltaX = clientX - this.previousPosition.x;
        const deltaY = clientY - this.previousPosition.y;
        
        this.model.rotation.y += deltaX * 0.005;
        this.model.rotation.x += deltaY * 0.005;
        
        this.previousPosition = { x: clientX, y: clientY };
    }

    onWindowResize() {
        this.updateRendererSize();
        this.fitModelToContainer();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (this.isAutoRotating) this.model.rotation.y += 0.005;
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        window.removeEventListener('resize', this.boundOnWindowResize);
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}

const cybermodelViewer = new CybermodelViewer();
cybermodelViewer.animate();
