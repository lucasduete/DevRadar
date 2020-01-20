const axios = require(`axios`);
const Dev = require(`../models/Dev`);
const parseStringAsArray = require(`../utils/parseStringAsArray`);
const { findConnections, sendMessage } = require('../websocket');

module.exports = {
    async index(request, response) {
        const devs = await Dev.find();

        return response.json(devs);
    },

    async store(request, response) {
        const { github_username, techs, latitude, longitude } = request.body;

        let dev = await Dev.findOne({ github_username });

        if (!dev) {
            const github_api_response = await axios.get(`https://api.github.com/users/${github_username}`);

            const { name = login, avatar_url, bio } = github_api_response.data;

            const techsArray = parseStringAsArray(techs);

            const location = {
                type: `Point`,
                coordinates: [longitude, latitude],
            };

            dev = await Dev.create({
                github_username,
                name,
                avatar_url,
                bio,
                techs : techsArray,
                location
            });

            const sendSocketMessageTo = findConnections(
                { latitude, longitude },
                techsArray,
            );

            sendMessage(sendSocketMessageTo, 'new-dev', dev);
        }

        return response.json(dev);
    },

    async update(request, response) {
        const { github_username, techs, latitude, longitude } = request.query;

        const techsArray = parseStringAsArray(techs);

        await Dev.findOneAndUpdate(
            { github_username }, 
            {
                techs: techsArray,
                location: {
                    type: `Point`,
                    coordinates: [longitude, latitude],
                }
            }, 
            { upsert: false }, 
            function(err, doc) {
                if (err) return response.send(500, {error: err});
                return response.send('Succesfully saved.');
            }
        );

    },

    async destroy(request, response) {
        const { github_username } = request.query;

        await Dev.deleteOne({ github_username });

        return response.json({ "message": `user ${github_username} has been deleted` });
    },

};