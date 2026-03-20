const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	path.resolve(monorepoRoot, "node_modules"),
];

// Force all tamagui-related imports to resolve from the mobile app's node_modules
// to avoid duplicate instances in pnpm monorepos
const tamaguiPkgs = ["tamagui", "@tamagui/core", "@tamagui/web", "@tamagui/config"];

function resolveTamaguiModule(name) {
	const resolved = path.resolve(projectRoot, "node_modules", name);
	if (fs.existsSync(resolved)) {
		const real = fs.realpathSync(resolved);
		return real;
	}
	return null;
}

const tamaguiResolvedPaths = {};
for (const pkg of tamaguiPkgs) {
	const resolved = resolveTamaguiModule(pkg);
	if (resolved) tamaguiResolvedPaths[pkg] = resolved;
}

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
	// If the import is for a tamagui package, force it to resolve from mobile's node_modules
	for (const [pkg, resolvedPath] of Object.entries(tamaguiResolvedPaths)) {
		if (moduleName === pkg) {
			return context.resolveRequest(
				{ ...context, resolveRequest: undefined },
				resolvedPath,
				platform,
			);
		}
	}

	if (defaultResolveRequest) {
		return defaultResolveRequest(context, moduleName, platform);
	}
	return context.resolveRequest(
		{ ...context, resolveRequest: undefined },
		moduleName,
		platform,
	);
};

module.exports = config;
