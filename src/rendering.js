import * as THREE from 'three';
import './MTLLoader';
import './OBJLoader';
import { polarToCartesian } from './helpers';

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

function circleFactory() {
    const segmentCount = 64;
    const radius = 50;
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
    loadAsset('ship').then((ship) => {
        ship.traverse((node) => {
            if (node.material) {
                // eslint-disable-next-line no-param-reassign
                node.material.side = THREE.DoubleSide;
            }
        });
        ship.scale.multiplyScalar(9);
        ship.rotation.set(Math.PI / 2, Math.PI, 0);
        container.add(ship);
    });
    return container;
}

function coinFactory() {
    const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 0.5, 16),
        new THREE.MeshPhongMaterial({
            color: 0x156289,
            emissive: 0x072534,
            shading: THREE.FlatShading,
        }),
    );
    cylinder.rotation.x = Math.PI / 2;

    return cylinder;
}

function cannonballFactory() {
    return new THREE.Mesh(
        new THREE.SphereGeometry(2, 32, 32),
        new THREE.MeshPhongMaterial({
            color: 0x156289,
            emissive: 0x072534,
            shading: THREE.FlatShading,
        }),
    );
}

function setup() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;

    const axisHelper = new THREE.AxisHelper(10);
    scene.add(axisHelper);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x333333, 1);
    document.body.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 500, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1, -1);
    dirLight.position.multiplyScalar(50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const circle = circleFactory();
    const ship = shipFactory();
    const coins = new THREE.Object3D();
    const cannonballs = new THREE.Object3D();

    scene.add(circle);
    scene.add(ship);
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
            }
        }

        ship.scale.y = state.getIn(['player', 'direction']);
        ship.rotation.z = state.getIn(['player', 'angle']);
        const position = polarToCartesian(state.getIn(['player', 'angle']), state.getIn(['player', 'radius']));
        ship.position.x = position.x;
        ship.position.y = position.y;

        renderer.render(scene, camera);
        $score.innerHTML = state.get('score');
    };
}

export default setup;
