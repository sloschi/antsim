function Ant(world, config, antModel) {
    'use strict';

    let position = config.position;
    
    let model = antModel;

    let probabilities = {
        north: 0.25,
        east: 0.25,
        south: 0.25,
        west: 0.25
    }

    function createProbabilityStack(probs) {
        let north = probs.north,
            east = north + probs.east,
            south = east + probs.south,
            west = south + probs.west;

        return {
            north: north,
            east: east,
            south: south,
            west: west
        }
    }

    const moveMap = {
        north: { x: 0, y: 0, z: 1 },
        east: { x: 1, y: 0, z: 0 },
        south: { x: 0, y: 0, z: -1 },
        west: { x: -1, y: 0, z: 0 },
    }

    function applyDirection(pos, dir) {
        return {
            x: pos.x + dir.x,
            y: pos.y + dir.y,
            z: pos.z + dir.z
        };
    }

    function calculateNewPosition() {
        let dirProb = Math.random();
        let probs = createProbabilityStack(probabilities);
        let direction = { x: 0, y: 0, z: 0 };
        let dirName = '';

        Object.keys(probs).forEach((dir) => {
            if (probs[dir] <= dirProb) {
                direction = moveMap[dir];
                dirName = dir;
            }
        });
        
        
        let newPos = applyDirection(position, direction);
        
        if (newPos.x > world.size / 2 
            || newPos.z > world.size / 2 
            || newPos.x < -world.size / 2 
            || newPos.z < -world.size / 2) {
                let newDir = '';
                if (dirName === 'north') {
                    newDir = 'south';
                } else if (dirName === 'south') {
                    newDir = 'north';
                } else if (dirName === 'east') {
                    newDir = 'west';
                } else {
                    newDir = 'east';
                }
                
                newPos = applyDirection(position, moveMap[newDir]);
            }
            
            return newPos;
    }

    function move() {
        position = calculateNewPosition();

        return {
            newPosition: position,
            action: 'default'
        }
    }

    function motivate() {

    }

    return {
        move: move
    }
}

module.export = Ant;