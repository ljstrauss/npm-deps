/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  //TODO how do we get sails to allow decimals in the version path parameter? For now, pass the version in as a query paramter instead.
  'GET /v1/:name/:version': { action: 'package/dependencies', skipAssets: true },
  'GET /v1/:name': { action: 'package/dependencies', skipAssets: true }
};
