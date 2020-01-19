const axios = require(`axios`);
const Dev = require(`../models/Dev`);
const parseStringAsArray = require(`../utils/parseStringAsArray`);

module.exports = {

    async index(request, respose) {
        const { latitude, longitude, techs } = request.query;

        const techsArray = parseStringAsArray(techs);

        const devs = await Dev.find({
            techs: {
                $in: techsArray
            },
            location: {
                $near: {
                    $geometry: {
                        type: `Point`,
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: 10000,
                },
            },
        });

        return respose.json({ devs });
    }

};