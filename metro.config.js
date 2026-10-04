const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;

// Alias "@/" -> racine du projet, resolu cote Metro pour eviter
// d'ajouter babel-plugin-module-resolver aux dependances.
config.resolver.resolveRequest = (context, moduleName, platform) => {
	const resolve = context.resolveRequest;

	if (moduleName === '@' || moduleName.startsWith('@/')) {
		const aliased = path.resolve(projectRoot, moduleName.slice(2));

		return resolve(context, aliased, platform);
	}

	return resolve(context, moduleName, platform);
};

module.exports = config;
