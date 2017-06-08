import * as THREE from 'three';
import './MTLLoader';
import './OBJLoader';
import { polarToCartesian } from './helpers';

const RADIUS = 50;
const $score = document.getElementById('score');

function loadAsset(name) {
    return new Promise((resolve, reject) => {
        const mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath('assets/');
        mtlLoader.load(`${name}.mtl`, (materials) => {
            materials.preload();
            const objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('assets/');
            objLoader.load(`${name}.obj`, object => resolve(object), undefined, xhr => reject(xhr));
        }, undefined, xhr => reject(xhr));
    });
}

function wireframeSphereFactory(size) {
    const geometry = new THREE.SphereBufferGeometry(size, size, size);
    const wireframe = new THREE.WireframeGeometry(geometry);
    const line = new THREE.LineSegments(wireframe);
    line.material.depthTest = false;
    line.material.opacity = 0.25;
    line.material.transparent = true;
    return line;
}

function circleFactory() {
    const segmentCount = 64;
    const radius = RADIUS;
    const geometry = new THREE.Geometry();
    const material = new THREE.LineBasicMaterial({ color: 0xFFFFFF, opacity: 0.1, transparent: true });

    for (let i = 0; i <= segmentCount; i++) {
        const theta = (i / segmentCount) * Math.PI * 2;
        geometry.vertices.push(
            new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0),
        );
    }

    return new THREE.Line(geometry, material);
}

function shipFactory() {
    const container = new THREE.Object3D();
    // container.add(wireframeSphereFactory(6));
    loadAsset('ship').then((ship) => {
        ship.traverse((node) => {
            node.castShadow = true; // eslint-disable-line no-param-reassign
            if (node.material) {
                node.material.side = THREE.DoubleSide; // eslint-disable-line no-param-reassign
            }
        });
        ship.scale.multiplyScalar(12);
        ship.rotation.set(Math.PI / 2, Math.PI, 0);
        container.add(ship);
    });
    return container;
}

function islandFactory() {
    const container = new THREE.Object3D();
    loadAsset('island').then((island) => {
        island.scale.multiplyScalar(32);
        island.rotation.set(Math.PI / 2, 0, 0);
        island.position.set(0, 0, -8.5);
        island.traverse((node) => {
            node.castShadow = true; // eslint-disable-line no-param-reassign
        });
        container.add(island);
    });
    return container;
}

function waterFactory() {
    const geometry = new THREE.PlaneBufferGeometry(500, 500);
    const material = new THREE.ShadowMaterial({ opacity: 0.25 });
    const plane = new THREE.Mesh(geometry, material);
    plane.receiveShadow = true;
    return plane;
}

function coinFactory() {
    const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 0.5, 16),
        new THREE.MeshPhongMaterial({
            color: 0xffd800,
            shininess: 32,
            specular: 0xffff82,
        }),
    );
    cylinder.rotation.x = Math.PI / 2;
    cylinder.castShadow = true;
    return cylinder;
}

function cannonballFactory() {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(2, 32, 32),
        new THREE.MeshPhongMaterial({
            color: 0x23232d,
            shininess: 64,
            specular: 0x646478,
        }),
    );
    sphere.castShadow = true;
    return sphere;
}

function setup() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 200);
    camera.position.z = 100;

    // const axisHelper = new THREE.AxisHelper(10);
    // scene.add(axisHelper);

    // camera.position.set(0, -100, 30);
    // camera.up = new THREE.Vector3(0, 1, 0);
    // camera.lookAt(new THREE.Vector3(0, 0, 0));

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    ambientLight.color.setHSL(0.1, 1, 0.95);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
    hemisphereLight.color.setHSL(0.6, 1, 0.95);
    hemisphereLight.groundColor.setHSL(0.095, 1, 0.75);
    hemisphereLight.position.set(0, 0, 500);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.65);
    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(-1, 1, 1);
    directionalLight.position.multiplyScalar(50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 200;

//    const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
//    scene.add(cameraHelper);

    const circle = circleFactory();
    scene.add(circle);

    const ship = shipFactory();
    const water = waterFactory();
    const island = islandFactory();
    const coins = new THREE.Object3D();
    const cannonballs = new THREE.Object3D();

    scene.add(ship);
    scene.add(water);
    scene.add(island);
    scene.add(coins);
    scene.add(cannonballs);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    return (state) => {
        if (!coins.children.length) {
            state.get('coins').forEach((coin) => {
                const mesh = coinFactory();
                const position = polarToCartesian(coin.get('angle'), coin.get('radius'));
                mesh.position.x = position.x;
                mesh.position.y = position.y;
                coins.add(mesh);
            });
        }
        for (let i = 0; i < state.get('coins').size; i++) {
            coins.children[i].visible = !state.getIn(['coins', i, 'collected']);
        }

        if (!cannonballs.children.length) {
            for (let i = 0; i < 25; i++) {
                cannonballs.add(cannonballFactory());
            }
        }
        for (let i = 0; i < cannonballs.children.length; i++) {
            cannonballs.children[i].visible = false;
        }
        for (let i = 0; i < state.get('cannonballs').size; i++) {
            const cannonball = cannonballs.children[i];
            if (!cannonball) {
                cannonballs.add(cannonballFactory());
            } else {
                const position = polarToCartesian(
                    state.getIn(['cannonballs', i, 'angle'], 0),
                    state.getIn(['cannonballs', i, 'radius'], 0),
                );
                cannonball.position.x = position.x;
                cannonball.position.y = position.y;
                cannonball.visible = true;
            }
        }

        ship.rotation.z = state.getIn(['player', 'angle']) - (state.getIn(['player', 'direction']) > 0 ? 0 : Math.PI);
        const position = polarToCartesian(state.getIn(['player', 'angle']), state.getIn(['player', 'radius']));
        ship.position.x = position.x;
        ship.position.y = position.y;

        renderer.render(scene, camera);
        $score.innerHTML = state.get('score');
    };
}

export default setup;
