class SceneManager {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.objects = [];
    }

    addObject(object) {
        this.objects.push(object);
        this.scene.add(object);
    }

    removeObject(object) {
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
            this.scene.remove(object);
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        // Update logic for animations or interactions can be added here
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

export default SceneManager;