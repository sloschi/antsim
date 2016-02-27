function Ant(world, config, antModel) {
    'use strict';

    let position = config.position;
    
    let model = antModel;
    
    let directionHistory = new Array();;
    
    antModel.position.copy(position);
    antModel.position.y = 0.5;

    let probabilities = {
        north: 0.25,
        east: 0.25,
        south: 0.25,
        west: 0.25
    }

    function createProbabilityStack(probs) {
        let northInfluence = 0, 
        eastInfluence = 0, 
        southInfluence = 0, 
        westInfluence = 0;
        
        directionHistory.forEach(function (direction, index) {
            switch(direction) {
                case 'north':
                    northInfluence += directionHistory.length - (index - (directionHistory.length/2));
                    break;
                case 'east':
                    eastInfluence += directionHistory.length - (index - (directionHistory.length/2));
                    break;
                case 'south':
                    southInfluence += directionHistory.length - (index - (directionHistory.length/2));
                    break;
                case 'west':
                    westInfluence += directionHistory.length - (index - (directionHistory.length/2));
                    break;
            }
        });
        
        let influence = {north: true, east: true};
        if(influence.north) {
            northInfluence += 10;
        }
        if(influence.east) {
            eastInfluence += 10;
        }
        if(influence.south) {
            southInfluence += 10;
        }
        if(influence.west) {
            westInfluence += 10;
        }
        
        let sum = northInfluence + eastInfluence + southInfluence + westInfluence;
        northInfluence /= sum;
        eastInfluence /= sum;
        southInfluence /= sum;
        westInfluence /= sum;
        
        let randomWeighter = 9;
        let randomWeight = 1;
        let influencedWeight = randomWeighter - randomWeight;
        
        let north = 0,
            east = north + randomWeight * probs.north/randomWeighter + influencedWeight*northInfluence/randomWeighter,
            south = east + randomWeight * probs.east/randomWeighter + influencedWeight*eastInfluence/randomWeighter,
            west = south + randomWeight * probs.south/randomWeighter + influencedWeight*southInfluence/randomWeighter;

        return {
            north: north,
            east: east,
            south: south,
            west: west
        }
    }

    function getModel() {
        return model;
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
        
        directionHistory.push(dirName);
        if(directionHistory.length > 10) {
            directionHistory.shift();
        }
        
        
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
        
        antModel.position.copy(position);

        return {
            newPosition: position,
            action: 'default'
        }
    }

    function motivate() {

    }

    return {
        getModel: getModel,
        move: move
    }
}

module.exports = Ant;